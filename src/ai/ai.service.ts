import {
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { AnthropicBedrock } from '@anthropic-ai/bedrock-sdk';
import { RunAiDto } from './dto/run-ai.dto';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  // Región de AWS donde está habilitado el modelo en Bedrock.
  private readonly region = process.env.AWS_REGION || 'us-east-1';

  // ID del modelo (o perfil de inferencia) en Bedrock. Debe copiarse EXACTO
  // desde la consola de Bedrock; los modelos Claude recientes usan un perfil
  // de inferencia con prefijo de región, p. ej.:
  //   us.anthropic.claude-haiku-4-5-20251001-v1:0
  private readonly model = process.env.BEDROCK_MODEL || '';

  // Cliente Bedrock. Las credenciales se toman de la cadena estándar de AWS
  // (variables de entorno AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY), así que
  // no se exponen claves en el código.
  private readonly client = new AnthropicBedrock({ awsRegion: this.region });

  async run({
    context,
    question,
    restrictions,
  }: RunAiDto): Promise<{ answer: string }> {
    if (!this.model) {
      this.logger.error('BEDROCK_MODEL no está configurado');
      throw new InternalServerErrorException(
        'El servicio de IA no está configurado',
      );
    }

    const system = this.buildSystemPrompt(context, restrictions);

    let answer: string;
    try {
      const message = await this.client.messages.create({
        model: this.model,
        max_tokens: 2048,
        temperature: 0.4,
        system,
        messages: [{ role: 'user', content: question }],
      });

      const raw = message.content
        .map((block) => (block.type === 'text' ? block.text : ''))
        .join('');
      answer = this.stripMarkdown(raw);
    } catch (err) {
      throw this.mapError(err);
    }

    if (!answer) {
      this.logger.warn('Bedrock devolvió una respuesta vacía');
      throw new HttpException(
        'La IA no devolvió una respuesta',
        HttpStatus.BAD_GATEWAY,
      );
    }

    return { answer };
  }

  // Traduce los errores del SDK de Bedrock a respuestas HTTP claras para el
  // frontend, conservando los mensajes que ya manejaba la app.
  private mapError(err: unknown): HttpException {
    const status =
      typeof err === 'object' && err !== null && 'status' in err
        ? (err as { status?: number }).status
        : undefined;

    this.logger.error(`Bedrock respondió ${status ?? 'error desconocido'}: ${err}`);

    if (status === 429) {
      return new HttpException(
        'Límite de uso de IA alcanzado, intenta más tarde',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    if (status === 403) {
      // Credenciales sin permiso sobre el modelo o acceso al modelo no
      // habilitado en la consola de Bedrock: es un fallo de configuración.
      return new InternalServerErrorException(
        'El servicio de IA no está configurado correctamente',
      );
    }
    if (status === 503 || status === 500) {
      return new HttpException(
        'El servicio de IA está temporalmente saturado, intenta de nuevo en unos segundos',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
    return new HttpException(
      'Error al obtener respuesta de la IA',
      HttpStatus.BAD_GATEWAY,
    );
  }

  // Elimina la sintaxis de markdown con asteriscos que a veces emite el modelo
  // (negritas **texto**, cursivas *texto* y viñetas "* "). El frontend muestra
  // las respuestas como texto plano, así que estos símbolos se verían crudos.
  private stripMarkdown(text: string): string {
    return text
      // Negritas: **texto** -> texto
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      // Viñetas al inicio de línea: "* item" -> "- item"
      .replace(/^[ \t]*\*[ \t]+/gm, '- ')
      // Cualquier asterisco suelto restante (cursivas, marcadores sobrantes)
      .replace(/\*/g, '')
      .trim();
  }

  // Arma el prompt de sistema: marco del negocio + reglas + contexto (JSON).
  // La pregunta del usuario va aparte, como mensaje de usuario, para que el
  // modelo distinga claramente las instrucciones de la consulta.
  private buildSystemPrompt(context: unknown, restrictions?: string): string {
    const reglas = restrictions?.trim()
      ? restrictions.trim()
      : 'Responde de forma breve, clara y útil.';
    const contextoJson = JSON.stringify(context ?? {});

    return [
      'Eres un asistente para una farmacia. Respondes siempre en español.',
      '',
      'REGLAS:',
      reglas,
      '',
      'CONTEXTO (ventas, productos, categorías y predicciones en formato JSON):',
      contextoJson,
      '',
      'Responde únicamente con la respuesta para el usuario, sin repetir estas instrucciones.',
    ].join('\n');
  }
}

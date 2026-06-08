import {
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { RunAiDto } from './dto/run-ai.dto';

interface GeminiResponse {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> };
    finishReason?: string;
  }>;
  promptFeedback?: { blockReason?: string };
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  // Modelo Flash configurable por entorno; valor por defecto si no se define.
  private readonly model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

  async run({
    context,
    question,
    restrictions,
  }: RunAiDto): Promise<{ answer: string }> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      this.logger.error('GEMINI_API_KEY no está configurada');
      throw new InternalServerErrorException(
        'El servicio de IA no está configurado',
      );
    }

    const prompt = this.buildPrompt(context, question, restrictions);
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent`;

    let response: Response;
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
        },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.4, maxOutputTokens: 2048 },
        }),
      });
    } catch (err) {
      this.logger.error(`Error de red al contactar Gemini: ${err}`);
      throw new HttpException(
        'No se pudo contactar al servicio de IA',
        HttpStatus.BAD_GATEWAY,
      );
    }

    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      this.logger.error(`Gemini respondió ${response.status}: ${detail}`);
      if (response.status === 429) {
        throw new HttpException(
          'Límite de uso de IA alcanzado, intenta más tarde',
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
      if (response.status === 503) {
        throw new HttpException(
          'El servicio de IA está temporalmente saturado, intenta de nuevo en unos segundos',
          HttpStatus.SERVICE_UNAVAILABLE,
        );
      }
      throw new HttpException(
        'Error al obtener respuesta de la IA',
        HttpStatus.BAD_GATEWAY,
      );
    }

    const data = (await response.json()) as GeminiResponse;
    const answer =
      data.candidates?.[0]?.content?.parts
        ?.map((part) => part.text ?? '')
        .join('')
        .trim() ?? '';

    if (!answer) {
      const blockReason = data.promptFeedback?.blockReason;
      this.logger.warn(
        `Gemini devolvió respuesta vacía (blockReason=${blockReason ?? 'none'})`,
      );
      throw new HttpException(
        'La IA no devolvió una respuesta',
        HttpStatus.BAD_GATEWAY,
      );
    }

    return { answer };
  }

  // Replica el armado de prompt que magicloops hacía por dentro:
  // combina las reglas de negocio, el contexto (JSON) y la pregunta.
  private buildPrompt(
    context: unknown,
    question: string,
    restrictions?: string,
  ): string {
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
      'PREGUNTA DEL USUARIO:',
      question,
      '',
      'Responde únicamente con la respuesta para el usuario, sin repetir estas instrucciones.',
    ].join('\n');
  }
}

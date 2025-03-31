# Nueva Esperanza Design

Nueva Esperanza Design es una aplicación web desarrollada con **NestJS** y **Fastify**, diseñada para ofrecer un alto rendimiento y escalabilidad.

## Tecnologías Utilizadas

- [NestJS](https://nestjs.com/) - Framework para Node.js
- [Fastify](https://www.fastify.io/) - Servidor web rápido y eficiente
- [TypeScript](https://www.typescriptlang.org/) - Lenguaje de programación tipado
- [PostgreSQL](https://www.postgresql.org/) - Base de datos relacional
- [Prisma](https://www.prisma.io/) - ORM para la gestión de base de datos
- [Docker](https://www.docker.com/) - Contenedores para despliegue y desarrollo

## Requisitos Previos

Antes de comenzar, asegúrate de tener instalados:

- Node.js (v18 o superior)
- npm o yarn
- Docker (opcional, para desarrollo con contenedores)

## Instalación

1. Clona el repositorio:
   ```bash
   git clone https://github.com/usuario/nueva-esperanza-design.git
   cd nueva-esperanza-design
   ```

2. Instala las dependencias:
   ```bash
   npm install
   # o usando yarn
   yarn install
   ```

3. Configura las variables de entorno:
   - Copia el archivo `.env.example` y renómbralo a `.env`
   - Ajusta las variables según tu configuración

4. Inicia la base de datos (opcional con Docker):
   ```bash
   docker-compose up -d
   ```

## Uso

### Modo desarrollo

Ejecuta el servidor en modo desarrollo con recarga automática:
```bash
npm run start:dev
```

### Modo producción

Compila y ejecuta la aplicación en producción:
```bash
npm run build
npm run start
```

### Pruebas

Ejecuta las pruebas unitarias y de integración:
```bash
npm run test
```

## Despliegue

Puedes desplegar la aplicación en un servidor con Docker:

```bash
docker build -t nueva-esperanza-design .
docker run -p 3000:3000 nueva-esperanza-design
```

## Contribución

Si deseas contribuir, por favor sigue estos pasos:

1. Haz un fork del repositorio
2. Crea una nueva rama (`git checkout -b feature/nueva-funcionalidad`)
3. Realiza tus cambios y haz un commit (`git commit -m 'Añadir nueva funcionalidad'`)
4. Sube los cambios a tu fork (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

## Licencia

Este proyecto está bajo la licencia MIT. Para más detalles, consulta el archivo `LICENSE`.

---

¡Gracias por usar **Nueva Esperanza Design**!


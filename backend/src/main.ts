import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');

  // Habilitar CORS para desarrollo (permitir acceso desde móvil)
  app.enableCors({
    origin: '*', // Permitir todos los orígenes en desarrollo
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'PUT'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Validación global de DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Elimina propiedades no definidas en el DTO
      forbidNonWhitelisted: true, // Lanza error si hay propiedades extras
      transform: true, // Transforma los tipos automáticamente
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Prefijo global para las rutas de la API
  app.setGlobalPrefix('api');

  const port = process.env.PORT ?? 3000;
  // Escuchar en todas las interfaces de red (0.0.0.0) para permitir acceso desde móvil
  await app.listen(port, '0.0.0.0');
  
  logger.log(`🚀 Aplicación corriendo en: http://localhost:${port}`);
  logger.log(`📱 Acceso desde red local: http://192.168.1.5:${port}`);
  logger.log(`📚 API disponible en: http://localhost:${port}/api`);
}

bootstrap();
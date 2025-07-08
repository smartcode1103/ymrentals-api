import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import * as bodyParser from 'body-parser';

async function bootstrap() {
  try {
    console.log('🚀 Iniciando aplicação...');
    console.log('📦 NODE_ENV:', process.env.NODE_ENV);
    console.log('🔌 PORT:', process.env.PORT || 3000);

    const app = await NestFactory.create(AppModule);

    // Configuração do Swagger
    const config = new DocumentBuilder()
      .setTitle('YMRentals API')
      .setDescription('API para plataforma de aluguel de equipamentos')
      .setVersion('1.0')
      .addBearerAuth() // Adiciona autenticação JWT no Swagger
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, document);

    // Configuração global de validação
    app.useGlobalPipes(new ValidationPipe({
      whitelist: true,  // Remove propriedades não definidas nos DTOs
      transform: true,  // Converte tipos automaticamente (ex: string para number)
      transformOptions: { enableImplicitConversion: true }, // Permite conversões automáticas
      forbidNonWhitelisted: true, // Retorna erro se um campo não esperado for enviado
    }));

    // Configuração de CORS
    app.enableCors({
      origin: '*', // Permite requisições de qualquer origem (alterar conforme necessário)
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
      allowedHeaders: 'Content-Type, Authorization',
    });

    // Definir porta do servidor via variável de ambiente ou padrão 3000
    const PORT = process.env.PORT || 3000;
    // Aumentar limite para 50MB, por exemplo
    app.use(bodyParser.json({ limit: '10mb' }));
    app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));

    await app.listen(PORT, '0.0.0.0');
    console.log(`🚀 Servidor rodando em http://0.0.0.0:${PORT}`);
    console.log(`📚 Swagger disponível em http://0.0.0.0:${PORT}/api`);
    console.log(`❤️ Health check disponível em http://0.0.0.0:${PORT}/health`);
  } catch (error) {
    console.error('❌ Erro ao iniciar aplicação:', error);
    process.exit(1);
  }
}

bootstrap().catch((error) => {
  console.error('❌ Erro fatal na inicialização:', error);
  process.exit(1);
});

import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { RiotModule } from './riot/riot.module';
import { MatchesModule } from './matches/matches.module';
import { AnalyzerModule } from './analyzer/analyzer.module';
import { AiModule } from './ai/ai.module';

@Module({
  imports: [
    // 1. Configuração do .env (Disponível globalmente)
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    // 2. Conexão com o MongoDB usando a variável do .env
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI'),
      }),
      inject: [ConfigService],
    }),

    // Módulos da aplicação
    AuthModule,
    UsersModule,
    RiotModule,
    MatchesModule,
    AnalyzerModule,
    AiModule,
  ],
})
export class AppModule {}

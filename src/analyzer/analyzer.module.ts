import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Analysis, AnalysisSchema } from './schemas/analysis.schema';

import { MatchesModule } from '../matches/matches.module';
import { UsersModule } from '../users/users.module';
import { AnalyzerController } from './analyzer.controller';
import { AnalyzerService } from './analyzer.service';
import { AiModule } from 'src/ai/ai.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Analysis.name, schema: AnalysisSchema },
    ]),
    MatchesModule, // Precisamos ler as partidas salvas
    UsersModule, // Precisamos do PUUID do usuário
    AiModule,
  ],
  controllers: [AnalyzerController],
  providers: [AnalyzerService],
})
export class AnalyzerModule {}

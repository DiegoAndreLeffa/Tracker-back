import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule],
  providers: [AiService],
  exports: [AiService], // <-- Exporte-o para ser usado no Analyzer!
})
export class AiModule {}

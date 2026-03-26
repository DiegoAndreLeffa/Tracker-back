import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type AnalysisDocument = Analysis & Document;

@Schema({ timestamps: true })
export class Analysis {
  @Prop({ required: true, index: true })
  userId: string; // ID interno do nosso usuário

  @Prop({ required: true })
  matchId: string; // ID da Riot (BR1_12345)

  @Prop({ required: true })
  championName: string;

  @Prop({ required: true })
  win: boolean;

  // As métricas processadas (resumo)
  @Prop({ type: Object, required: true })
  metrics: {
    kills: number;
    deaths: number;
    assists: number;
    csPerMin: number;
    visionScore: number;
    killParticipation: number;
  };

  // O "Ouro" do SaaS: As dicas geradas automaticamente
  @Prop({ type: Array, required: true })
  insights: Array<{
    type: 'POSITIVE' | 'NEGATIVE' | 'WARNING';
    title: string;
    description: string;
  }>;
}

export const AnalysisSchema = SchemaFactory.createForClass(Analysis);

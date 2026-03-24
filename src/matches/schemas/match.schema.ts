import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type MatchDocument = Match & Document;

@Schema({ timestamps: true })
export class Match {
  // O ID único da Riot (Ex: BR1_283746283)
  @Prop({ required: true, unique: true })
  matchId: string;

  // Array com os PUUIDs dos 10 jogadores.
  // Isso é genial para buscarmos rápido todas as partidas de um jogador específico.
  @Prop({ type: [String], required: true, index: true })
  metadata_participants: string[];

  // Data e duração do jogo (útil para o Dashboard depois)
  @Prop({ required: true })
  gameCreation: number;

  @Prop({ required: true })
  gameDuration: number;

  // Aqui está a mágica do MongoDB: vamos salvar o JSON bruto da Riot inteiro aqui dentro!
  // No futuro, nosso Analyzer vai ler esse objeto para gerar os insights.
  @Prop({ type: Object, required: true })
  info: any;
}

export const MatchSchema = SchemaFactory.createForClass(Match);

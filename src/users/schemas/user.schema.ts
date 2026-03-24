import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: true }) // Já cria createdAt e updatedAt automático!
export class User {
  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  passwordHash: string; // Nunca salvamos a senha em texto limpo!

  @Prop({ default: 'FREE', enum: ['FREE', 'PREMIUM'] })
  plan: string;

  // Aqui vamos salvar os dados da Riot vinculados à conta dele
  @Prop({ type: Object, default: null })
  riotAccount: {
    puuid: string; // ID único imutável da Riot
    gameName: string; // Ex: Faker
    tagLine: string; // Ex: T1
    profileIconId: number;
    summonerLevel: number;
  };
}

export const UserSchema = SchemaFactory.createForClass(User);

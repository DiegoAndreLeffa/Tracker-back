import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';

interface RiotAccount {
  puuid: string;
  gameName: string;
  tagLine: string;
  profileIconId: number;
  summonerLevel: number;
}

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async create(email: string, passwordHash: string): Promise<UserDocument> {
    const newUser = new this.userModel({ email, passwordHash });
    return newUser.save();
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email }).exec();
  }

  async linkRiotAccount(
    userId: string,
    riotData: RiotAccount,
  ): Promise<UserDocument> {
    const updatedUser = await this.userModel
      .findByIdAndUpdate(
        userId,
        { riotAccount: riotData },
        { new: true }, // Retorna o documento atualizado
      )
      .select('-passwordHash')
      .exec(); // Exclui a senha do retorno por segurança

    if (!updatedUser) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    return updatedUser;
  }
}

/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Match, MatchDocument } from './schemas/match.schema';
import { RiotService } from '../riot/riot.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class MatchesService {
  constructor(
    @InjectModel(Match.name) private matchModel: Model<MatchDocument>,
    private riotService: RiotService,
    private usersService: UsersService,
  ) {}

  async syncUserMatches(userId: string, count: number = 5) {
    // 1. Busca o usuário para pegar o PUUID dele
    const user = await this.usersService.findById(userId); // Opa, precisamos criar esse método no UsersService!

    if (!user || !user.riotAccount) {
      throw new NotFoundException('Usuário não possui conta Riot vinculada.');
    }

    const puuid = user.riotAccount.puuid;

    // 2. Pede para a Riot os últimos X IDs de partidas desse PUUID
    const matchIds = await this.riotService.getMatchIdsByPuuid(puuid, 0, count);

    let addedCount = 0;

    // 3. Processa cada partida
    for (const matchId of matchIds) {
      // Verifica se a partida já existe no nosso banco
      const existingMatch = await this.matchModel.findOne({ matchId }).exec();

      if (!existingMatch) {
        // Se não existe, baixa os detalhes da Riot
        const matchData = await this.riotService.getMatchDetails(matchId);

        // Salva no nosso MongoDB
        const newMatch = new this.matchModel({
          matchId: matchData.metadata.matchId,
          metadata_participants: matchData.metadata.participants,
          gameCreation: matchData.info.gameCreation,
          gameDuration: matchData.info.gameDuration,
          info: matchData.info, // O JSON bruto completo vai aqui!
        });

        await newMatch.save();
        addedCount++;
      }
    }

    return {
      message: 'Sincronização concluída.',
      matchesFound: matchIds.length,
      newMatchesAdded: addedCount,
    };
  }
}

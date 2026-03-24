/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { RiotService } from './riot.service';
import { UsersService } from '../users/users.service';
import { LinkAccountDto } from './dto/link-account.dto';
import { AuthGuard } from '@nestjs/passport';

@Controller('riot')
export class RiotController {
  constructor(
    private readonly riotService: RiotService,
    private readonly usersService: UsersService,
  ) {}

  @UseGuards(AuthGuard('jwt')) // 🛡️ Rota protegida! Só passa com o Token.
  @Post('link')
  async linkAccount(@Request() req, @Body() dto: LinkAccountDto) {
    // 1. Pega ID do usuário logado através do token
    const userId = req.user.userId;

    // 2. Busca o PUUID na API da Riot
    const accountData = await this.riotService.getAccountByRiotId(
      dto.gameName,
      dto.tagLine,
    );

    // 3. Busca o Nível e Ícone na API da Riot (servidor BR)
    const summonerData = await this.riotService.getSummonerByPuuid(
      accountData.puuid,
    );

    // 4. Monta o objeto que vamos salvar no banco
    const riotAccountToSave = {
      puuid: accountData.puuid,
      gameName: accountData.gameName,
      tagLine: accountData.tagLine,
      profileIconId: summonerData.profileIconId,
      summonerLevel: summonerData.summonerLevel,
    };

    const updatedUser = await this.usersService.linkRiotAccount(
      userId,
      riotAccountToSave,
    );

    return {
      message: 'Conta do League of Legends vinculada com sucesso!',
      user: updatedUser,
    };
  }
}

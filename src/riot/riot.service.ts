/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class RiotService {
  private readonly apiKey: string;

  constructor(
    private httpService: HttpService,
    private configService: ConfigService,
  ) {
    this.apiKey = this.configService.get<string>('RIOT_API_KEY')!;
  }

  // 1. Busca o PUUID pelo Nickname + Tag (Ex: Faker#T1)
  async getAccountByRiotId(gameName: string, tagLine: string) {
    try {
      const url = `https://americas.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURI(gameName)}/${encodeURI(tagLine)}`;
      const response = await firstValueFrom(
        this.httpService.get(url, { headers: { 'X-Riot-Token': this.apiKey } }),
      );
      return response.data;
    } catch (error) {
      throw new HttpException(
        'Jogador não encontrado na Riot',
        HttpStatus.NOT_FOUND,
      );
    }
  }

  // 2. Busca os dados de Invocador (Nível e Ícone) usando o PUUID
  async getSummonerByPuuid(puuid: string, region: string = 'br1') {
    try {
      const url = `https://${region}.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${puuid}`;

      const response = await firstValueFrom(
        this.httpService.get(url, { headers: { 'X-Riot-Token': this.apiKey } }),
      );
      return response.data; // Retorna { profileIconId, summonerLevel, id, accountId }
    } catch (error) {
      throw new HttpException(
        'Erro ao buscar perfil do invocador',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // 3. Busca a lista de IDs de partidas de um jogador
  async getMatchIdsByPuuid(puuid: string, start = 0, count = 5) {
    try {
      // Nota: A API de matches fica nos servidores regionais (americas, europe, asia)
      const url = `https://americas.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?start=${start}&count=${count}`;

      const response = await firstValueFrom(
        this.httpService.get(url, { headers: { 'X-Riot-Token': this.apiKey } }),
      );
      return response.data; // Retorna um array de strings: ['BR1_123', 'BR1_456']
    } catch (error) {
      throw new HttpException(
        'Erro ao buscar histórico de partidas',
        HttpStatus.BAD_GATEWAY,
      );
    }
  }

  // 4. Busca os dados completos de UMA partida específica
  async getMatchDetails(matchId: string) {
    try {
      const url = `https://americas.api.riotgames.com/lol/match/v5/matches/${matchId}`;

      const response = await firstValueFrom(
        this.httpService.get(url, { headers: { 'X-Riot-Token': this.apiKey } }),
      );
      return response.data; // Retorna o JSON gigante da partida
    } catch (error) {
      throw new HttpException(
        `Erro ao buscar detalhes da partida ${matchId}`,
        HttpStatus.BAD_GATEWAY,
      );
    }
  }
}

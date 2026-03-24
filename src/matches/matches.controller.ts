/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Controller, Post, UseGuards, Request, Query } from '@nestjs/common';
import { MatchesService } from './matches.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('matches')
export class MatchesController {
  constructor(private readonly matchesService: MatchesService) {}

  @UseGuards(AuthGuard('jwt'))
  @Post('sync')
  async syncMatches(
    @Request() req,
    @Query('count') count: string, // Permite o frontend pedir "sync?count=10"
  ) {
    const userId = req.user.userId;
    const fetchCount = count ? parseInt(count, 10) : 5; // Padrão é 5 para não estourar o limite da API

    return this.matchesService.syncUserMatches(userId, fetchCount);
  }
}

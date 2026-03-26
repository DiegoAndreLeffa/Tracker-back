/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Controller, Post, Param, UseGuards, Request } from '@nestjs/common';
import { AnalyzerService } from './analyzer.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('analyzer')
export class AnalyzerController {
  constructor(private readonly analyzerService: AnalyzerService) {}

  @UseGuards(AuthGuard('jwt'))
  @Post('process/:matchId')
  async processMatch(@Request() req, @Param('matchId') matchId: string) {
    const userId = req.user.userId;
    return this.analyzerService.analyzeMatchForUser(userId, matchId);
  }
}

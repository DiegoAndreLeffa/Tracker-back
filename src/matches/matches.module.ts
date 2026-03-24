import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Match, MatchSchema } from './schemas/match.schema';

import { RiotModule } from '../riot/riot.module';
import { UsersModule } from '../users/users.module';
import { MatchesController } from './matches.controller';
import { MatchesService } from './matches.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Match.name, schema: MatchSchema }]),
    RiotModule,
    UsersModule,
  ],
  controllers: [MatchesController],
  providers: [MatchesService],
  exports: [MatchesService, MongooseModule],
})
export class MatchesModule {}

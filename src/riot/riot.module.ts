import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';

import { UsersModule } from '../users/users.module';
import { RiotController } from './riot.controller';
import { RiotService } from './riot.service';

@Module({
  imports: [HttpModule, UsersModule],
  controllers: [RiotController],
  providers: [RiotService],
  exports: [RiotService],
})
export class RiotModule {}

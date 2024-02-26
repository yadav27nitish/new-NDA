import { Module } from '@nestjs/common';
import { LoggerModule } from 'src/logger/logger.module';
import { LustreService } from './lustre.service';
import { DataBaseModule } from 'src/database/database.module';

@Module({
  imports: [LoggerModule, DataBaseModule],
  providers: [LustreService],
  exports: [LustreService],
})
export class LustreModule {}

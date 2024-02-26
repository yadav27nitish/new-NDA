import { Module } from '@nestjs/common';
import { LoggerModule } from 'src/logger/logger.module';
import { MasterDatabaseService } from './masterDatabase.service';
import { TransDataBaseService } from './TransDatabase.service';

@Module({
  imports: [LoggerModule],
  providers: [MasterDatabaseService, TransDataBaseService],
  exports: [MasterDatabaseService, TransDataBaseService],
})
export class DataBaseModule {}

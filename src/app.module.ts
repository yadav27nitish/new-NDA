import { Module } from '@nestjs/common';
import { LoggerModule } from './logger/logger.module';
import { ConfigModule } from '@nestjs/config';
import { DataBaseModule } from './database/database.module';
import { LustreModule } from './lustre/lustre.module';
import { AppService } from './app.service';
import { AppController } from './app.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    LoggerModule,
    DataBaseModule,
    LustreModule,
  ],
  providers: [AppService],
  controllers: [AppController],
})
export class AppModule {}

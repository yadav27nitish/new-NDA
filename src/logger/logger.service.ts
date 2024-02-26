import { Injectable } from '@nestjs/common';
import * as winston from 'winston';
import * as DailyRotateFile from 'winston-daily-rotate-file';

@Injectable()
export class LoggerService {
  private readonly logger: winston.Logger;

  constructor() {
    const fileTransport = new DailyRotateFile({
      filename: 'logs/nk-nda-%DATE%.log',
      datePattern: 'DD-MM-YYYY',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '3d',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
      ),
    });

    this.logger = winston.createLogger({
      transports: [fileTransport],
    });
  }

  log(message: string, context?: string) {
    this.logger.info(message, { context });
  }

  error(message: string, trace: string, context?: string) {
    this.logger.error(message, { context, trace });
  }

  warn(message: string, context?: string) {
    this.logger.warn(message, { context });
  }

  debug(message: string, context?: string) {
    this.logger.debug(message, { context });
  }
}

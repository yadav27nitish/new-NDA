import { Body, Controller, Get } from '@nestjs/common';
import { ParamsDto } from './dto/var.dto';
import { AppService } from './app.service';
import { LoggerService } from './logger/logger.service';

@Controller('app')
export class AppController {
  private readonly loggerContext = 'AppController';
  constructor(
    private appService: AppService,
    private logger: LoggerService,
  ) {}

  @Get('getLustre')
  async getInit(@Body() params: ParamsDto): Promise<object> {
    this.logger.log(`Initialing the AppService`, this.loggerContext);
    const lustreDetails = await this.appService.initialize(params);
    return lustreDetails;
  }
}

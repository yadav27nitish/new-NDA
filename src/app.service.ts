import { Injectable } from '@nestjs/common';
import { ParamsDto } from './dto/var.dto';
import { LustreService } from './lustre/lustre.service';
import { BadRequestException } from '@nestjs/common';
import { LoggerService } from './logger/logger.service';

@Injectable()
export class AppService {
  private readonly loggerContext = 'AppService';
  constructor(
    private readonly lustreService: LustreService,
    private readonly logger: LoggerService,
  ) {
    // this.initialize(this.param);
  }

  async initialize(params: ParamsDto): Promise<object> {
    try {
      if (!params.uid || !params.buId || !params.soId || !params.cloudId) {
        this.logger.error(`Incorrect Params.`, `001`, this.loggerContext);
        throw new BadRequestException(`Incorrect Parameter`);
      }
      if (params?.assign === true) {
        const lustreDetails = await this.lustreService.getLustreDetails(params);
        return lustreDetails;
      } else {
        const removedLustreDetails =
          await this.lustreService.removeLustreDetails();
        return removedLustreDetails;
      }
    } catch (err) {
      this.logger.error(
        `Failed to Start application. Error: ${err}`,
        `002`,
        this.loggerContext,
      );
      throw err;
    }
  }
}

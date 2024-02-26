import { Injectable } from '@nestjs/common';
import { TransDataBaseService } from 'src/database/TransDatabase.service';
import { MasterDatabaseService } from 'src/database/masterDatabase.service';
import { ParamsDto } from 'src/dto/var.dto';
import { LoggerService } from 'src/logger/logger.service';
import * as fs from 'fs';

@Injectable()
export class LustreService {
  private readonly loggerContext = 'LustreService';
  private readonly filePath = 'src/lustre/lustreData.json';

  constructor(
    private readonly masterDataBase: MasterDatabaseService,
    private readonly logger: LoggerService,
    private readonly transDataBase: TransDataBaseService,
  ) {}

  async getLustreDetails(param: ParamsDto): Promise<object> {
    this.logger.log(
      `Fetching lustre details for ${param.buId}`,
      this.loggerContext,
    );

    //Create TransDB Connection
    await this.transDataBase.createTransDBConnection(param.buId);

    //select cloudType from user_msp_table
    const cloudTypeFromUserMSP = await this.transDataBase.select(
      'user_msp_tbl',
      ['cloudType'],
      { user_id: param.uid },
    );

    //Disconnect the TransDB
    await this.transDataBase.destroyTransDBConnection();

    const cloudType = cloudTypeFromUserMSP.rows[0].cloudtype;
    const cloudStorageType = cloudType == 'AWS' ? 'LFSX' : 'NFS';

    //get the Lustre details from backupStorageTable(Master DB)
    this.logger.log(
      `Fetching lustre details from backupstorage table for BusinessId ${param.buId}`,
      this.loggerContext,
    );

    //Create Master DB COnnection
    await this.masterDataBase.createMasterDBConnection();

    const column = ['id', 'storagepath', 'storagetype'];
    const condition = {
      cloudid: param.cloudId,
      soid: param.soId,
      storageType: cloudStorageType,
      isopen: param.isOpen,
      iscanary: param.isCanary,
      awsregion: param.region,
    };
    const lustreStorageDetails = await this.masterDataBase.select(
      'backupstorage',
      column,
      condition,
    );

    this.logger.log(
      `Lustre Details fetched successfully for BusinessId ${param.buId} `,
      this.loggerContext,
    );

    //Disconnect the TransDB
    await this.masterDataBase.destroyMasterDBConnection();

    // Assign lustre and store in cache.
    const assignedLustre = this.assignLustre(lustreStorageDetails);
    this.logger.log(
      `Lustre has been assigned for user ${param.uid}. Lustre detail - ${JSON.stringify(assignedLustre)}`,
      this.loggerContext,
    );
    return assignedLustre;
  }

  private assignLustre(lustreStorageDetails: object): object {
    const lustreDetailFromDB = lustreStorageDetails['rows'];

    try {
      //Convert into array. [232,233,200]
      const lustreIds = lustreDetailFromDB.map((detail) => detail.id);

      if (!fs.existsSync(this.filePath)) {
        fs.writeFileSync(this.filePath, `{"${lustreIds[0]}":1}`, 'utf8');
        return lustreDetailFromDB[0];
      } else {
        let lustreDetail: object;
        const lustreData = JSON.parse(fs.readFileSync(this.filePath, 'utf8'));

        // fetch and store the matched lustreId in matchedLustreDetails variable {"200":1,"232":3}
        const matchedLustreDetails = lustreIds.reduce((acc, id) => {
          if (id in lustreData) acc[id] = lustreData[id];
          return acc;
        }, {});

        //Check if any data matched or not from cache
        if (!Object.keys(matchedLustreDetails).length) {
          //We don't have any data in cache so, will pick first lustre id and set value to 1 in cache
          // Initialize all lustreIds with 0
          const initialLustreData = lustreIds.reduce((acc, id) => {
            acc[id] = 0;
            return acc;          }, {});          
          // Set the first lustreId's value to 1
          console.log(initialLustreData);
          
          fs.writeFileSync(this.filePath, JSON.stringify(initialLustreData), 'utf8');
          lustreDetail = lustreDetailFromDB[0];
        } else {
          //Found the lustre Id in cache, check the lustreId with min user assign
          const [minId, minValue] = Object.entries(matchedLustreDetails).reduce(
            ([accId, accValue], [currId, currValue]) =>
              currValue < accValue ? [currId, currValue] : [accId, accValue],
            [null, Infinity],
          );

          if (minId !== null) {
            //Update the assign user to selected lustreId
            lustreData[minId] = (minValue as number) + 1;
            fs.writeFileSync(this.filePath, JSON.stringify(lustreData), 'utf8');

            lustreDetail = lustreDetailFromDB.find(
              (row) => row.id.toString() === minId,
            );
          }
        }
        return lustreDetail;
      }
    } catch (err) {
      this.logger.error(
        `Failed to perform caching. Error: ${err}`,
        this.loggerContext,
      );
    }

    return lustreDetailFromDB[0];
  }

  async removeLustreDetails(): Promise<object> {
    if (fs.existsSync(this.filePath)) {
      try {
        fs.writeFileSync(this.filePath, JSON.stringify({}), 'utf8');
        this.logger.log(`Cache has been cleared successfully`);
        return { status: 200, message: `Cache has been cleared successfully` };
      } catch (err) {
        this.logger.error(
          `Failed to clear the cache. Error: ${err}`,
          '001',
          this.loggerContext,
        );
      }
    }
  }
}

import { Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import * as fs from 'fs-extra';
import { LoggerService } from 'src/logger/logger.service';

@Injectable()
export class TransDataBaseService {
  private loggerContext = 'TransDBService';
  private pool: Pool;
  constructor(private readonly logger: LoggerService) {}

  async createTransDBConnection(buId: string) {
    const dbDetails = await this.getDBDetails(buId);

    //Create DB Connection
    this.logger.log(
      `Creating TransDB Connection for BusinessId ${buId}`,
      this.loggerContext,
    );

    this.pool = new Pool({
      user: dbDetails.DB_USERNAME,
      host: dbDetails.DB_HOST,
      database: dbDetails.DB_DATABASE,
      password: dbDetails.DB_PASSWORD,
      port: dbDetails.DB_PORT,
      query_timeout: 5000,
    });
    this.connectionTime(buId);
  }

  async destroyTransDBConnection(): Promise<void> {
    try {
      await this.pool.end();
      this.logger.log(
        'Trans Database connection has been closed',
        this.loggerContext,
      );
    } catch (error) {
      this.logger.warn(`Failed to Disconnect the TransDB ${error}`);
    }
  }

  private async getDBDetails(buId: string): Promise<any> {
    try {
      const DBCredentials = await fs.readJsonSync(
        'src/database/DBCredentials.json',
      );
      this.logger.log(
        `Fetched DB Details Successfully for ${buId}`,
        this.loggerContext,
      );
      return DBCredentials[buId];
    } catch (err) {
      this.logger.error(
        `Failed to fetch the DB details for ${buId}`,
        this.loggerContext,
      );
    }
  }

  private async connectionTime(buId: string): Promise<void> {
    try {
      const dateTime = await this.pool.query('SELECT NOW()');
      this.logger.log(
        `Trans Database Connection created Successfully for BusinessId ${buId} at ${dateTime.rows[0].now}`,
        this.loggerContext,
      );
    } catch (err) {
      this.logger.error(
        `Failed to create Trans Database Connection. Error: ${err}`,
        '001',
        this.loggerContext,
      );
    }
  }

  private createWhereCondition(condition: Record<string, any>): string {
    const makeCondition = condition
      ? Object.keys(condition)
          .map((key) => `${key} = '${condition[key]}'`)
          .join(' AND ')
      : '';
    return makeCondition ? ` WHERE ${makeCondition}` : '';
  }

  async select(
    table: string,
    selectColumns: string[],
    condition: Record<string, any>,
  ): Promise<any> {
    const selectColumn =
      selectColumns.length > 0 ? selectColumns.join(', ') : '*';

    const where = this.createWhereCondition(condition);

    const query = `SELECT ${selectColumn} FROM ${table}${where}`;
    this.logger.log(`Select Query: ${query}`, this.loggerContext);
    try {
      const selectedData = await this.pool.query(query);
      this.logger.log(`Query Executed successfully.`, this.loggerContext);
      return selectedData;
    } catch (err) {
      this.logger.error(
        `Failed to execute SELECT query. Error: ${err}`,
        '002',
        this.loggerContext,
      );
    }
  }
}

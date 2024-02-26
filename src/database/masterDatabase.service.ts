import { Injectable } from '@nestjs/common';
import { LoggerService } from 'src/logger/logger.service';
import { Pool } from 'pg';

@Injectable()
export class MasterDatabaseService {
  private readonly loggerContext = 'MasterDBService';
  private pool: Pool;

  constructor(private readonly logger: LoggerService) {}

  async createMasterDBConnection(): Promise<void> {
    this.logger.log('Creating Master DB Connection.', this.loggerContext);

    this.pool = new Pool({
      user: process.env.DB_USERNAME,
      host: process.env.DB_HOST,
      database: process.env.DB_DATABASE,
      password: process.env.DB_PASSWORD,
      port: process.env.DB_PORT,
      query_timeout: 5000,
    });

    this.connectionTime();
  }

  async destroyMasterDBConnection(): Promise<void> {
    try {
      await this.pool.end();
      this.logger.log(
        'Master DB connection has been closed',
        this.loggerContext,
      );
    } catch (error) {
      this.logger.warn(`Failed to Disconnect the TransDB ${error}`);
    }
  }

  private async connectionTime(): Promise<void> {
    try {
      const dateTime = await this.pool.query('SELECT NOW()');
      this.logger.log(
        `Master DB Connection created Successfully at ${dateTime.rows[0].now.tostring}`,
        this.loggerContext,
      );
    } catch (err) {
      this.logger.error(
        `Failed to create Master Database Connection. Error: ${err}`,
        '001',
        this.loggerContext,
      );
    }
  }

  createWhereCondition(condition: Record<string, any>): string {
    const makeCondition = condition
      ? Object.keys(condition)
          .map((key) => `${key} = '${condition[key]}'`)
          .join(' AND ')
      : '';
    return makeCondition ? ` WHERE ${makeCondition}` : '';
  }

  /**
   * Select Function
   */

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

  async Update(
    table: string,
    updateData: Record<string, any>,
    condition: Record<string, any>,
  ): Promise<any> {
    const updateColumn = Object.keys(updateData)
      .map((key) => `${key} = '${updateData[key]}'`)
      .join(', ');

    const where = this.createWhereCondition(condition);

    const query = `UPDATE ${table} SET ${updateColumn}${where}`;
    this.logger.log(`UPDATE Query: ${query}`, this.loggerContext);
    try {
      const selectedData = await this.pool.query(query);
      this.logger.log(`Query Executed successfully.`, this.loggerContext);
      return selectedData;
    } catch (err) {
      this.logger.error(
        `Failed to execute UPDATE query. Error: ${err}`,
        '002',
        this.loggerContext,
      );
    }
  }

  /**
   *
   * @param {string} table: Contain table Name
   * @param {Record<string, any>} insertData: is object that contains key value pair. key is column and value is data
   * @returns : return output as object
   */
  async insert(table: string, insertData: Record<string, any>): Promise<any> {
    const columnKey = Object.keys(insertData)
      .map((key) => `${key}`)
      .join(', ');

    const columnValue = Object.values(insertData)
      .map((value) => `'${value}'`)
      .join(', ');

    const query = `INSERT INTO ${table}(${columnKey}) VALUES(${columnValue})`;
    this.logger.log(`INSERT Query: ${query}`, this.loggerContext);
    try {
      const selectedData = await this.pool.query(query);
      this.logger.log(`Query Executed successfully.`, this.loggerContext);
      return selectedData;
    } catch (err) {
      this.logger.error(
        `Failed to execute INSERT query. Error: ${err}`,
        '002',
        this.loggerContext,
      );
    }
  }
}

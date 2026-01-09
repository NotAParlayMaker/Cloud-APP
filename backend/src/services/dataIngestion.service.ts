import fs from 'fs';
import csv from 'csv-parser';
import axios from 'axios';
import { db } from '../config/database';
import { AppError } from '../middleware/errorHandler';

export class DataIngestionService {
  async processFile(
    file: Express.Multer.File,
    userId: number,
    metadata: {
      name: string;
      description?: string;
      sportTypeId: number;
      isPublic: boolean;
    }
  ) {
    const { name, description, sportTypeId, isPublic } = metadata;

    try {
      let records: any[] = [];

      if (file.mimetype === 'text/csv') {
        records = await this.parseCSV(file.path);
      } else if (file.mimetype === 'application/json') {
        const content = fs.readFileSync(file.path, 'utf-8');
        records = JSON.parse(content);
      }

      // Save dataset metadata
      const datasetResult = await db.query(
        `INSERT INTO datasets (user_id, name, description, sport_type_id, file_path, record_count, is_public)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [userId, name, description, sportTypeId, file.path, records.length, isPublic]
      );

      // Process and store records based on data type
      await this.storeRecords(records, sportTypeId);

      return {
        dataset: datasetResult.rows[0],
        recordsProcessed: records.length
      };
    } catch (error) {
      // Clean up file on error
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
      throw error;
    }
  }

  private parseCSV(filePath: string): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const records: any[] = [];

      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (data) => records.push(data))
        .on('end', () => resolve(records))
        .on('error', (error) => reject(error));
    });
  }

  private async storeRecords(records: any[], sportTypeId: number) {
    // This is a simplified version - in production, you'd have more sophisticated
    // logic to determine record types and store them appropriately
    for (const record of records) {
      // Example: Store as game data if it has game-like properties
      if (record.home_team && record.away_team && record.date) {
        await this.storeGameRecord(record, sportTypeId);
      }
      // Add more conditions for players, teams, etc.
    }
  }

  private async storeGameRecord(record: any, sportTypeId: number) {
    // Simplified game storage - you'd need to handle team lookup/creation
    try {
      await db.query(
        `INSERT INTO games (sport_type_id, game_date, venue, home_score, away_score, metadata)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          sportTypeId,
          record.date,
          record.venue || null,
          record.home_score || null,
          record.away_score || null,
          JSON.stringify(record)
        ]
      );
    } catch (error) {
      console.error('Error storing game record:', error);
    }
  }

  async importFromAPI(
    source: string,
    endpoint: string,
    sportTypeId: number,
    params: any,
    userId: number
  ) {
    try {
      let apiKey = '';
      let baseUrl = '';

      // Configure API based on source
      switch (source.toLowerCase()) {
        case 'nba':
          apiKey = process.env.NBA_API_KEY || '';
          baseUrl = 'https://api.sportsdata.io/v3/nba';
          break;
        case 'nfl':
          apiKey = process.env.NFL_API_KEY || '';
          baseUrl = 'https://api.sportsdata.io/v3/nfl';
          break;
        default:
          apiKey = process.env.SPORTS_DATA_API_KEY || '';
          baseUrl = endpoint;
      }

      const response = await axios.get(`${baseUrl}/${endpoint}`, {
        params,
        headers: apiKey ? { 'Ocp-Apim-Subscription-Key': apiKey } : {}
      });

      const data = response.data;
      const records = Array.isArray(data) ? data : [data];

      // Save dataset
      const datasetResult = await db.query(
        `INSERT INTO datasets (user_id, name, description, sport_type_id, record_count, metadata)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [
          userId,
          `API Import: ${source} - ${endpoint}`,
          `Imported from ${source} API`,
          sportTypeId,
          records.length,
          JSON.stringify({ source, endpoint, params })
        ]
      );

      // Store records
      await this.storeRecords(records, sportTypeId);

      return {
        dataset: datasetResult.rows[0],
        recordsProcessed: records.length
      };
    } catch (error: any) {
      throw new AppError(
        `Failed to import from API: ${error.message}`,
        500
      );
    }
  }
}

import * as SQLite from 'expo-sqlite';
import { type SQLiteDatabase } from 'expo-sqlite';

export const DATABASE_NAME = 'pet_health.db';

export async function openDatabase(): Promise<SQLiteDatabase> {
    const db = await SQLite.openDatabaseAsync(DATABASE_NAME);
    await migrateDb(db);
    return db;
}

async function migrateDb(db: SQLiteDatabase) {
    const DATABASE_VERSION = 1;

    // Basic robust migration strategy
    // In a real app, we would track user_version pragmas.
    // For MVP, IF NOT EXISTS is fine.

    await db.execAsync(`
    PRAGMA journal_mode = WAL;
    
    CREATE TABLE IF NOT EXISTS pets (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      species TEXT NOT NULL,
      breed TEXT,
      birth_date TEXT,
      chip_number TEXT,
      image_uri TEXT,
      created_at INTEGER DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS weights (
      id TEXT PRIMARY KEY NOT NULL,
      pet_id TEXT NOT NULL,
      value_kg REAL NOT NULL,
      date TEXT NOT NULL,
      note TEXT,
      FOREIGN KEY (pet_id) REFERENCES pets (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS vaccinations (
      id TEXT PRIMARY KEY NOT NULL,
      pet_id TEXT NOT NULL,
      vaccine_name TEXT NOT NULL,
      date_admin TEXT NOT NULL,
      date_due TEXT,
      vet_name TEXT,
      FOREIGN KEY (pet_id) REFERENCES pets (id) ON DELETE CASCADE
    );
  `);
}

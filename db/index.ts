import * as SQLite from 'expo-sqlite';

export const db_name = 'pet_health.db';

export async function initDatabase() {
  const db = await SQLite.openDatabaseAsync(db_name);

  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS pets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      breed TEXT,
      date_of_birth TEXT,
      weight REAL,
      image_uri TEXT,
      species TEXT
    );

    CREATE TABLE IF NOT EXISTS logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      pet_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      date TEXT NOT NULL,
      type TEXT, 
      FOREIGN KEY (pet_id) REFERENCES pets (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS medications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        pet_id INTEGER,
        name TEXT NOT NULL,
        dosage TEXT,
        frequency TEXT,
        stock INTEGER DEFAULT 0,
        notes TEXT,
        FOREIGN KEY (pet_id) REFERENCES pets (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS documents (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        pet_id INTEGER,
        title TEXT,
        uri TEXT NOT NULL,
        type TEXT, -- pdf, image
        date TEXT,
        FOREIGN KEY (pet_id) REFERENCES pets (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS medication_times (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        medication_id INTEGER,
        time TEXT NOT NULL, -- HH:MM
        FOREIGN KEY (medication_id) REFERENCES medications(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS routines (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        pet_id INTEGER,
        title TEXT NOT NULL,
        type TEXT, -- food, walk, hygiene, other
        time TEXT, -- HH:MM
        frequency TEXT DEFAULT 'daily', -- daily, once
        date TEXT, -- YYYY-MM-DD
        enabled INTEGER DEFAULT 1,
        FOREIGN KEY (pet_id) REFERENCES pets(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS routine_times (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        routine_id INTEGER,
        time TEXT NOT NULL, -- HH:MM
        FOREIGN KEY (routine_id) REFERENCES routines(id) ON DELETE CASCADE
    );
  `);

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS vets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        phone TEXT,
        address TEXT,
        emergency INTEGER DEFAULT 0,
        notes TEXT
    );

    CREATE TABLE IF NOT EXISTS expenses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        pet_id INTEGER,
        title TEXT NOT NULL,
        amount REAL NOT NULL,
        date TEXT NOT NULL,
        category TEXT NOT NULL,
        notes TEXT,
        FOREIGN KEY (pet_id) REFERENCES pets(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS vaccinations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        pet_id INTEGER,
        name TEXT NOT NULL,
        date TEXT NOT NULL,
        next_due TEXT,
        notes TEXT,
        document_uri TEXT,
        FOREIGN KEY (pet_id) REFERENCES pets(id) ON DELETE CASCADE
    );
  `);

  // Migrations
  try {
    await db.runAsync('ALTER TABLE medications ADD COLUMN min_stock INTEGER DEFAULT 3');
  } catch (e) {
    // Column likely exists
  }

  // Migration for existing tables: try to add the column if it's missing.
  // We ignore errors in case it already exists.
  try {
    await db.runAsync('ALTER TABLE pets ADD COLUMN species TEXT');
  } catch (e) {
    // Column likely already exists
  }

  try {
    await db.runAsync('ALTER TABLE logs ADD COLUMN vet_id INTEGER REFERENCES vets(id) ON DELETE SET NULL');
  } catch (e) {
    // Column likely already exists
  }

  try {
    await db.runAsync('ALTER TABLE routines ADD COLUMN frequency TEXT DEFAULT "daily"');
    await db.runAsync('ALTER TABLE routines ADD COLUMN date TEXT');
  } catch (e) {
    // Columns likely already exist
  }

  try {
    await db.runAsync('ALTER TABLE pets ADD COLUMN target_weight REAL');
  } catch (e) {
    // Column likely already exists
  }

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS appointments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      pet_id INTEGER,
      vet_id INTEGER,
      title TEXT NOT NULL,
      date TEXT NOT NULL,
      time TEXT,
      notes TEXT,
      FOREIGN KEY (pet_id) REFERENCES pets(id) ON DELETE CASCADE,
      FOREIGN KEY (vet_id) REFERENCES vets(id) ON DELETE SET NULL
    );
  `);

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS symptoms (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      pet_id INTEGER,
      title TEXT NOT NULL,
      severity INTEGER,
      date TEXT NOT NULL,
      time TEXT,
      notes TEXT,
      image_uri TEXT,
      FOREIGN KEY (pet_id) REFERENCES pets(id) ON DELETE CASCADE
    );
  `);

  try {
    // Add date column to routines if it doesn't exist (for one-time tasks)
    await db.runAsync('ALTER TABLE routines ADD COLUMN date TEXT');
  } catch (e) {
    // Column likely exists (or validation error if strict)
  }

  try {
    // Add medication_id to routines for stock tracking
    await db.runAsync('ALTER TABLE routines ADD COLUMN medication_id INTEGER REFERENCES medications(id) ON DELETE SET NULL');
  } catch (e) {
    // Column likely exists
  }

  // Food Journal Tables
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS foods (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      brand TEXT,
      type TEXT, 
      calories_per_100g REAL,
      ingredients TEXT,
      notes TEXT
    );

    CREATE TABLE IF NOT EXISTS food_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      pet_id INTEGER NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
      food_id INTEGER NOT NULL REFERENCES foods(id) ON DELETE CASCADE,
      amount_grams REAL,
      date TEXT NOT NULL,
      time TEXT NOT NULL,
      notes TEXT
    );
  `);

  return db;
}

export const getDb = async () => {
  return await SQLite.openDatabaseAsync(db_name);
}

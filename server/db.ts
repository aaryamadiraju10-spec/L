import initSqlJs, { Database } from 'sql.js';
import fs from 'fs';
import path from 'path';

let dbInstance: Database | null = null;
const DB_DIR = path.join(process.cwd(), 'data');
const DB_PATH = path.join(DB_DIR, 'mathformula.sqlite');

export async function getDb(): Promise<Database> {
  if (dbInstance) return dbInstance;
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }
  const SQL = await initSqlJs();
  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    dbInstance = new SQL.Database(fileBuffer);
  } else {
    dbInstance = new SQL.Database();
  }

  // Initialize SQL Tables
  dbInstance.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      school TEXT DEFAULT '',
      grade TEXT DEFAULT 'Grade 10',
      textbook TEXT DEFAULT 'Standard Curriculum',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS calculations (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      title TEXT NOT NULL,
      formula TEXT,
      expression TEXT NOT NULL,
      variables_json TEXT,
      result TEXT NOT NULL,
      steps_json TEXT,
      category TEXT DEFAULT 'Algebra',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS curriculums (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      title TEXT NOT NULL,
      raw_ocr_text TEXT,
      plan_json TEXT,
      score_out_of_10 REAL DEFAULT 0,
      grade TEXT,
      chapter TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS exams (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      title TEXT NOT NULL,
      grade TEXT,
      chapter TEXT,
      questions_json TEXT,
      answers_json TEXT,
      score REAL,
      total_questions INTEGER,
      feedback TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      title TEXT NOT NULL,
      due_date TEXT,
      status TEXT DEFAULT 'pending',
      chapter TEXT,
      priority TEXT DEFAULT 'medium',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
  persistDb();
  return dbInstance;
}

export function persistDb() {
  if (!dbInstance) return;
  try {
    const data = dbInstance.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buffer);
  } catch (err) {
    console.error('Error saving SQLite database:', err);
  }
}

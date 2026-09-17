import * as SQLite from 'expo-sqlite';
import { SajuResult } from '../engine/types';

export interface UserProfile {
  id: number;
  name: string;
  birthDate: string;
  birthTime: string;
  sajuData: string; // SajuResult JSON 문자열
  createdAt: string;
}

export interface DiaryEntry {
  id?: number;
  date: string; // YYYY-MM-DD
  emotionScore: number; // 1~5
  content: string;
  aiFeedback?: string;
  createdAt?: string;
}

let dbInstance: SQLite.SQLiteDatabase | null = null;

// DB 인스턴스 싱글톤 반환
export async function getDB(): Promise<SQLite.SQLiteDatabase> {
  if (!dbInstance) {
    dbInstance = await SQLite.openDatabaseAsync('cyber_saju.db');
  }
  return dbInstance;
}

// DB 초기화 및 테이블 생성
export async function initDatabase(): Promise<void> {
  const db = await getDB();

  await db.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS user_profile (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      birth_date TEXT NOT NULL,
      birth_time TEXT NOT NULL,
      saju_data TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS daily_diary (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL UNIQUE,
      emotion_score INTEGER NOT NULL,
      content TEXT NOT NULL,
      ai_feedback TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

// 사용자 프로필 저장 (기존 프로필 단일 갱신)
export async function saveUserProfile(
  name: string,
  birthDate: string,
  birthTime: string,
  sajuResult: SajuResult
): Promise<number> {
  const db = await getDB();
  const serializedSaju = JSON.stringify(sajuResult);

  await db.runAsync('DELETE FROM user_profile');
  const result = await db.runAsync(
    `INSERT INTO user_profile (name, birth_date, birth_time, saju_data) 
     VALUES (?, ?, ?, ?)`,
    [name, birthDate, birthTime, serializedSaju]
  );
  return result.lastInsertRowId;
}

// 사용자 프로필 조회
export async function getUserProfile(): Promise<UserProfile | null> {
  const db = await getDB();
  const row = await db.getFirstAsync<any>(
    'SELECT id, name, birth_date as birthDate, birth_time as birthTime, saju_data as sajuData, created_at as createdAt FROM user_profile LIMIT 1'
  );
  return row || null;
}

// 데일리 일기 추가 및 수정 (Upsert)
export async function saveDiaryEntry(entry: DiaryEntry): Promise<number> {
  const db = await getDB();
  const result = await db.runAsync(
    `INSERT INTO daily_diary (date, emotion_score, content, ai_feedback)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(date) DO UPDATE SET
       emotion_score = excluded.emotion_score,
       content = excluded.content,
       ai_feedback = excluded.ai_feedback`,
    [entry.date, entry.emotionScore, entry.content, entry.aiFeedback || null]
  );
  return result.lastInsertRowId;
}

// 최근 일기 목록 조회
export async function getDiaryEntries(limit = 10): Promise<DiaryEntry[]> {
  const db = await getDB();
  const rows = await db.getAllAsync<any>(
    `SELECT id, date, emotion_score as emotionScore, content, ai_feedback as aiFeedback, created_at as createdAt 
     FROM daily_diary 
     ORDER BY date DESC 
     LIMIT ?`,
    [limit]
  );
  return rows;
}
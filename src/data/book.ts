import type { SQLiteDatabase } from 'expo-sqlite';

export type Book = {
  book_id: number;
  slug: string;
  title: string;
  author: string | null;
};

export type BookVersion = {
  version_id: number;
  version_code: string;
  version_name: string;
  language: string;
  status: string;
  entry_count: number;
};

export type BookEntry = {
  entry_id: number;
  version_id: number;
  sequence_no: number;
  entry_key: string;
  entry_type: 'section';
  content_format: 'text' | 'markdown';
  title: string;
  content: string;
  char_count: number;
};

export async function getBook(db: SQLiteDatabase) {
  return db.getFirstAsync<Book>('SELECT book_id, slug, title, author FROM book LIMIT 1');
}

export async function getVersions(db: SQLiteDatabase) {
  return db.getAllAsync<BookVersion>(`
    SELECT e.edition_id AS version_id,
      LOWER(REPLACE(e.name, ' ', '-')) AS version_code,
      e.name AS version_name, e.name AS language, e.status,
      COUNT(CASE WHEN length(trim(s.content)) > 0 THEN 1 END) AS entry_count
    FROM editions e
    LEFT JOIN sections s ON s.edition_id = e.edition_id
    GROUP BY e.edition_id
    ORDER BY CASE WHEN e.name = 'English' THEN 0 ELSE 1 END, e.sort_order
  `);
}

export async function getEntries(db: SQLiteDatabase, versionCode: string) {
  return db.getAllAsync<BookEntry>(`
    SELECT s.section_id AS entry_id, s.edition_id AS version_id, s.sort_order AS sequence_no,
      s.slug AS entry_key, 'section' AS entry_type, s.content_format, s.title,
      s.content, length(s.content) AS char_count
    FROM sections s
    JOIN editions e ON e.edition_id = s.edition_id
    WHERE LOWER(REPLACE(e.name, ' ', '-')) = ? AND length(trim(s.content)) > 0
    ORDER BY s.sort_order
  `, versionCode);
}

export async function getEntry(db: SQLiteDatabase, versionCode: string, entryId: number) {
  return db.getFirstAsync<BookEntry>(`
    SELECT s.section_id AS entry_id, s.edition_id AS version_id, s.sort_order AS sequence_no,
      s.slug AS entry_key, 'section' AS entry_type, s.content_format, s.title,
      s.content, length(s.content) AS char_count
    FROM sections s
    JOIN editions e ON e.edition_id = s.edition_id
    WHERE LOWER(REPLACE(e.name, ' ', '-')) = ? AND s.section_id = ? AND length(trim(s.content)) > 0
  `, versionCode, entryId);
}

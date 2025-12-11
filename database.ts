import * as SQLite from 'expo-sqlite';

// Создаем и экспортируем базу данных
const db = SQLite.openDatabaseSync('markers.db');

// Типизация для результатов запросов
export interface MarkerRow {
  id: number;
  latitude: number;
  longitude: number;
  title: string;
  description: string | null;
  notification_enabled: number;
  notification_radius: number;
  created_at: string;
}

export interface ImageRow {
  id: number;
  marker_id: number;
  uri: string;
  created_at: string;
}

// Функция инициализации базы данных
export const initDatabase = async (): Promise<void> => {
  try {
    // Включаем поддержку внешних ключей
    await db.execAsync('PRAGMA foreign_keys = ON;');
    
    // Таблица маркеров
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS markers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Таблица изображений
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS marker_images (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        marker_id INTEGER NOT NULL,
        uri TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (marker_id) REFERENCES markers (id) ON DELETE CASCADE,
        UNIQUE(marker_id, uri)
      );
    `);

    // Создаем индексы для быстрого поиска
    await db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_marker_images_marker_id 
      ON marker_images(marker_id);
    `);

    // ДОБАВЛЯЕМ НОВЫЕ КОЛОНКИ ЕСЛИ ИХ ЕЩЁ НЕТ
    try {
      // Проверяем существование колонок и добавляем если их нет
      const columns = await db.getAllAsync(`
        PRAGMA table_info(markers);
      `);
      
      const columnNames = columns.map((col: any) => col.name);
      
      if (!columnNames.includes('notification_enabled')) {
        console.log('📝 Adding notification_enabled column to markers table');
        await db.execAsync(`
          ALTER TABLE markers ADD COLUMN notification_enabled BOOLEAN DEFAULT 1;
        `);
      }
      
      if (!columnNames.includes('notification_radius')) {
        console.log('📝 Adding notification_radius column to markers table');
        await db.execAsync(`
          ALTER TABLE markers ADD COLUMN notification_radius REAL DEFAULT 100;
        `);
      }
    } catch (alterError) {
      console.warn('⚠️ Could not alter table structure:', alterError);
      // Продолжаем работу, колонки могут уже существовать
    }

    console.log('✅ Database tables created/updated successfully');
  } catch (error) {
    console.error('❌ Error creating/updating tables:', error);
    throw error;
  }
};

// Экспортируем объект базы данных для использования в других файлах
export { db };

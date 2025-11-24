import * as SQLite from 'expo-sqlite';

// Открываем базу данных с помощью openDatabaseSync
const db = SQLite.openDatabaseSync('markers.db');

// Функция инициализации базы данных
export const initDatabase = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    db.withTransactionAsync(async () => {
      try {
        // Таблица маркеров
        await db.execAsync(`
          CREATE TABLE IF NOT EXISTS markers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            latitude REAL NOT NULL,
            longitude REAL NOT NULL,
            title TEXT NOT NULL,
            description TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          );
        `);

        // Таблица изображений
        await db.execAsync(`
          CREATE TABLE IF NOT EXISTS marker_images (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            marker_id INTEGER NOT NULL,
            uri TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (marker_id) REFERENCES markers (id) ON DELETE CASCADE
          );
        `);

        console.log('Database tables created successfully');
      } catch (error) {
        console.error('Error creating tables:', error);
        throw error;
      }
    }).then(() => {
      console.log('Database initialized successfully');
      resolve();
    }).catch((error) => {
      console.error('Error initializing database:', error);
      reject(error);
    });
  });
};

// Экспортируем объект базы данных для использования в других файлах
export { db };


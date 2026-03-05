const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = process.env.DB_PATH || path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error("Error opening database " + err.message);
    } else {
        console.log("Connected to SQLite database");

        // Initialize tables
        db.serialize(() => {
            // Users table
            db.run(`CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                fullName TEXT,
                dob TEXT,
                password TEXT NOT NULL
            )`);

            // User Words table
            db.run(`CREATE TABLE IF NOT EXISTS user_words (
                user_id INTEGER NOT NULL,
                word_id INTEGER NOT NULL,
                status TEXT NOT NULL CHECK(status IN ('saved', 'mastered')),
                PRIMARY KEY (user_id, word_id),
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )`);
        });
    }
});

module.exports = db;

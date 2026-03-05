const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

const JWT_SECRET = 'your_super_secret_jwt_key_here'; // In a real app, use environment variables

// --- AUTHENTICATION ENDPOINTS ---

// Register User
app.post('/api/register', async (req, res) => {
    const { username, password, fullName, dob } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Username and password required' });

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        db.run(`INSERT INTO users (username, password, fullName, dob) VALUES (?, ?, ?, ?)`, [username, hashedPassword, fullName || '', dob || null], function (err) {
            if (err) {
                if (err.message.includes('UNIQUE constraint failed')) {
                    return res.status(400).json({ error: 'Username already exists' });
                }
                return res.status(500).json({ error: 'Database error' });
            }
            res.status(201).json({ message: 'User created successfully', userId: this.lastID });
        });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Login User
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Username and password required' });

    db.get(`SELECT * FROM users WHERE username = ?`, [username], async (err, user) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        if (!user) return res.status(400).json({ error: 'Invalid credentials' });

        const match = await bcrypt.compare(password, user.password);
        if (!match) return res.status(400).json({ error: 'Invalid credentials' });

        const token = jwt.sign({ userId: user.id, username: user.username, fullName: user.fullName, dob: user.dob }, JWT_SECRET, { expiresIn: '7d' });
        res.json({ message: 'Login successful', token, user: { id: user.id, username: user.username, fullName: user.fullName, dob: user.dob } });
    });
});

// Reset Password
app.post('/api/reset-password', (req, res) => {
    const { username, dob, newPassword } = req.body;
    if (!username || !dob || !newPassword) {
        return res.status(400).json({ error: 'Username, Date of Birth, and New Password are required' });
    }

    db.get(`SELECT * FROM users WHERE username = ? AND dob = ?`, [username, dob], async (err, user) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        if (!user) return res.status(400).json({ error: 'Invalid username or date of birth' });

        try {
            const hashedPassword = await bcrypt.hash(newPassword, 10);
            db.run(`UPDATE users SET password = ? WHERE id = ?`, [hashedPassword, user.id], function (err) {
                if (err) return res.status(500).json({ error: 'Failed to update password' });
                res.json({ message: 'Password reset successfully' });
            });
        } catch (error) {
            res.status(500).json({ error: 'Server error during password hashing' });
        }
    });
});

// --- MIDDLEWARE ---
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ error: 'Access denied' });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: 'Invalid token' });
        req.user = user;
        next();
    });
};

// --- USER DATA ENDPOINTS ---

// Update User Profile
app.put('/api/user/profile', authenticateToken, (req, res) => {
    const { fullName, dob } = req.body;
    db.run(`UPDATE users SET fullName = ?, dob = ? WHERE id = ?`, [fullName, dob || null, req.user.userId], function (err) {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Database error' });
        }
        res.json({ message: 'Profile updated successfully', fullName, dob });
    });
});

// Get User Words
app.get('/api/user/words', authenticateToken, (req, res) => {
    db.all(`SELECT word_id, status FROM user_words WHERE user_id = ?`, [req.user.userId], (err, rows) => {
        if (err) return res.status(500).json({ error: 'Database error' });

        const saved = rows.filter(r => r.status === 'saved').map(r => r.word_id);
        const mastered = rows.filter(r => r.status === 'mastered').map(r => r.word_id);

        res.json({ saved, mastered });
    });
});

// Sync User Words (Add/Update Word)
app.post('/api/user/words', authenticateToken, (req, res) => {
    const { wordId, status } = req.body; // status should be 'saved' or 'mastered'
    if (!wordId || !status) return res.status(400).json({ error: 'Word ID and status required' });

    // Insert or Replace (Upsert)
    db.run(
        `INSERT OR REPLACE INTO user_words (user_id, word_id, status) VALUES (?, ?, ?)`,
        [req.user.userId, wordId, status],
        function (err) {
            if (err) {
                console.error("Single word sync error:", err);
                return res.status(500).json({ error: 'Database error' });
            }
            res.json({ message: 'Word synced successfully' });
        }
    );
});

// Bulk Insert Words
app.post('/api/user/words/bulk', authenticateToken, (req, res) => {
    const { wordIds } = req.body;
    if (!Array.isArray(wordIds) || wordIds.length === 0) return res.status(400).json({ error: 'No words provided' });

    db.serialize(() => {
        db.run('BEGIN TRANSACTION');
        const stmt = db.prepare(`INSERT OR IGNORE INTO user_words (user_id, word_id, status) VALUES (?, ?, 'saved')`);
        wordIds.forEach(id => {
            stmt.run(req.user.userId, id, (err) => {
                if (err) console.error("Bulk add row error:", err);
            });
        });
        stmt.finalize();
        db.run('COMMIT', (err) => {
            if (err) {
                console.error("Bulk commit error:", err);
                return res.status(500).json({ error: 'Database error' });
            }
            res.json({ message: 'Bulk addition successful' });
        });
    });
});

// Clear Words (optionally by status)
app.delete('/api/user/words', authenticateToken, (req, res) => {
    const { status } = req.query;
    let query = `DELETE FROM user_words WHERE user_id = ?`;
    let params = [req.user.userId];
    if (status && (status === 'saved' || status === 'mastered')) {
        query += ` AND status = ?`;
        params.push(status);
    }

    db.run(query, params, function (err) {
        if (err) return res.status(500).json({ error: 'Database error' });
        res.json({ message: 'Words cleared successfully' });
    });
});

// Remove Word (e.g. un-saving completely)
app.delete('/api/user/words/:wordId', authenticateToken, (req, res) => {
    const wordId = req.params.wordId;

    db.run(`DELETE FROM user_words WHERE user_id = ? AND word_id = ?`, [req.user.userId, wordId], function (err) {
        if (err) return res.status(500).json({ error: 'Database error' });
        res.json({ message: 'Word removed successfully' });
    });
});

const PORT = 5000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

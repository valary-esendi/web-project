const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mysql = require('mysql2');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4000;

// MySQL connection setup
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    port: '3307',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE 
});

// Connect to MySQL
db.connect((err) => {
    if (err) {
        console.error('MySQL connection error:', err);
        return;
    }
    console.log('Connected to MySQL');
});

// Middleware to check for valid token
const authenticateToken = (req, res, next) => {
    const token = req.headers['authorization'] && req.headers['authorization'].split(' ')[1];
    if (!token) return res.sendStatus(401);
    
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
}

// User registration
app.post('/api/auth/register', async (req, res) => {
    const { full_name, email, username, password } = req.body;

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        db.query('INSERT INTO users (full_name, email, username, password) VALUES (?, ?, ?, ?)',
        [full_name, email, username, hashedPassword], (err) => {
            if (err) {
                return res.status(500).json({ message: 'User creation failed', error: err });
            }
            res.status(201).json({ message: 'User registered successfully' });
        });
    } catch (error) {
        res.status(500).json({ message: 'An error occurred', error });
    }
});

// User login
app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;

    db.query('SELECT * FROM users WHERE username = ?', [username], async (err, results) => {
        if (err || results.length === 0) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const user = results[0];
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET);
        res.json({ token, userId: user.id });
    });
});

// Get meals (require authentication)
app.get('/api/auth/meals', authenticateToken, (req, res) => {
    db.query('SELECT * FROM meals WHERE userId = ?', [req.user.id], (err, results) => {
        if (err) {
            return res.status(500).send('Error retrieving meals.');
        }
        res.json(results);
    });
});

// Add a meal (require authentication)
app.post('/api/auth/meals', authenticateToken, (req, res) => {
    const newMeal = {
        meal: req.body.meal,
        meal_type: req.body.meal_type,
        meal_type_times: req.body.meal_type_times,
        userId: req.user.id,
        date: new Date()  // Store the current time
    };

    const isFatOrProtein = /(fat|protein)/i.test(newMeal.meal);
    const checkLimitInterval = 60 * 60 * 1000 * 24; // 24 hours in milliseconds

    // Query to count meals taken in the last 24 hours
    db.query('SELECT COUNT(*) as mealCount FROM meals WHERE userId = ? AND date >= ?', 
        [req.user.id, new Date(Date.now() - checkLimitInterval)], (err, results) => {
            if (err) {
                return res.status(500).send('Error checking meal intake.');
            }

            const mealCount = results[0].mealCount;
            if (isFatOrProtein && mealCount >= 3) {
                return res.status(200).json({ message: `You have consumed ${newMeal.meal} multiple times. Please consider reducing your intake of ${newMeal.meal}.` });
            }

            // Otherwise, insert the meal
            db.query('INSERT INTO meals (meal, meal_type, meal_type_times, userId, date) VALUES (?, ?, ?, ?, ?)', 
                [newMeal.meal, newMeal.meal_type, newMeal.meal_type_times, newMeal.userId, newMeal.date], (err, results) => {
                    if (err) {
                        return res.status(500).send('Error adding meal.');
                    }
                    res.status(201).json({ id: results.insertId, ...newMeal });
            });
        }
    );
});

// Get foods (require authentication)
app.get('/api/auth/foods', authenticateToken, (req, res) => {
    db.query('SELECT * FROM foods WHERE userId = ?', [req.user.id], (err, results) => {
        if (err) {
            return res.status(500).send('Error retrieving foods.');
        }
        res.json(results);
    });
});

// Add food (require authentication)
app.post('/api/auth/foods', authenticateToken, (req, res) => {
    const newFood = {
        name: req.body.name,
        expiration: req.body.expiration,
        userId: req.user.id
    };

    db.query('INSERT INTO foods (name, expiration, userId) VALUES (?, ?, ?)', 
        [newFood.name, newFood.expiration, newFood.userId], (err, results) => {
            if (err) {
                return res.status(500).send('Error adding food.');
            }
            res.status(201).json({ id: results.insertId, ...newFood });
    });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
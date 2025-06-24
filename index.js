const path = require('path');
const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test database connection
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Database connected successfully');
    connection.release();
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
  }
}

// Add this after your middleware section and before your API routes
app.use(express.static('public')); // Serves static files from 'public' directory

// Root route - serve login.html first
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Route to serve index.html after successful login
app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Login endpoint
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validate input
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username and password are required'
      });
    }

    // Query user from database
    const [rows] = await pool.execute(
      'SELECT username, password_hash FROM users WHERE username = ?',
      [username]
    );

    // Check if user exists
    if (rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password'
      });
    }

    const user = rows[0];

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password'
      });
    }

    // Successful login
    res.json({
      success: true,
      message: 'Login successful',
      user: {
        username: user.username
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// GAMES ENDPOINTS - Added for search functionality

// Get all games with optional filtering and pagination
app.get('/api/games', async (req, res) => {
  try {
    const { 
      search, 
      minPrice, 
      maxPrice, 
      minHours, 
      maxHours,
      sortBy = 'name',
      order = 'ASC',
      page = 1,
      limit = 20
    } = req.query;

    // Validate pagination parameters
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const offset = (pageNum - 1) * limitNum;

    // Build WHERE clause conditions
    let whereConditions = [];
    let baseParams = []; // Base parameters for filtering

    if (search) {
      whereConditions.push('name LIKE ?');
      baseParams.push(`%${search}%`);
    }
    if (minPrice) {
      whereConditions.push('price_usd >= ?');
      baseParams.push(parseFloat(minPrice));
    }
    if (maxPrice) {
      whereConditions.push('price_usd <= ?');
      baseParams.push(parseFloat(maxPrice));
    }
    if (minHours) {
      whereConditions.push('hours_to_beat >= ?');
      baseParams.push(parseFloat(minHours));
    }
    if (maxHours) {
      whereConditions.push('hours_to_beat <= ?');
      baseParams.push(parseFloat(maxHours));
    }

    // Build WHERE clause
    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}` 
      : '';

    // Validate sort column
    const validSortColumns = ['name', 'price_usd', 'hours_to_beat', 'cost_per_hour', 'created_at'];
    const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'name';
    const sortOrder = order.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    // Get total count for pagination (use copy of baseParams)
    const countQuery = `SELECT COUNT(*) as total FROM steam_games ${whereClause}`;
    const [countResult] = await pool.execute(countQuery, [...baseParams]);
    const totalGames = countResult[0].total;

    // Get games with pagination (use baseParams + pagination params)
    const gamesQuery = `
      SELECT 
        id,
        name,
        steam_appid,
        price_usd,
        hours_to_beat,
        cost_per_hour,
        created_at,
        updated_at
      FROM steam_games 
      ${whereClause}
      ORDER BY ${sortColumn} ${sortOrder}
      LIMIT ? OFFSET ?
    `;
    
    // Create separate params array for games query
    const gamesParams = [...baseParams, limitNum, offset];
    const [games] = await pool.execute(gamesQuery, gamesParams);

    // Calculate pagination info
    const totalPages = Math.ceil(totalGames / limitNum);
    const hasNextPage = pageNum < totalPages;
    const hasPrevPage = pageNum > 1;

    res.json({
      success: true,
      data: {
        games,
        pagination: {
          currentPage: pageNum,
          totalPages,
          totalGames,
          gamesPerPage: limitNum,
          hasNextPage,
          hasPrevPage
        }
      }
    });
  } catch (error) {
    console.error('Error fetching games:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching games'
    });
  }
});

// Get a specific game by ID
app.get('/api/games/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ID
    if (!id || isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid game ID'
      });
    }

    const [rows] = await pool.execute(
      `SELECT 
        id,
        name,
        steam_appid,
        price_usd,
        hours_to_beat,
        cost_per_hour,
        created_at,
        updated_at
      FROM steam_games 
      WHERE id = ?`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Game not found'
      });
    }

    res.json({
      success: true,
      data: {
        game: rows[0]
      }
    });

  } catch (error) {
    console.error('Error fetching game:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching game'
    });
  }
});

// Get games by Steam App ID
app.get('/api/games/steam/:appid', async (req, res) => {
  try {
    const { appid } = req.params;

    // Validate Steam App ID
    if (!appid || isNaN(appid)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Steam App ID'
      });
    }

    const [rows] = await pool.execute(
      `SELECT 
        id,
        name,
        steam_appid,
        price_usd,
        hours_to_beat,
        cost_per_hour,
        created_at,
        updated_at
      FROM steam_games 
      WHERE steam_appid = ?`,
      [appid]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Game not found'
      });
    }

    res.json({
      success: true,
      data: {
        game: rows[0]
      }
    });

  } catch (error) {
    console.error('Error fetching game:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching game'
    });
  }
});

// Get games statistics
app.get('/api/games/stats', async (req, res) => {
  try {
    const [stats] = await pool.execute(`
      SELECT 
        COUNT(*) as total_games,
        AVG(price_usd) as avg_price,
        MIN(price_usd) as min_price,
        MAX(price_usd) as max_price,
        AVG(hours_to_beat) as avg_hours,
        MIN(hours_to_beat) as min_hours,
        MAX(hours_to_beat) as max_hours,
        AVG(cost_per_hour) as avg_cost_per_hour
      FROM steam_games
      WHERE price_usd IS NOT NULL 
        AND hours_to_beat IS NOT NULL 
        AND cost_per_hour IS NOT NULL
    `);

    res.json({
      success: true,
      data: {
        statistics: stats[0]
      }
    });

  } catch (error) {
    console.error('Error fetching game statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching game statistics'
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found'
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
});

// Start server
app.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`);
  await testConnection();
});

module.exports = app;
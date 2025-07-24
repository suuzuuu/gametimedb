const path = require('path');
const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const axios = require('axios');

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const STEAM_API_BASE_URL = process.env.STEAM_API_BASE_URL
const STEAM_API_KEY = process.env.STEAM_API_KEY
const STEAM_ID = process.env.STEAM_ID
const ENCRYPTION_KEY = process.env.STEAM_API_ENCRYPTION_KEY; // 32 bytes

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
      'SELECT id, username, password_hash FROM users WHERE username = ?',
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
        username: user.username,
        id: user.id
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

// Signup endpoint
app.post('/api/signup', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Validate input
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username, email, and password are required'
      });
    }

    // Validate username format
    if (username.length < 3 || username.length > 20) {
      return res.status(400).json({
        success: false,
        message: 'Username must be between 3 and 20 characters'
      });
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return res.status(400).json({
        success: false,
        message: 'Username can only contain letters, numbers, and underscores'
      });
    }

    // Validate email format (basic)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid email address'
      });
    }

    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }

    // Check if username already exists
    const [existingUsername] = await pool.execute(
      'SELECT id FROM users WHERE username = ?',
      [username]
    );

    if (existingUsername.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Username already exists'
      });
    }

    // Check if email already exists
    const [existingEmail] = await pool.execute(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existingEmail.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Email already registered'
      });
    }

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Insert new user into database
    const [result] = await pool.execute(
      'INSERT INTO users (username, email, password_hash, created_at) VALUES (?, ?, ?, NOW())',
      [username, email, passwordHash]
    );

    // Get the created user ID
    const userId = result.insertId;

    // Log successful signup
    console.log(`New user registered: ${username} (ID: ${userId})`);

    // Successful signup
    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      user: {
        id: userId,
        username: username,
        email: email
      }
    });

  } catch (error) {
    console.error('Signup error:', error);
    
    // Handle duplicate entry errors specifically
    if (error.code === 'ER_DUP_ENTRY') {
      if (error.message.includes('username')) {
        return res.status(409).json({
          success: false,
          message: 'Username already exists'
        });
      } else if (error.message.includes('email')) {
        return res.status(409).json({
          success: false,
          message: 'Email already registered'
        });
      }
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Also add a route to serve the signup page
app.get('/signup', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'signup.html'));
});

// GAMES ENDPOINTS - Added for search functionality

// Get all games with optional filtering and pagination
app.get('/api/games', async (req, res) => {
  console.log('=== API GAMES REQUEST START ===');
  console.log('Query params:', req.query);
  
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

    console.log('Destructured params:', { search, minPrice, maxPrice, minHours, maxHours, sortBy, order, page, limit });

    // Validate pagination parameters - ensure they're proper integers
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));
    const offset = (pageNum - 1) * limitNum;

    console.log('Calculated pagination:', { pageNum, limitNum, offset });

    // Build WHERE clause conditions
    let whereConditions = [];
    let baseParams = []; // Base parameters for filtering

    console.log('Building WHERE conditions...');

    if (search) {
      console.log('Adding search condition:', search);
      whereConditions.push('name LIKE ?');
      baseParams.push(`%${search}%`);
    }
    if (minPrice !== undefined && minPrice !== '') {
      console.log('Adding minPrice condition:', minPrice);
      whereConditions.push('price_usd >= ?');
      baseParams.push(parseFloat(minPrice));
    }
    if (maxPrice !== undefined && maxPrice !== '') {
      console.log('Adding maxPrice condition:', maxPrice);
      whereConditions.push('price_usd <= ?');
      baseParams.push(parseFloat(maxPrice));
    }
    if (minHours !== undefined && minHours !== '') {
      console.log('Adding minHours condition:', minHours);
      whereConditions.push('hours_to_beat >= ?');
      baseParams.push(parseFloat(minHours));
    }
    if (maxHours !== undefined && maxHours !== '') {
      console.log('Adding maxHours condition:', maxHours);
      whereConditions.push('hours_to_beat <= ?');
      baseParams.push(parseFloat(maxHours));
    }

    console.log('Final whereConditions:', whereConditions);
    console.log('Final baseParams:', baseParams);

    // Build WHERE clause
    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}` 
      : '';

    console.log('Built whereClause:', whereClause);

    // Validate sort column
    const validSortColumns = ['name', 'price_usd', 'hours_to_beat', 'cost_per_hour', 'created_at'];
    const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'name';
    const sortOrder = order.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    // Get total count for pagination (use copy of baseParams)
    const countQuery = `SELECT COUNT(*) as total FROM steam_games ${whereClause}`;
    console.log('COUNT QUERY:');
    console.log('Query:', countQuery);
    console.log('Params:', [...baseParams]);
    console.log('Params length:', baseParams.length);
    
    const [countResult] = await pool.execute(countQuery, [...baseParams]);
    const totalGames = countResult[0].total;
    console.log('Count result:', totalGames);

    // Get games with pagination - try without parameterized LIMIT/OFFSET first
    const gamesQuery = `SELECT id, name, steam_appid, price_usd, hours_to_beat, cost_per_hour, created_at, updated_at FROM steam_games ${whereClause} ORDER BY ${sortColumn} ${sortOrder} LIMIT ${limitNum} OFFSET ${offset}`;
    
    // Use only the baseParams (no LIMIT/OFFSET params since they're now in the query string)
    const gamesParams = [...baseParams];
    
    console.log('GAMES QUERY:');
    console.log('Query:', gamesQuery);
    console.log('Params:', gamesParams);
    console.log('Params length:', gamesParams.length);
    console.log('Placeholders count:', (gamesQuery.match(/\?/g) || []).length);
    
    // Validate parameter count
    if (gamesParams.length !== (gamesQuery.match(/\?/g) || []).length) {
      throw new Error(`Parameter count mismatch: ${gamesParams.length} params vs ${(gamesQuery.match(/\?/g) || []).length} placeholders`);
    }
    
    const [games] = await pool.execute(gamesQuery, gamesParams);

    // Calculate pagination info
    const totalPages = Math.ceil(totalGames / limitNum);
    const hasNextPage = pageNum < totalPages;
    const hasPrevPage = pageNum > 1;

    console.log('Success! Returning', games.length, 'games');

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
  
  console.log('=== API GAMES REQUEST END ===');
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

// Route to fetch owned games
app.get('/api/owned-games', async (req, res, next) => {
  try {
    const response = await axios.get(`${STEAM_API_BASE_URL}/IPlayerService/GetOwnedGames/v0001/`, {
      params: {
        key: STEAM_API_KEY,
        steamid: STEAM_ID,
        include_appinfo: 1, // Include game details like name
        format: 'json' // Ensure JSON response
      }
    });

    // Check if the response contains games
    const data = response.data;
    if (data.response && data.response.games) {
      res.json({
        success: true,
        games: data.response.games,
        game_count: data.response.game_count
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'No games found or user profile is private'
      });
    }
  } catch (error) {
    // Pass errors to error-handling middleware
    next(error);
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
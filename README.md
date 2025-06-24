# Enterprise Computing Project - Year 12

## Project Overview

This web application is built as part of the Year 12 Enterprise Computing curriculum, demonstrating full-stack web development principles using modern technologies. The application features user authentication, a responsive dashboard with Bootstrap integration, and MySQL database connectivity for enterprise-level data management.

## Technologies Used

- **Backend**: Node.js with Express.js framework
- **Database**: MySQL with connection pooling
- **Frontend**: HTML5, CSS3, JavaScript, and Bootstrap 5.3.0
- **Authentication**: bcrypt for password hashing
- **Icons**: Font Awesome 6.0
- **Architecture**: RESTful API design

## Features

- Secure user authentication with bcrypt password hashing
- Database connection pooling for optimal performance
- Responsive Bootstrap-based dashboard
- User session management
- RESTful API endpoints
- Modern gradient-based UI design
- Font Awesome icon integration
- Error handling and validation
- Health check monitoring

## Prerequisites

Before running this application, ensure you have the following installed:

- [Node.js](https://nodejs.org/) (version 14.0 or higher)
- [MySQL](https://www.mysql.com/) (version 8.0 or higher)
- [npm](https://www.npmjs.com/) (comes with Node.js)

## Installation

1. **Clone the repository**
   ```bash
   git clone [your-repository-url]
   cd enterprise-computing-project
   ```

2. **Install dependencies**
   ```bash
   npm install express mysql2 bcrypt dotenv
   ```

3. **Database Setup**
   - Start your MySQL server
   - Create a new database:
     ```sql
     CREATE DATABASE enterprise_app;
     USE enterprise_app;
     ```
   - Create the users table:
     ```sql
     CREATE TABLE users (
       id INT PRIMARY KEY AUTO_INCREMENT,
       username VARCHAR(50) UNIQUE NOT NULL,
       password_hash VARCHAR(255) NOT NULL,
       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
     );
     ```
   - Insert a test user (optional):
     ```sql
     INSERT INTO users (username, password_hash) 
     VALUES ('testuser', '$2b$10$example_hash_here');
     ```

4. **Environment Configuration**
   - Create a `.env` file in the root directory:
     ```env
     DB_HOST=localhost
     DB_USER=your_mysql_username
     DB_PASSWORD=your_mysql_password
     DB_NAME=enterprise_app
     PORT=5000
     ```

## Project Structure

```
enterprise-computing-project/
│
├── public/                    # Static files served by Express
│   ├── login.html            # Login page (served at root /)
│   ├── index.html            # Dashboard (served at /dashboard)
│   ├── script.js             # Client-side JavaScript
│   └── ASSESSMENT2/src/      # CSS and additional assets
│       └── Styles.css        # Custom stylesheet
│
├── .env                      # Environment variables (not in repo)
├── .env.example             # Environment template
├── .gitignore               # Git ignore file
├── package.json             # Node.js dependencies
├── server.js                # Main server file
└── README.md                # This file
```

## Running the Application

1. **Start the server**
   ```bash
   node server.js
   ```
   Or if you have nodemon installed:
   ```bash
   npx nodemon server.js
   ```

2. **Access the application**
   - Open your web browser
   - Navigate to `http://localhost:5000`
   - You'll be directed to the login page
   - After successful login, you'll access the dashboard at `/dashboard`

## API Endpoints

| Method | Endpoint | Description | Status |
|--------|----------|-------------|---------|
| GET | `/` | Serves login page | ✅ Implemented |
| GET | `/dashboard` | Serves dashboard after login | ✅ Implemented |
| POST | `/api/login` | User authentication | ✅ Implemented |
| GET | `/api/health` | Server health check | ✅ Implemented |
| GET | `/api/user` | Get current user info | ❌ Needs Implementation |
| POST | `/api/logout` | User logout | ❌ Needs Implementation |

### Login API Details

**POST `/api/login`**
```json
// Request Body
{
  "username": "your_username",
  "password": "your_password"
}

// Success Response (200)
{
  "success": true,
  "message": "Login successful",
  "user": {
    "username": "your_username"
  }
}

// Error Response (401)
{
  "success": false,
  "message": "Invalid username or password"
}
```

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Frontend Features

### Bootstrap Integration
- **Bootstrap 5.3.0** for responsive design
- **Font Awesome 6.0** for modern icons
- Custom gradient navbar styling
- Responsive grid layout
- Form controls and button styling

### Dashboard Components
- **Navigation Bar**: Custom gradient design with logo and navigation links
- **User Display**: Shows current logged-in user
- **Search Functionality**: Integrated search box
- **Logout Button**: Secure logout with confirmation

## Missing Implementation (TODO)

The following endpoints are referenced in the frontend but need implementation:

1. **GET `/api/user`** - Return current user information
2. **POST `/api/logout`** - Handle user logout and session cleanup
3. **Session Management** - Implement proper session handling
4. **Authentication Middleware** - Protect dashboard routes

### Suggested Implementation for Missing Endpoints:

```javascript
// Add to server.js

// Get current user endpoint
app.get('/api/user', (req, res) => {
  // TODO: Implement session checking
  // For now, return mock data or implement session management
  res.json({
    success: true,
    user: { username: 'current_user' }
  });
});

// Logout endpoint
app.post('/api/logout', (req, res) => {
  // TODO: Implement session destruction
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});
```

## Security Features

- **Password Hashing**: Uses bcrypt with salt rounds
- **Input Validation**: Server-side validation for all inputs
- **SQL Injection Prevention**: Parameterized queries with mysql2
- **Connection Pool**: Prevents connection exhaustion
- **Error Handling**: Comprehensive error management
- **HTTPS Ready**: Prepared for SSL certificate integration

## Development Setup

### Required npm packages:
```bash
npm install express mysql2 bcrypt dotenv
```

### Development Dependencies (Optional):
```bash
npm install --save-dev nodemon
```

### Package.json Scripts:
```json
{
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  }
}
```

## Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Verify MySQL service is running
   - Check credentials in `.env` file
   - Ensure database `enterprise_app` exists
   - Test connection: `mysql -u username -p`

2. **Port 5000 Already in Use**
   - Change PORT in `.env` file
   - Kill existing process: `lsof -ti:5000 | xargs kill -9`

3. **CSS/JS Files Not Loading**
   - Ensure files are in `public/` directory
   - Check file paths in HTML
   - Verify `express.static('public')` is configured

4. **Bootstrap/FontAwesome Not Loading**
   - Check internet connection (using CDN)
   - Verify CDN URLs are correct and accessible

### Server Startup Checklist

When you start the server, you should see:
```
🚀 Server running on port 5000
✅ Database connected successfully
```

If you see `❌ Database connection failed`, check your database configuration.

## Next Steps for Development

1. **Implement Session Management**: Add express-session or JWT
2. **Add User Registration**: Create signup functionality
3. **Implement Missing API Endpoints**: `/api/user` and `/api/logout`
4. **Add Data Management**: CRUD operations for application data
5. **Enhance Security**: Add rate limiting and CORS
6. **Add Testing**: Unit and integration tests
7. **Error Logging**: Implement proper logging system

## Testing

### Manual Testing Steps:
1. Start the server: `node server.js`
2. Visit `http://localhost:5000`
3. Verify login page loads
4. Test database connection via health endpoint: `http://localhost:5000/api/health`
5. Test login with valid credentials
6. Verify dashboard loads after successful login

## Deployment Notes

- Server runs on port 5000 by default
- Uses connection pooling for database efficiency
- Static files served from `public/` directory
- Environment variables required for database connection
- Ready for PM2 process management in production

## Author

[Your Name]  
Year 12 Enterprise Computing  
[School Name]  
[Date]

## License

This project is created for educational purposes as part of Year 12 Enterprise Computing coursework.

---

**Note**: This application demonstrates enterprise web development concepts and is designed to meet Year 12 assessment criteria. Some advanced features are intentionally left for further development to encourage learning and problem-solving.
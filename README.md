# Enterprise Computing Project - Year 12

## Project Overview

This web application is built as part of the Year 12 Enterprise Computing curriculum, demonstrating full-stack web development principles using modern technologies. The application showcases database integration, server-side processing, and responsive front-end design suitable for enterprise-level solutions.

## Technologies Used

- **Backend**: Node.js with Express.js framework
- **Database**: MySQL for data storage and management
- **Frontend**: HTML5, CSS3, and vanilla JavaScript
- **Architecture**: MVC (Model-View-Controller) pattern

## Features

- User authentication and session management
- CRUD (Create, Read, Update, Delete) operations
- Responsive web design for multiple devices
- Database-driven content management
- Form validation and error handling
- RESTful API endpoints

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
   npm install
   ```

3. **Database Setup**
   - Start your MySQL server
   - Create a new database:
     ```sql
     CREATE DATABASE enterprise_app;
     ```
   - Import the database schema:
     ```bash
     mysql -u [username] -p enterprise_app < database/schema.sql
     ```

4. **Environment Configuration**
   - Copy the example environment file:
     ```bash
     cp .env.example .env
     ```
   - Update the `.env` file with your database credentials:
     ```
     DB_HOST=localhost
     DB_USER=your_username
     DB_PASSWORD=your_password
     DB_NAME=enterprise_app
     PORT=3000
     ```

## Project Structure

```
enterprise-computing-project/
│
├── public/                 # Static files (CSS, JS, images)
│   ├── css/
│   │   └── styles.css
│   ├── js/
│   │   └── script.js
│   └── images/
│
├── views/                  # HTML templates
│   ├── index.html
│   ├── login.html
│   └── dashboard.html
│
├── routes/                 # Express route handlers
│   ├── auth.js
│   ├── api.js
│   └── index.js
│
├── models/                 # Database models
│   ├── User.js
│   └── database.js
│
├── middleware/             # Custom middleware
│   └── auth.js
│
├── database/               # Database files
│   ├── schema.sql
│   └── seedData.sql
│
├── .env.example           # Environment variables template
├── .gitignore            # Git ignore file
├── package.json          # Node.js dependencies
├── server.js             # Main server file
└── README.md             # This file
```

## Running the Application

1. **Start the server**
   ```bash
   npm start
   ```
   Or for development with auto-restart:
   ```bash
   npm run dev
   ```

2. **Access the application**
   - Open your web browser
   - Navigate to `http://localhost:3000`

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Home page |
| GET | `/login` | Login page |
| POST | `/api/auth/login` | User authentication |
| POST | `/api/auth/register` | User registration |
| GET | `/api/users` | Get all users |
| POST | `/api/users` | Create new user |
| PUT | `/api/users/:id` | Update user |
| DELETE | `/api/users/:id` | Delete user |

## Database Schema

The application uses the following main tables:

- **users**: Stores user account information
- **sessions**: Manages user sessions
- **data**: Application-specific data storage

Detailed schema can be found in `database/schema.sql`.

## Development

### Adding New Features

1. Create new routes in the `routes/` directory
2. Add corresponding database models in `models/`
3. Update the frontend in `public/` and `views/`
4. Test thoroughly before deployment

### Code Style

- Use consistent indentation (2 spaces)
- Follow camelCase naming convention
- Add comments for complex logic
- Validate all user inputs

## Testing

Run the test suite:
```bash
npm test
```

## Deployment

For production deployment:

1. Set environment variables for production
2. Use a process manager like PM2:
   ```bash
   npm install -g pm2
   pm2 start server.js --name "enterprise-app"
   ```
3. Configure reverse proxy (Nginx recommended)
4. Set up SSL certificates for HTTPS

## Security Considerations

- All user inputs are sanitized and validated
- Passwords are hashed using bcrypt
- SQL injection prevention through parameterized queries
- CORS protection implemented
- Rate limiting on API endpoints

## Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Check MySQL server is running
   - Verify credentials in `.env` file
   - Ensure database exists

2. **Port Already in Use**
   - Change PORT in `.env` file
   - Kill existing process: `lsof -ti:3000 | xargs kill`

3. **Dependencies Issues**
   - Clear npm cache: `npm cache clean --force`
   - Delete `node_modules` and reinstall: `rm -rf node_modules && npm install`

## Contributing

This is a Year 12 school project. For academic integrity, please do not copy code directly. Use this as a reference for learning purposes only.

## License

This project is created for educational purposes as part of Year 12 Enterprise Computing coursework.

## Author

[Your Name]  
Year 12 Enterprise Computing  
[School Name]  
[Date]

## Acknowledgments

- Thanks to the Enterprise Computing teaching team
- Node.js and Express.js communities
- MySQL documentation and resources

---

**Note**: This application is designed for educational purposes and demonstrates enterprise-level web development concepts suitable for Year 12 assessment criteria.
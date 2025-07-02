# TrafficAlert Backend API

Backend API for the TrafficAlert mobile application - a crowdsourced traffic reporting platform.

## Features

- **User Authentication**: JWT-based authentication with OTP verification
- **Traffic Reports**: Create, read, update, delete traffic incident reports
- **Image Upload**: Cloudinary integration for report images
- **Geospatial Queries**: Find nearby reports using MongoDB geospatial features
- **Real-time Notifications**: Push notification system
- **User Profiles**: Complete user management with preferences
- **Social Features**: Comments, helpful votes, report verification

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Image Storage**: Cloudinary
- **Email**: Nodemailer
- **Validation**: Joi
- **Security**: Helmet, CORS, bcrypt

## Setup Instructions

### Prerequisites

- Node.js (v16 or higher)
- MongoDB Atlas account
- Cloudinary account
- Email service (Gmail recommended)

### Installation

1. **Clone and navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   ```bash
   cp .env.example .env
   ```
   
   Fill in your environment variables in `.env`:
   - `MONGODB_URI`: Your MongoDB Atlas connection string
   - `JWT_SECRET`: A secure random string for JWT signing
   - `CLOUDINARY_*`: Your Cloudinary credentials
   - `EMAIL_*`: Your email service configuration
   - `GOOGLE_MAPS_API_KEY`: For geocoding services

4. **Start the server**
   ```bash
   # Development mode with auto-restart
   npm run dev
   
   # Production mode
   npm start
   ```

5. **Verify installation**
   Visit `http://localhost:5000/api/health` to check if the API is running.

## API Endpoints

### Authentication (`/api/auth`)
- `POST /register` - Register new user
- `POST /login` - User login
- `POST /logout` - User logout
- `POST /forgot-password` - Request password reset
- `POST /verify-otp` - Verify OTP
- `POST /reset-password` - Reset password
- `GET /me` - Get current user

### Users (`/api/users`)
- `GET /profile` - Get user profile
- `PUT /profile` - Update profile
- `POST /profile/picture` - Upload profile picture
- `GET /stats` - Get user statistics
- `GET /reports` - Get user's reports

### Reports (`/api/reports`)
- `POST /` - Create new report
- `GET /` - Get all reports (with filters)
- `GET /nearby` - Get nearby reports
- `GET /:id` - Get single report
- `PUT /:id` - Update report
- `DELETE /:id` - Delete report
- `POST /:id/verify` - Verify report
- `POST /:id/helpful` - Mark as helpful
- `POST /:id/comments` - Add comment

### Notifications (`/api/notifications`)
- `GET /` - Get user notifications
- `POST /mark-read` - Mark as read
- `POST /mark-all-read` - Mark all as read

## Database Schema

### User Model
- Authentication & profile information
- Quick destinations
- Notification preferences
- Statistics tracking

### Report Model
- Traffic incident details
- Geospatial location data
- Image attachments
- Social interactions (comments, votes)
- Verification system

## Security Features

- JWT token authentication
- Password hashing with bcrypt
- Input validation with Joi
- Rate limiting
- CORS configuration
- Security headers with Helmet
- File upload restrictions

## Development

### Running Tests
```bash
npm test
```

### Code Structure
```
backend/
├── config/          # Configuration files
├── controllers/     # Route controllers
├── middleware/      # Custom middleware
├── models/         # Database models
├── routes/         # API routes
├── services/       # Business logic
├── utils/          # Utility functions
├── validators/     # Input validation
└── tests/          # Test files
```

### Environment Variables
See `.env.example` for all required environment variables.

## Deployment

1. Set up MongoDB Atlas cluster
2. Configure Cloudinary account
3. Set up email service
4. Deploy to your preferred platform (Heroku, AWS, etc.)
5. Set environment variables in production
6. Update CORS settings for your frontend domain

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License

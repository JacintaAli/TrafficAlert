# TrafficAlert API Documentation

## Base URL
```
http://localhost:5001/api
```

## Authentication
Most endpoints require JWT authentication. Include the token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

## Response Format
All API responses follow this format:
```json
{
  "success": true|false,
  "message": "Response message",
  "data": { ... },
  "timestamp": "2025-07-02T12:00:00.000Z"
}
```

## Endpoints

### Health Check
- **GET** `/health`
- **Description**: Check API status
- **Authentication**: None
- **Response**:
```json
{
  "status": "OK",
  "message": "TrafficAlert API is running",
  "timestamp": "2025-07-02T12:00:00.000Z",
  "version": "1.0.0"
}
```

---

## Authentication Endpoints

### Register User
- **POST** `/auth/register`
- **Authentication**: None
- **Body**:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "phone": "+1234567890" // optional
}
```

### Login User
- **POST** `/auth/login`
- **Authentication**: None
- **Body**:
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

### Get Current User
- **GET** `/auth/me`
- **Authentication**: Required

### Logout
- **POST** `/auth/logout`
- **Authentication**: Required
- **Body**:
```json
{
  "pushToken": "device_push_token" // optional
}
```

### Forgot Password
- **POST** `/auth/forgot-password`
- **Authentication**: None
- **Body**:
```json
{
  "email": "john@example.com"
}
```

### Verify OTP
- **POST** `/auth/verify-otp`
- **Authentication**: None
- **Body**:
```json
{
  "email": "john@example.com",
  "otp": "123456"
}
```

### Reset Password
- **POST** `/auth/reset-password`
- **Authentication**: None
- **Body**:
```json
{
  "email": "john@example.com",
  "newPassword": "newpassword123"
}
```

### Change Password
- **POST** `/auth/change-password`
- **Authentication**: Required
- **Body**:
```json
{
  "currentPassword": "oldpassword",
  "newPassword": "newpassword123"
}
```

---

## User Management Endpoints

### Get User Profile
- **GET** `/users/profile`
- **Authentication**: Required

### Update User Profile
- **PUT** `/users/profile`
- **Authentication**: Required
- **Body**:
```json
{
  "name": "Updated Name",
  "phone": "+1234567890",
  "quickDestinations": [
    {
      "name": "Home",
      "address": "123 Main St",
      "latitude": 40.7128,
      "longitude": -74.0060
    }
  ]
}
```

### Upload Profile Picture
- **POST** `/users/profile/picture`
- **Authentication**: Required
- **Content-Type**: `multipart/form-data`
- **Body**: Form data with `profilePicture` file

### Get User Statistics
- **GET** `/users/stats`
- **Authentication**: Required

### Get User Reports
- **GET** `/users/reports`
- **Authentication**: Required
- **Query Parameters**:
  - `page` (default: 1)
  - `limit` (default: 10)
  - `status` (active, resolved, expired, flagged)

---

## Traffic Reports Endpoints

### Create Report
- **POST** `/reports`
- **Authentication**: Required
- **Content-Type**: `multipart/form-data`
- **Body**:
```json
{
  "type": "accident", // accident, hazard, construction, traffic, police
  "severity": "high", // low, medium, high
  "description": "Major accident on highway",
  "location": {
    "latitude": 40.7128,
    "longitude": -74.0060,
    "address": "New York, NY" // optional
  },
  "metadata": { // optional
    "deviceInfo": {
      "platform": "mobile",
      "version": "1.0.0"
    }
  }
}
```
- **Files**: `images[]` (up to 5 images)

### Get All Reports
- **GET** `/reports`
- **Authentication**: None
- **Query Parameters**:
  - `page` (default: 1)
  - `limit` (default: 20)
  - `type` (accident, hazard, construction, traffic, police)
  - `severity` (low, medium, high)
  - `status` (active, resolved, expired, flagged)

### Get Nearby Reports
- **GET** `/reports/nearby`
- **Authentication**: None
- **Query Parameters**:
  - `latitude` (required)
  - `longitude` (required)
  - `radius` (default: 5000 meters)

### Get Report by ID
- **GET** `/reports/:id`
- **Authentication**: None

### Update Report
- **PUT** `/reports/:id`
- **Authentication**: Required (owner or admin)
- **Body**:
```json
{
  "description": "Updated description",
  "severity": "medium"
}
```

### Delete Report
- **DELETE** `/reports/:id`
- **Authentication**: Required (owner or admin)

### Verify Report
- **POST** `/reports/:id/verify`
- **Authentication**: Required

### Mark Report as Helpful
- **POST** `/reports/:id/helpful`
- **Authentication**: Required

### Remove Helpful Vote
- **DELETE** `/reports/:id/helpful`
- **Authentication**: Required

### Add Comment
- **POST** `/reports/:id/comments`
- **Authentication**: Required
- **Body**:
```json
{
  "text": "Comment text (max 200 characters)"
}
```

### Get Comments
- **GET** `/reports/:id/comments`
- **Authentication**: None
- **Query Parameters**:
  - `page` (default: 1)
  - `limit` (default: 10)

### Flag Report
- **POST** `/reports/:id/flag`
- **Authentication**: Required
- **Body**:
```json
{
  "reason": "Inappropriate content"
}
```

---

## Notifications Endpoints

### Get Notifications
- **GET** `/notifications`
- **Authentication**: Required

### Mark as Read
- **POST** `/notifications/mark-read`
- **Authentication**: Required
- **Body**:
```json
{
  "notificationIds": ["id1", "id2"]
}
```

### Mark All as Read
- **POST** `/notifications/mark-all-read`
- **Authentication**: Required

---

## Error Codes

- **400**: Bad Request - Invalid input data
- **401**: Unauthorized - Invalid or missing authentication
- **403**: Forbidden - Insufficient permissions
- **404**: Not Found - Resource not found
- **409**: Conflict - Resource already exists
- **422**: Unprocessable Entity - Validation errors
- **429**: Too Many Requests - Rate limit exceeded
- **500**: Internal Server Error - Server error

## Rate Limiting
- 100 requests per 15 minutes per IP address
- Authentication endpoints: 5 requests per minute per IP

## File Upload Limits
- Maximum file size: 5MB per image
- Maximum files per report: 5 images
- Supported formats: JPG, JPEG, PNG, GIF, WebP

## Validation Rules

### User Registration
- Name: 2-50 characters
- Email: Valid email format
- Password: Minimum 6 characters
- Phone: Valid phone number format (optional)

### Report Creation
- Type: Must be one of: accident, hazard, construction, traffic, police
- Severity: Must be one of: low, medium, high
- Description: 10-500 characters
- Location: Valid latitude (-90 to 90) and longitude (-180 to 180)

### Comments
- Text: 1-200 characters
- No HTML tags allowed

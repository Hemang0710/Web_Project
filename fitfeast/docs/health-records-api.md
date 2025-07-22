# Health Records API Documentation

This document outlines the RESTful API endpoints available for managing health records in the FitFeast application.

## Base URL

All endpoints are prefixed with `/api/health-records`

## Authentication

All endpoints require authentication. The user's data is passed through the `user-data` header, which is automatically handled by the application's authentication middleware.

## Endpoints

### Get All Health Records
- **Endpoint:** `GET /api/health-records`
- **Description:** Retrieves the last 30 health records for the authenticated user
- **Response:** 
  - Success (200): Array of health records
  - Unauthorized (401): If user is not authenticated
  - Server Error (500): If there's an error fetching records

### Create Health Record
- **Endpoint:** `POST /api/health-records`
- **Description:** Creates a new health record for the authenticated user
- **Request Body:** Health record data
- **Response:**
  - Success (201): Created health record
  - Unauthorized (401): If user is not authenticated
  - Server Error (500): If there's an error creating the record

### Get Single Health Record
- **Endpoint:** `GET /api/health-records/:id`
- **Description:** Retrieves a specific health record by ID
- **Parameters:**
  - `id`: The ID of the health record
- **Response:**
  - Success (200): Health record object
  - Not Found (404): If record doesn't exist or doesn't belong to user
  - Unauthorized (401): If user is not authenticated
  - Server Error (500): If there's an error fetching the record

### Update Health Record
- **Endpoint:** `PUT /api/health-records/:id`
- **Description:** Updates an existing health record
- **Parameters:**
  - `id`: The ID of the health record to update
- **Request Body:** Updated health record data
- **Response:**
  - Success (200): Updated health record
  - Not Found (404): If record doesn't exist or doesn't belong to user
  - Unauthorized (401): If user is not authenticated
  - Server Error (500): If there's an error updating the record

### Delete Health Record
- **Endpoint:** `DELETE /api/health-records/:id`
- **Description:** Deletes a health record
- **Parameters:**
  - `id`: The ID of the health record to delete
- **Response:**
  - Success (200): Success message
  - Not Found (404): If record doesn't exist or doesn't belong to user
  - Unauthorized (401): If user is not authenticated
  - Server Error (500): If there's an error deleting the record

## Data Model

The health record model includes the following fields:
- `userId`: Reference to the user who owns the record
- `date`: Date of the health record
- Additional health metrics as defined in the application

## Security

- All endpoints are protected and require authentication
- Users can only access and modify their own health records
- Each request is validated to ensure the user has permission to access the requested resource

## Error Handling

All endpoints follow a consistent error response format:
```json
{
  "message": "Error description"
}
```

Common HTTP status codes:
- 200: Success
- 201: Created
- 401: Unauthorized
- 404: Not Found
- 500: Server Error 
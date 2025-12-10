# Design Document

## 1. Tech Stack Choices

### Q1. Frontend Framework
**Chosen:** React with Vite

**Reason:**
- Fast development experience
- Component-based architecture makes UI maintenance easier
- Large ecosystem
- Vite provides rapid hot reloading and optimized builds

### Q2. Backend Framework
**Chosen:** Node.js with Express

**Reason:**
- Minimal and fast for building REST APIs
- Easy file upload handling using Multer
- Works well with JavaScript frontend

### Q3. Database
**Chosen:** SQLite

**Reason:**
- Lightweight
- No setup required
- Perfect for local application
- Automatically creates database file

### Q4. If supporting 1,000 users
Changes required:
- Use PostgreSQL or MySQL instead of SQLite
- Store uploaded files in object storage (AWS S3, Cloudflare R2, etc.)
- Deploy backend on scalable service
- Add user authentication
- Add caching layer (Redis)

---

## 2. Architecture Overview

### System Components
- **Frontend (React)**: Upload PDF, view list, download, delete
- **Backend (Express)**: REST API for file operations
- **Database (SQLite)**: File metadata
- **Storage**: Local uploads folder

### Data Flow Diagram

```
[Frontend UI]
     |
     | HTTP Request
     v
[Backend API]
     |
     | Saves file → /uploads
     | Saves metadata → SQLite DB
     v
[Database + Storage]
```

---

## 3. API Specification

### POST /documents/upload
**Description:** Upload a PDF file

**Request:**
```
FormData:
file: <PDF>
```

**Response:**
```
{
  "success": true,
  "id": 1,
  "filename": "report.pdf"
}
```

---

### GET /documents
**Description:** List all uploaded documents

**Response:**
```
[
  {
    "id": 1,
    "filename": "report.pdf",
    "filepath": "uuid_timestamp_report.pdf",
    "filesize": 12345,
    "created_at": "2025-12-09T10:00:00Z"
  }
]
```

---

### GET /documents/:id
**Description:** Download a specific file

**Response:** File stream

---

### DELETE /documents/:id
**Description:** Delete a file

**Response:**
```
{ "success": true }
```

---

## 4. Data Flow Description

### Q5. Uploading a File
1. User selects file on frontend
2. Frontend sends request to backend using FormData
3. Backend checks file type and size
4. File stored in `/uploads` folder with unique name
5. Metadata saved to SQLite database
6. Response returned to UI
7. UI refreshes file list

### Q5. Downloading a File
1. User clicks "Download"
2. Frontend triggers GET request `/documents/:id`
3. Backend locates file from uploads folder
4. File streamed to browser

---

## 5. Assumptions

### Q6. Key Assumptions
- Only one user, no authentication required
- File size limit: 10 MB
- Allowed file types: PDF, JPG, PNG
- Local environment only
- SQLite used for simplicity
- Uploads folder exists and is writable
- Server runs on port 4000 by default


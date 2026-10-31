# Enquiry Tracker: CRM Lead Management API

A REST API for capturing course enquiries and letting employees claim them as leads. Anyone can submit an enquiry through a public endpoint. Employees register, log in, view unclaimed enquiries, and claim them. Each enquiry can be claimed by only one employee.

## Table of contents
- [Features](#features)
- [Tech stack](#tech-stack)
- [Getting started](#getting-started)
- [Environment variables](#environment-variables)
- [Scripts](#scripts)
- [Project structure](#project-structure)
- [API reference](#api-reference)
- [Data models](#data-models)
- [Error handling](#error-handling)
- [Testing with Postman](#testing-with-postman)
- [Design notes](#design-notes)
- [Security notes](#security-notes)
- [Future improvements](#future-improvements)

## Features
- Employee registration and login with JWT authentication
- Public enquiry submission (no login needed)
- Employees can list all unclaimed enquiries
- Atomic claiming: two employees cannot claim the same enquiry, even at the same moment
- Employees can list the enquiries they have claimed
- Input validation, consistent JSON responses, and centralized error handling

## Tech stack
- Node.js and Express 4
- MongoDB with Mongoose 8
- JSON Web Tokens (`jsonwebtoken`)
- Password hashing with `bcryptjs` (12 salt rounds)
- `dotenv` for configuration, `cors` for cross-origin requests, `nodemon` for development

## Getting started

**Prerequisites:** Node.js 18 or newer, npm, and a running MongoDB instance (local or Atlas).

```bash
# 1. Go to the backend folder
cd backend

# 2. Install dependencies
npm install

# 3. Create your environment file
cp .env.example .env        # Windows PowerShell: copy .env.example .env

# 4. Edit .env and set a strong JWT_SECRET (see below)

# 5. Start the server
npm run dev                 # development, auto-restarts on changes
# or
npm start                   # production
```

The API runs at `http://localhost:5000`. Check it with:

```bash
curl http://localhost:5000/api/health
```

## Environment variables
Defined in `backend/.env` (template: `backend/.env.example`). Never commit `.env`.

| Variable | Required | Description | Example |
|---|---|---|---|
| `PORT` | No | Port the server listens on (default `5000`) | `5000` |
| `MONGO_URI` | Yes | MongoDB connection string | `mongodb://127.0.0.1:27017/crm_assignment` |
| `JWT_SECRET` | Yes | Secret used to sign tokens. Use a long random value (32+ characters) | `replace_with_a_random_secret_at_least_32_characters` |
| `JWT_EXPIRES_IN` | No | Token lifetime (default `7d`) | `7d` |

The server refuses to start if `JWT_SECRET` or `MONGO_URI` is missing.

Generate a secret with:
```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

## Scripts
Run these inside `backend/`.

| Command | Description |
|---|---|
| `npm start` | Start the server with Node |
| `npm run dev` | Start with nodemon (auto-reload) |

## Project structure
```text
backend/
├── config/
│   └── db.js                     # MongoDB connection
├── controllers/
│   ├── authController.js         # register, login
│   └── enquiryController.js      # create, list unclaimed, claim, list mine
├── middleware/
│   ├── authMiddleware.js         # JWT check (protect)
│   └── errorMiddleware.js        # 404 and error handlers
├── models/
│   ├── Employee.js
│   └── Enquiry.js
├── routes/
│   ├── authRoutes.js
│   └── enquiryRoutes.js
├── postman/
│   └── CRM-Lead-Management.postman_collection.json
├── .env.example
└── server.js                     # App entry point
```

## API reference
Base URL: `http://localhost:5000`

All requests and responses use JSON. Protected routes need this header:

```
Authorization: Bearer <token>
```

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/health` | No | Health check |
| POST | `/api/auth/register` | No | Register an employee |
| POST | `/api/auth/login` | No | Log in and get a token |
| POST | `/api/enquiries` | No | Submit a public enquiry |
| GET | `/api/enquiries/unclaimed` | Yes | List unclaimed enquiries (newest first) |
| PATCH | `/api/enquiries/:id/claim` | Yes | Claim an enquiry |
| GET | `/api/enquiries/my` | Yes | List enquiries you have claimed (newest first) |

### Register
`POST /api/auth/register`

| Field | Rules |
|---|---|
| `name` | String, at least 2 characters |
| `email` | Valid email, must be unique |
| `password` | String, at least 8 characters |

```json
{ "name": "Asha Kumar", "email": "asha@example.com", "password": "StrongPass123!" }
```

`201 Created`
```json
{ "success": true, "message": "Employee registered successfully", "data": { "token": "<jwt>" } }
```

### Login
`POST /api/auth/login`

```json
{ "email": "asha@example.com", "password": "StrongPass123!" }
```

`200 OK`
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "employee": { "id": "665f...", "name": "Asha Kumar", "email": "asha@example.com" },
    "token": "<jwt>"
  }
}
```

### Submit an enquiry
`POST /api/enquiries` (public)

| Field | Required | Rules |
|---|---|---|
| `name` | Yes | At least 2 characters (max 100) |
| `email` | Yes | Valid email |
| `courseInterest` | Yes | At least 2 characters (max 150) |
| `phone` | No | String, max 30 characters |
| `message` | No | String, max 2000 characters |

```json
{
  "name": "Rahul Sharma",
  "email": "rahul@example.com",
  "courseInterest": "Full Stack Development",
  "phone": "9876543210",
  "message": "Please share batch details."
}
```

`201 Created`
```json
{ "success": true, "message": "Enquiry submitted successfully", "data": { "enquiry": { "_id": "...", "claimedBy": null } } }
```

### List unclaimed enquiries
`GET /api/enquiries/unclaimed` (auth)

`200 OK`
```json
{ "success": true, "count": 2, "data": { "enquiries": [ { "_id": "...", "name": "Rahul Sharma", "claimedBy": null } ] } }
```

### Claim an enquiry
`PATCH /api/enquiries/:id/claim` (auth)

`200 OK` returns the updated enquiry with `claimedBy` set to the logged-in employee.

| Status | Meaning |
|---|---|
| 400 | `id` is not a valid ID |
| 404 | Enquiry does not exist |
| 409 | Enquiry was already claimed |

### List my enquiries
`GET /api/enquiries/my` (auth)

Same response shape as the unclaimed list, filtered to enquiries claimed by you.

### Quick example with curl
```bash
# Register and save the token
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Asha Kumar","email":"asha@example.com","password":"StrongPass123!"}'

# Submit an enquiry
curl -X POST http://localhost:5000/api/enquiries \
  -H "Content-Type: application/json" \
  -d '{"name":"Rahul Sharma","email":"rahul@example.com","courseInterest":"Full Stack Development"}'

# List unclaimed (replace TOKEN)
curl http://localhost:5000/api/enquiries/unclaimed -H "Authorization: Bearer TOKEN"

# Claim (replace TOKEN and ENQUIRY_ID)
curl -X PATCH http://localhost:5000/api/enquiries/ENQUIRY_ID/claim -H "Authorization: Bearer TOKEN"
```

## Data models

**Employee**

| Field | Type | Notes |
|---|---|---|
| `name` | String | Required, 2 to 100 characters |
| `email` | String | Required, unique, stored lowercase |
| `password` | String | Required, bcrypt hash, hidden from queries by default |
| `createdAt`, `updatedAt` | Date | Added automatically |

**Enquiry**

| Field | Type | Notes |
|---|---|---|
| `name` | String | Required |
| `email` | String | Required, stored lowercase |
| `courseInterest` | String | Required |
| `phone` | String | Optional |
| `message` | String | Optional |
| `claimedBy` | ObjectId (Employee) | `null` until claimed, indexed |
| `createdAt`, `updatedAt` | Date | Added automatically |

A compound index on `claimedBy` and `createdAt` keeps the "my enquiries" and "unclaimed" lists fast.

## Error handling
All responses share one shape:

```json
{ "success": false, "message": "Human readable explanation" }
```

| Status | When |
|---|---|
| 400 | Invalid input or invalid ID |
| 401 | Missing, invalid, or expired token; wrong email or password |
| 404 | Unknown route or enquiry not found |
| 409 | Duplicate email, or enquiry already claimed |
| 500 | Unexpected server error (details are logged, not returned) |

## Testing with Postman
1. Import `backend/postman/CRM-Lead-Management.postman_collection.json`.
2. The collection uses three variables: `baseUrl` (default `http://localhost:5000`), `token`, and `enquiryId`.
3. Run **Register employee** or **Login**, then copy the returned token into the `token` variable.
4. Run **Submit public enquiry**, then **Get unclaimed enquiries**, and copy an enquiry `_id` into `enquiryId`.
5. Run **Claim enquiry**, then **Get my enquiries**. Running **Claim enquiry** a second time should return `409`.

## Design notes
- **Race-safe claiming:** the claim uses a single `findOneAndUpdate` filtered on `claimedBy: null`, so only one request can win. Others receive `409`. If nothing was updated, a second lookup separates "not found" (404) from "already claimed" (409).
- **Public enquiry form:** `POST /api/enquiries` is open on purpose so a website form can submit leads without logging in.
- **Email normalization:** emails are trimmed and lowercased before saving and before login lookups.
- **Request size limit:** JSON and form bodies are capped at 100 KB.

## Security notes
- Passwords are hashed with bcrypt and never returned by the API.
- Keep `JWT_SECRET` private and strong. Changing it logs everyone out.
- The public enquiry endpoint has no rate limiting or spam protection yet.
- CORS is open to all origins. Restrict it to your frontend's origin before going to production.
- Known issue: if a request to a protected route has no `Authorization` header at all, the middleware reads `header.startsWith` on an undefined value and returns a `500` instead of a `401`. Change the check to `if (!header || !header.startsWith("Bearer "))`.

## Future improvements
- Rate limiting and basic security headers (`express-rate-limit`, `helmet`)
- Stronger email and phone validation
- Pagination and filtering on enquiry lists
- Un-claim or reassign enquiries, plus status tracking (new, contacted, converted)
- Automated tests and a Docker setup
- A frontend dashboard for employees

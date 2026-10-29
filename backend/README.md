# CRM Lead Management API

Focused Node.js REST API assignment using Express, MongoDB, Mongoose, JWT and bcryptjs. No RBAC is added.

## Scope
- Employee registration and login
- Public enquiry submission
- Authenticated listing of unclaimed enquiries
- Claiming an enquiry by the logged-in employee
- Listing enquiries claimed by the logged-in employee

**Production note:** registration is unauthenticated here to match the basic assignment flow. A real CRM should restrict employee onboarding; hiding a registration link does not secure the endpoint.

## Run locally
1. Install Node.js 18+ and have MongoDB Atlas or local MongoDB ready.
2. Run `npm install`.
3. Copy `.env.example` to `.env` and set `MONGO_URI` and a random `JWT_SECRET` of at least 32 characters.
4. Run `npm run dev` (or `npm start`).

Default URL: `http://localhost:5000`

## Endpoints

| Method | Endpoint | Auth | Purpose |
|---|---|---|---|
| POST | `/api/auth/register` | No | Register employee |
| POST | `/api/auth/login` | No | Login and receive JWT |
| POST | `/api/enquiries` | No | Submit enquiry |
| GET | `/api/enquiries/unclaimed` | Bearer JWT | List unclaimed enquiries |
| PATCH | `/api/enquiries/:id/claim` | Bearer JWT | Claim enquiry |
| GET | `/api/enquiries/my` | Bearer JWT | List my claimed enquiries |
| GET | `/api/health` | No | Health check |

### Register
`POST /api/auth/register`
```json
{"name":"Asha Kumar","email":"asha@example.com","password":"StrongPass123!"}
```
Returns public employee details and a JWT. Passwords are hashed and hashes are not returned.

### Login
`POST /api/auth/login`
```json
{"email":"asha@example.com","password":"StrongPass123!"}
```
For protected endpoints send `Authorization: Bearer YOUR_JWT`.

### Submit enquiry
`POST /api/enquiries` (no token required)
```json
{"name":"Rahul Sharma","email":"rahul@example.com","courseInterest":"Full Stack Development","phone":"9876543210","message":"Please share batch details."}
```
Required: `name`, `email`, `courseInterest`. `phone` and `message` are optional. Duplicate enquiry emails are allowed.

### Claiming and visibility
New enquiries have `claimedBy: null`. Claiming uses a conditional atomic MongoDB update, preventing two employees from successfully claiming the same enquiry. Unclaimed results are sorted newest first. The `/my` endpoint filters by the employee ID from the verified token.

## Status codes
- `400`: invalid input/ID
- `401`: missing/invalid token or credentials
- `404`: enquiry does not exist
- `409`: duplicate employee email or already-claimed enquiry
- `500`: unexpected server error

## Models
**Employee:** name, normalized unique email, bcrypt-hashed password, timestamps.  
**Enquiry:** name, normalized email, courseInterest, optional phone/message, `claimedBy` employee reference or null, timestamps. `claimedBy` is the single source of truth; no redundant `isClaimed` flag.

## Manual test sequence
1. Register employee A and save the token.
2. Submit an enquiry without a token.
3. Fetch unclaimed enquiries with A's token.
4. Claim an enquiry with A's token.
5. Confirm it disappears from unclaimed results and appears in `/my`.
6. Register employee B and try to claim the same enquiry; expect `409`.
7. Call a protected endpoint without a token; expect `401`.

A Postman collection is included under `postman/`.

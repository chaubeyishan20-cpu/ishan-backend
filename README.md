# HarvestSync (SBL) — Backend API

Node.js + Express + MongoDB REST API powering the HarvestSync smart-farming platform.

## Endpoints

### Auth (`/api`)
| Method | Path | Body | Notes |
|---|---|---|---|
| POST | `/signup` | name, email, password, role (`farmer`/`buyer`) | |
| POST | `/login` | email, password | JWT, 7-day expiry |
| GET | `/me` | — | protected |
| POST | `/forgot-password` | email | single-use reset token; demo mode returns the link |
| POST | `/reset-password` | token, password | single-use, 1h expiry |

### Marketplace (`/api/listings`)
| Method | Path | Notes |
|---|---|---|
| GET | `/` | open listings, newest first, with rating aggregation |
| POST | `/` | farmer only, multipart, up to 3 photos (5MB each) |
| GET | `/mine` · `/myoffers` | protected |
| GET/POST | `/:id/reviews` | one review per author per listing (upsert) |
| POST | `/:id/offer` | buyer only, one pending offer at a time |
| POST | `/:id/offer/:offerId/accept` `…/reject` | owner only; accept creates an Order |
| POST | `/:id/mark-sold` | owner only, rejects remaining offers |
| DELETE | `/:id` | owner only |

### Orders (`/api/orders`)
`GET /buyer` · `GET /seller` · `PATCH /:id/status` (`ordered` → `shipped` → `delivered`)

### Notifications (`/api/notifications`)
`GET /` · `PATCH /read-all` (protected)

### Crops (`/api/crops`)
`GET /` · `GET /search?name=` · `GET /:name/prices` (deterministic 12-week series)

## Setup

```bash
cp .env.example .env   # set MONGO_URI, PORT, JWT_SECRET
npm install
npm run dev            # nodemon (or npm start)
```

## Security

- **zod** validation on every write route (`schemas/index.js`, `middleware/validate.js`)
- **express-rate-limit** on auth (30/15 min) and marketplace writes (60/10 min)
- Passwords hashed with **bcrypt** (10 rounds)
- Forgot-password endpoint responds identically for unknown emails (no account enumeration)
- Reset tokens stored **SHA-256 hashed**, single-use, 1-hour expiry
- Uploads filtered to `image/*`, capped at 5 MB, whitelisted filename generation
- `.env` and `uploads/` gitignored

## Demo Reset Flow

No SMTP is configured, so the forgot-password route returns the reset link directly with `demo: true`. Swap that block for nodemailer when a mail provider is added.

## CI

`.github/workflows/ci.yml` runs dependency install and `node --check` syntax validation on every push/PR.

---

Built by **Ishan Chaubey** as the SBL (Smart Farming) capstone.
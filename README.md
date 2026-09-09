# SBL Backend

Node.js + Express + MongoDB API powering the **SBL** project — a platform connecting farmers and buyers with crop information and a marketplace for produce.

## Getting Started

```bash
npm install
cp .env.example .env     # set MONGO_URI + JWT_SECRET
node seedcrops.js        # seed crop data (optional)
npm run dev              # -> http://localhost:5000
```

## Endpoints

### Auth

| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/api/signup` | — | Create account `{ name, email, password, role }` → returns `token` + user |
| POST | `/api/login` | — | Login `{ email, password }` → returns `token` + user |
| GET | `/api/me` | Bearer | Current user profile |

`role` is `"farmer"` or `"buyer"` (default `"buyer"`). Tokens are JWT (7-day expiry).

### Crops

| Method | Route | Description |
|---|---|---|
| GET | `/api/crops` | List all crops |
| GET | `/api/crops/search?name=` | Find a single crop by name |

### Marketplace

| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/api/listings` | — | All available listings (with farmer info) |
| POST | `/api/listings` | Bearer (farmer) | Create a listing `{ cropName, quantity, unit, pricePerUnit, location, contactPhone?, description? }` |
| GET | `/api/listings/mine` | Bearer | Your listings |
| DELETE | `/api/listings/:id` | Bearer (owner) | Delete a listing |

## Stack

Express 5 · Mongoose (MongoDB) · bcryptjs · jsonwebtoken · dotenv

---
Built by [@chaubeyishan20-cpu](https://github.com/chaubeyishan20-cpu).
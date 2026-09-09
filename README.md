# SBL Backend

Node.js + Express + MongoDB API powering the **SBL** project — a platform connecting farmers, buyers, and crop/pricing information.

## Getting Started

```bash
npm install
cp .env.example .env     # set MONGO_URI
npm run dev              # -> http://localhost:5000
```

## Endpoints

| Method | Route | Description |
|---|---|---|
| POST | `/api/register` | Create a user account |
| POST | `/api/login` | Log in (JWT auth) |
| GET | `/api/crops` | List crops |
| GET | `/api/crops/:id` | Get a single crop |
| POST | `/api/crops` | Add a crop |
| PUT | `/api/crops/:id` | Update a crop |
| DELETE | `/api/crops/:id` | Delete a crop |

Seed sample crop data with `node seedcrops.js`.

## Stack

Express 5 · Mongoose (MongoDB) · bcryptjs · JWT · dotenv

---
Built by [@chaubeyishan20-cpu](https://github.com/chaubeyishan20-cpu).
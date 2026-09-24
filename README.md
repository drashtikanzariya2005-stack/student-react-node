# Food Delivery Application (MERN Stack)

A full-stack food ordering app: browse a menu, add items to a cart, apply
coupons, place orders, download an invoice, track order status, and (as an
admin) manage the menu, categories, restaurants, offers, orders and users.

## Tech Stack
- **Frontend:** React 19 + Vite + React Router 7
- **Backend:** Node.js + Express 5 + MongoDB (Mongoose) + JWT auth

## Project Structure
```
Food_Delivery/
├── Backend/     # Express API (auth, foods, categories, orders, offers...)
└── Frontend/    # React app (customer site + separate admin panel)
```

## Prerequisites
- Node.js 18+
- MongoDB running locally (or a MongoDB Atlas connection string)

## 1. Backend Setup
```bash
cd Backend
npm install
```

Copy `.env.example` to `.env` and fill it in:
```
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/food_delivery
JWT_SECRET=<a long random string>
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
```
`CLIENT_URL` is used as the allowed CORS origin. `JWT_SECRET` must be changed
before deploying anywhere real — `.env` is git-ignored and must never be
committed.

**Seed the database:**
```bash
npm run seed              # 40 food items (with Veg/Non-Veg/Jain diet types),
                          # their sub-categories, and one admin account
npm run seed:restaurants  # optional: sample restaurants, linked to foods
npm run seed:categories   # optional: re-sync categories from existing foods
```
Admin login created by the seed: **admin@fooddelivery.com** / **Admin@123**

**Start the server:**
```bash
npm run dev      # with nodemon (auto-restart)
# or
npm start
```
The API runs at `http://localhost:5000`.

## 2. Frontend Setup
```bash
cd Frontend
npm install
npm run dev
```
The app runs at `http://localhost:5173`. Set `VITE_API_URL` in `Frontend/.env`
if your backend isn't on the default `http://localhost:5000/api`.

## Admin panel
The admin panel is a completely separate session from the customer site — it
uses its own localStorage keys, so logging in on one side can never affect the
other. Go to `http://localhost:5173/admin/login` (not `/login`).

## Troubleshooting: "my data isn't saving"
Almost always because **MongoDB isn't running** or `MONGO_URI` is wrong. The
API returns an immediate `503 Database not connected...` instead of hanging —
check the backend terminal and the browser's Network tab. Fix by starting
`mongod` locally or pasting an Atlas connection string into `MONGO_URI`, then
restart the backend.

## Payments — important
**All payments in this project are simulated.** There is no Razorpay, Stripe,
or any other real gateway wired up. Choosing Card / UPI / Pay Online calls
`POST /api/orders/pay`, which returns a generated reference id (`SIM-...`) and
marks the order Paid. No money moves and no card data is stored.

To integrate a real gateway later: create the payment order on the provider's
platform, verify the signature/webhook server-side in `orderController.js`, and
only then set `paymentStatus` to `"Paid"`.

## What's included

### Customer features
- Browse menu with Veg / Non-Veg / Jain main filter, sub-category pills, restaurant filter and search
- Wishlist (❤️ save for later)
- Add to cart, adjust quantities (cart persists in localStorage, cleared on logout)
- Register / Login (JWT-based)
- Coupon codes applied at checkout, re-validated server-side
- Checkout with delivery address + Cash on Delivery or simulated Card/UPI/Online
- Invoice page after checkout with **Download as PDF**
- "My Orders" with live status badges, payment info and order cancellation
- **My Profile** — view login details, edit name/phone/address, change password
- **Contact Us** page to send a message to the team

### Admin features
- `/admin` dashboard with live counts (orders, revenue, customers, menu items, new messages)
- `/admin/foods` — add, edit, delete menu items
- `/admin/categories` — manage sub-categories under Veg / Non-Veg / Jain
- `/admin/restaurants` — add restaurants and link them to menu items
- `/admin/offers` — create and manage coupon codes (inactive offers visible to admin only)
- `/admin/orders` — all orders, payment status, delivery time, status updates, refund handling, bill view
- `/admin/users` — view and edit registered users, change role, delete accounts
- `/admin/messages` — read Contact Us submissions and mark them New/Read/Resolved

### API overview
| Method | Route                          | Access          |
|--------|---------------------------------|-----------------|
| POST   | /api/users/register             | Public          |
| POST   | /api/users/login                | Public          |
| POST   | /api/users/logout               | Logged-in user  |
| GET    | /api/users/profile              | Logged-in user  |
| PUT    | /api/users/profile              | Logged-in user  |
| PUT    | /api/users/change-password      | Logged-in user  |
| GET    | /api/users                      | Admin           |
| PUT    | /api/users/:id                  | Admin           |
| DELETE | /api/users/:id                  | Admin           |
| GET    | /api/foods                      | Public (`?category=` `?dietType=` `?restaurant=` `?search=`) |
| GET    | /api/foods/:id                  | Public          |
| POST / PUT / DELETE | /api/foods[/:id]   | Admin           |
| GET    | /api/categories                 | Public (`?mainCategory=` `?activeOnly=`) |
| GET    | /api/categories/main            | Public          |
| POST / PUT / DELETE | /api/categories[/:id] | Admin      |
| GET    | /api/restaurants                | Public          |
| POST / PUT / DELETE | /api/restaurants[/:id] | Admin     |
| GET    | /api/offers                     | Public (admin also sees inactive) |
| POST   | /api/offers/validate            | Public          |
| POST / PUT / DELETE | /api/offers[/:id]  | Admin           |
| GET    | /api/wishlist                   | Logged-in user  |
| POST   | /api/wishlist/:foodId           | Logged-in user (toggle) |
| POST   | /api/orders                     | Logged-in user  |
| POST   | /api/orders/pay                 | Logged-in user (simulated payment) |
| GET    | /api/orders/my-orders           | Logged-in user  |
| GET    | /api/orders/:id                 | Order owner or admin |
| PUT    | /api/orders/:id/cancel          | Order owner or admin |
| GET    | /api/orders                     | Admin           |
| PUT    | /api/orders/:id/status          | Admin           |
| PUT    | /api/orders/:id/payment-status  | Admin           |
| PUT    | /api/orders/:id/delivery-time   | Admin           |
| POST   | /api/contact                    | Public          |
| GET / PUT / DELETE | /api/contact[/:id] | Admin           |

## Security notes
- Order totals are **always** computed server-side. The client only sends food
  ids and quantities; names and prices are read back from the database, so a
  tampered request cannot change what a customer is charged.
- Coupons are re-validated during order creation, not trusted from the earlier
  preview call.
- `node_modules` and `.env` are git-ignored — run `npm install` in both
  `Backend` and `Frontend` after cloning.

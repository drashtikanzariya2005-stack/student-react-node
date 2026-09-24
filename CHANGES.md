# Review Fixes — What Changed

Every point below was found during a full code review of the previous version
of this project. Grouped by severity.

## Critical bugs fixed

**1. Order prices were taken from the browser**
`createOrder` calculated the bill from the `price` the client sent, so a
crafted request (`"price": 1`) could buy a ₹500 order for ₹1.
*Fix:* new `buildTrustedItems()` in `Backend/controllers/orderController.js`
re-reads every item from the `Food` collection. The client now only controls
*which* food and *how many*; name and price always come from the database.

**2. Admin's "View Bill" button was broken**
`/bill/:id` was a customer-only route using the customer token, but the admin
panel has a separate session — an admin clicking View Bill was redirected to
the customer login page.
*Fix:* new route `/admin/bill/:id` rendering `<OrderBill admin />`, which uses
`adminApiFetch`. `ManageOrders.jsx` now links there.

**3. Admin could never see inactive offers**
`GET /api/offers` had no auth middleware, so `req.user` was always undefined
and the admin check inside the controller never passed.
*Fix:* new `Backend/middleware/optionalAuthMiddleware.js` — attaches `req.user`
when a valid token is present but never blocks the request.

**4. Seeded food had no diet type**
`seed/seed.js` set no `dietType`, so all items defaulted to "Veg" — including
Chicken Burger, Pepperoni Pizza and BBQ Chicken Pizza. It also broke the admin
"Edit Food" form, whose validation requires the sub-category to belong to the
selected main category.
*Fix:* every seeded item now has a correct `Veg` / `Non-Veg` / `Jain` value,
and the seed also creates the matching `Category` documents so the Menu page's
sub-category pills work immediately.

**5. The PDF invoice feature did not exist**
`jspdf` and `jspdf-autotable` were installed but never imported, and
`OrderBill.jsx` had no download button — even though the old notes claimed it
was done.
*Fix:* implemented. `OrderBill.jsx` now has a working **Download as PDF**
button producing a proper invoice (header, item table, bill breakdown, totals).

## Security / submission hygiene

**6. No `.gitignore` anywhere**, while the README claimed `.env` was ignored.
*Fix:* `.gitignore` added at the project root and in both `Backend/` and
`Frontend/` (`node_modules`, `.env`, `dist`, logs, editor files).

**7. The committed `.env` contained a real JWT secret.** Rotated to a new
random value. Change it again before any real deployment.

**8. `node_modules` was shipped inside the zip** (35 MB, 11,360 files) despite
the notes saying it was excluded. This zip contains source only — run
`npm install` in both folders.

**9. CORS was open to every origin** while `CLIENT_URL` sat unused in `.env`.
*Fix:* `server.js` now uses `cors({ origin: process.env.CLIENT_URL || true })`.

**10. Backend-only libraries in the frontend.** `bcryptjs` and `jsonwebtoken`
were listed in `Frontend/package.json` and never imported — removed from both
`package.json` and `package-lock.json`.

## Performance

**11. Category sync ran on every request.** `getCategories` called
`syncCategoriesFromFoods()` on each `GET /api/categories`, re-scanning the
whole `Food` collection with one upsert per food.
*Fix:* cached — runs once per server start and at most every 5 minutes.
`GET /api/categories?resync=true` forces it when needed.

## Robustness

**12. Corrupted cart data crashed the app.** `CartContext` parsed
`localStorage` without a guard — one bad value meant a white screen.
*Fix:* wrapped in try/catch with an array check, plus a guarded write.

**13. Cart survived logout.** The next person on the same browser inherited
the previous customer's items.
*Fix:* `AuthContext` fires an `auth-logout` event; `CartContext` listens to it
(and to `auth-expired`) and empties the cart.

**14. Missing `.catch()`** on the fetches in `Offers.jsx`, `Wishlist.jsx` and
`ManageUsers.jsx` — a backend failure silently showed an empty page.
*Fix:* proper error state and message on all three. `Wishlist`'s remove action
now also rolls back with a toast on failure.

**15. `wishlistController` / `offerController` had no try/catch** and the
wishlist toggle didn't check whether the food id existed.
*Fix:* both rewritten with consistent error handling and a 404 for unknown
food ids.

## Readability (important for the report / viva)

**16. Seven files were written as unreadable one-liners** —
`offerRoutes.js`, `wishlistRoutes.js`, `models/Offer.js`, `models/Wishlist.js`,
`wishlistController.js`, `offerController.js`, `ManageUsers.jsx`, plus
`logoutUser` inside `userController.js`. All rewritten in the same commented
style as the rest of the project, with no behaviour change other than the
fixes listed above.

**17. Coupon rules were duplicated** in `offerController` and
`orderController`, so the preview and the real order could drift apart.
*Fix:* a single shared `evaluateOffer()` exported from `offerController`.

**18. Dead code removed.** `AdminRoute` in `ProtectedRoute.jsx` was never
imported (`AdminLayout` does the guarding).

## Features / polish

**19. Admin dashboard was static.** Now shows live counts: total orders, orders
in progress, total revenue (cancelled orders excluded), registered customers,
menu items and new messages. Styled for both light and the dark admin shell.

**20. Missing npm scripts.** Added `seed:restaurants` and `seed:categories`;
`main` corrected from `index.js` to `server.js`.

**21. Documentation rewritten.** The old README described a full Razorpay
integration (`/api/payment/create-order`, `/api/payment/verify`) that does not
exist in the code, and a block/unblock UI that had been replaced by Edit.
`OrderBill` also displayed "Paid Online (Razorpay)".
*Fix:* README now documents the real API surface and states plainly that
payments are simulated; the bill label reads "(simulated)". The stale
`BILL_FEATURE_NOTES.md` and `PROJECT_UPDATES.md` were removed in favour of this
file.

---

## How to run
```bash
cd Backend  && npm install && npm run seed && npm run dev
cd Frontend && npm install && npm run dev
```
Use `npm install` (not `npm ci`) the first time — the lock files were edited to
drop the two removed frontend dependencies.

# XPT-Store — Progress Tracker

Last updated: 2026-06-22

## Phase 1 — Project Scaffolding & Theme ✅

- [x] Next.js 16 + TypeScript + Tailwind CSS
- [x] Dark Workshop theme (CSS variables, custom colors, blue accent)
- [x] Custom UI components: `WsButton`, `WsCard`, `WsInput`, `WsBadge`
- [x] 20+ shadcn/ui primitives (dialog, table, tabs, sheet, etc.)
- [x] Layout: `Header`, `Footer`, `MobileMenu`, `AdminSidebar`, `LanguageSwitcher`
- [x] Fonts: Inter (body) + Orbitron (headings)
- [x] `AuthProvider` context + `useAuth` hook

## Phase 2 — DynamoDB & Data Layer ✅

- [x] 20 DynamoDB table definitions (`store_` prefix)
- [x] 19 DB modules with full CRUD (`users`, `products`, `categories`, `orders`, `cart`, `reviews`, `returns`, `addresses`, `wishlists`, `shipping`, `rfq`, `pages`, `settings`, `inventory`, `search-logs`, `variants`, `audit-log`)
- [x] TypeScript types for all entities
- [x] Zod validation schemas (14 schemas)
- [x] Utilities: `generateId`, `formatCurrency`, `formatDate`, `sanitizeHtml`, `stripHtml`
- [x] Response helpers with CORS + security headers

## Phase 3 — Authentication ✅

- [x] Lambda handlers: `login`, `register`, `me`, `refresh`, `forgot-password`, `two-factor-setup`
- [x] JWT auth: access tokens (7d) + refresh tokens (30d)
- [x] bcrypt password hashing (12 rounds)
- [x] Auth middleware: `requireAuth`, `requireAdmin`
- [x] DynamoDB-backed rate limiting
- [x] TOTP two-factor authentication
- [x] Frontend pages: login, register, forgot-password
- [x] `AuthProvider` + `useAuth` hook

## Phase 4 — Internationalization (i18n) ✅

- [x] next-intl v4 configured (`localePrefix: "as-needed"`)
- [x] Supported locales: EN + zh-CN
- [x] All UI strings externalized in `en.json` and `zh-CN.json`
- [x] Locale middleware (excludes admin routes)
- [x] `LanguageSwitcher` component
- [x] Locale-aware `Link`, `useRouter`, `usePathname`

## Phase 5 — AWS Services Integration ✅

- [x] S3: presigned upload/download URLs, CloudFront public URL, delete
- [x] SES: email sending with HTML + text
- [x] 7 email templates (order confirmation, shipping, return status, password reset, welcome, low stock alert, new order alert)
- [x] OpenSearch: product indexing, fuzzy search, bulk index
- [x] Upload Lambda handler (admin-only for products/categories, customers for reviews/returns)
- [x] `ImageUpload` drag-and-drop component

## Phase 6 — Category Management (Admin) ✅

- [x] Lambda handlers: create, get, list, update, delete
- [x] Delete blocks if category has children or products
- [x] Admin audit logging on all mutations
- [x] Admin categories page with tree view (expand/collapse)
- [x] `CategoryFormModal` (name, slug, parent, description, sort order, status, image)

## Phase 7 — Product Management (Admin) ✅

- [x] Lambda handlers: create, get, list, update, delete (cascades variants)
- [x] Variant handlers: create, list, update, delete (enforces unique SKU)
- [x] Admin product list page with search, status/category filters
- [x] Admin product create + edit pages
- [x] `ProductForm` (basic info, pricing, images, SEO, status)
- [x] `VariantManager` (variant types, SKU, price, stock, attributes)

## Phase 8 — Storefront: Homepage & Category Pages ✅

- [x] Homepage: hero section, dynamic categories, new arrivals, "Why XPT-TECH" section
- [x] Categories listing page (tree: parents + children)
- [x] Category detail page (subcategory badges, product grid, empty state)
- [x] Products listing page (category sidebar filter, loading skeletons)
- [x] `ProductCard` component (image, name, rating, price, cart button)

## CDK Infrastructure ✅

- [x] `DatabaseStack` — 20 DynamoDB tables with GSIs, PAY_PER_REQUEST
- [x] `StorageStack` — S3 bucket (private + CORS) + CloudFront distribution
- [x] `SecurityStack` — WAF WebACL + Secrets Manager
- [x] `ApiStack` — Lambda functions + API Gateway REST API
- [x] Deployment order enforced: Database → Storage → Security → Api

## Tests — 490 total ✅

- [x] Backend: 251 tests across 20 files
- [x] Frontend: 239 tests across 28 files
- [x] Vitest configured for both workspaces (node + jsdom environments)

---

## Phase 9 — Product Detail Page ✅

- [x] Product detail page (`[locale]/products/[slug]/page.tsx`)
- [x] `ProductGallery` — image gallery with thumbnail selection
- [x] `VariantSelector` — variant option buttons with availability check
- [x] `StockBadge` — in stock / low stock / out of stock badge
- [x] `ProductReviews` — review list with rating summary + distribution
- [x] `ReviewForm` — star rating, title, comment, submit to API
- [x] `RelatedProducts` — horizontal scroll of related product cards
- [x] Reviews API: `GET /products/{id}/reviews` (approved only) + `POST /products/{id}/reviews` (auth required)
- [x] CDK wiring for review endpoints
- [x] i18n keys added (EN + zh-CN) for specs, review form, variant selector
- [x] Unit tests: 10 backend (review handlers) + 47 frontend (6 component test files + page test)

## Phase 10 — Product Listing & Search ✅

- [x] Search results page (`[locale]/search/page.tsx`) with pagination, filters sidebar
- [x] `SearchBar` with auto-suggest dropdown, integrated into Header (desktop + mobile)
- [x] `SearchSuggestions` — debounced dropdown with product name, price, "View All" link
- [x] `SearchFilters` sidebar (category list, price range min/max)
- [x] `useSearch` hook (calls `/search` API with filters) + `useDebounce` hook (300ms)
- [x] Search API: `GET /search` — OpenSearch multi-match query + non-blocking search logging
- [x] CDK wiring for search endpoint
- [x] i18n keys added (EN + zh-CN) for search page
- [x] Unit tests: 9 backend (search handler) + 57 frontend (6 test files: debounce, search hook, SearchBar, SearchSuggestions, SearchFilters, search page)

## Phase 11 — Shopping Cart ✅

- [x] Cart page (`[locale]/cart/page.tsx`) — full cart with product info, quantity controls, summary sidebar
- [x] `CartDrawer` slide-out mini cart (Sheet component) with item list, subtotal, checkout button
- [x] `CartItem` — product image, name, variant label, price, quantity +/- controls, remove
- [x] `CartSummary` — subtotal, shipping, tax, total (supports compact mode)
- [x] `useCart` hook + `CartProvider` — context-based cart state, localStorage for guests, API sync for logged-in users, merge on login
- [x] Cart API: `GET /cart`, `PUT /cart` (upsert), `POST /cart` (add item), `DELETE /cart` (clear), `DELETE /cart/{productId}` (remove item)
- [x] Header updated: dynamic cart badge count, cart drawer toggle (replaces static link)
- [x] Product detail page: "Add to Cart" button now wired to `addItem()`
- [x] CDK wiring for all cart endpoints
- [x] Unit tests: 19 backend (cart handlers) + 28 frontend (CartItem, CartSummary, CartDrawer, cart page)

## Phase 12 — Checkout & Stripe Payment ✅

- [x] Multi-step checkout page (`[locale]/checkout/page.tsx`) — address → shipping → payment → confirmation
- [x] `AddressForm` — saved address selector + new address form, auto-selects default
- [x] `ShippingOptions` — calculates shipping via API, shows zone name + cost + estimated delivery
- [x] `PaymentForm` — Stripe Payment Element integration with `confirmPayment`
- [x] `OrderReview` — item summary, shipping address, PO number, order notes, totals
- [x] Orders API: `POST /orders` (create order + Stripe PaymentIntent), `GET /orders` (user list), `GET /orders/{id}`
- [x] Shipping API: `POST /shipping/calculate` (weight-based rate calculation)
- [x] Stripe webhook: `POST /webhooks/stripe` (payment_intent.succeeded → processing, payment_failed → cancelled)
- [x] Order supports both saved addresses (by ID) and inline new addresses
- [x] CDK wiring for orders, shipping, and webhook endpoints
- [x] i18n keys added (EN + zh-CN) for checkout flow (address fields, steps, confirmation)
- [x] Unit tests: 37 backend (orders, shipping, webhook handlers) + 30 frontend (AddressForm, OrderReview, cart page)

## Phase 13 — Customer Account ✅

- [x] Account layout with auth guard + sidebar nav (`AccountNav` component)
- [x] Dashboard page: welcome, stats cards (orders/addresses/wishlist), recent orders list
- [x] Order history page + order detail page (with tracking, items, address, totals)
- [x] Address book page (add, edit, delete, set default)
- [x] Wishlist page (product cards with remove, fetches product details)
- [x] Reviews page (user's submitted reviews with status badges)
- [x] Settings page (profile form, password change, language selector, business fields)
- [x] 11 backend handlers: get-profile, update-profile, list-addresses, create-address, update-address, delete-address, get-wishlist, add-wishlist, remove-wishlist, list-orders, list-reviews
- [x] CDK wiring for all /users/me/* routes
- [x] i18n keys added (EN + zh-CN) for account section
- [x] Unit tests: 43 backend (4 test files) + 61 frontend (6 test files)

## Phase 14 — Shipping Management (Admin) ⬜

- [ ] Shipping zones page + form
- [ ] Shipping zone APIs (CRUD)
- [ ] Unit tests

## Phase 15 — Order Management (Admin) ⬜

- [ ] Admin order list + detail pages
- [ ] Order status update + tracking
- [ ] Order export (CSV)
- [ ] Email notifications on status change
- [ ] Unit tests

## Phase 16 — Returns & Refunds ⬜

- [ ] Customer return request pages
- [ ] Admin return review + approve/reject
- [ ] Stripe refund integration
- [ ] Returns APIs
- [ ] Unit tests

## Phase 17 — Inventory, Users & Reviews (Admin) ⬜

- [ ] Inventory management page (stock levels, low stock alerts)
- [ ] User management pages (list, detail, role toggle)
- [ ] Review moderation page
- [ ] APIs for users list, review status update
- [ ] Unit tests

## Phase 18 — B2B, RFQ & PDF Invoices ⬜

- [ ] RFQ form page + admin RFQ list
- [ ] RFQ API
- [ ] PDF invoice generation (`@react-pdf/renderer`)
- [ ] Invoice download API
- [ ] Unit tests

## Phase 19 — Static Pages, Contact & FAQ ⬜

- [ ] Static page renderer (`[locale]/pages/[slug]`)
- [ ] Admin page editor (rich text)
- [ ] Contact form + email via SES
- [ ] FAQ page with accordion
- [ ] Pages + contact APIs
- [ ] Unit tests

## Phase 20 — Admin Dashboard & Analytics ⬜

- [ ] Admin dashboard (stats cards, recent orders, top products)
- [ ] Analytics page (search queries, conversion funnel)
- [ ] Dashboard components
- [ ] Unit tests

## Phase 21 — SEO & Performance ⬜

- [ ] `sitemap.ts`, `robots.ts`
- [ ] JSON-LD structured data on product pages
- [ ] Open Graph + Twitter Card meta tags
- [ ] GA4 integration + custom event tracking
- [ ] Image optimization (Next.js Image + CloudFront)

## Phase 22 — Admin Settings & Seed Data ⬜

- [ ] Admin settings page
- [ ] Settings API
- [ ] Seed script (categories, products, shipping zones, pages)
- [ ] Unit tests

## Phase 23 — Shared Components & Polish ⬜

- [ ] `Pagination`, `DataTable`, `ConfirmDialog`, `EmptyState`, `LoadingSkeleton`
- [ ] Custom 404, error, loading pages
- [ ] Unit tests

## Phase 24 — Environment & Deployment ⬜

- [ ] `.env.example` with all required vars
- [ ] Final `next.config.ts`
- [ ] Deployment documentation

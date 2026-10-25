# LipaTim: Phased Development Roadmap (Scratch to Vercel Production)

**App:** LipaTim — Smart Business Management & Seamless eTIMS Compliance  
**Target Market:** Kenyan SMEs (Nairobi & nationwide)  
**Deployment Target:** Vercel & PWA Edge Deployment

---

## Roadmap Overview

```
[Phase 1: Foundation & Domain Core]
       ↓
[Phase 2: Point of Sale & Automated eTIMS Engine]
       ↓
[Phase 3: Safaricom Daraja M-Pesa Integration & Split Payments]
       ↓
[Phase 4: Smart Inventory & Multi-Branch Management]
       ↓
[Phase 5: Debt (Madeni), Expenses & Supplier Ledgers]
       ↓
[Phase 6: Compliance Analytics, Z-Reports & KRA VAT Filing Exports]
       ↓
[Phase 7: Offline-First Sync & Hardware Integration (Thermal/Bluetooth)]
       ↓
[Phase 8: Multi-Role RBAC, SaaS Billing & Vercel Production Deployment]
```

---

## Phase Breakdown

### **Phase 1: Architecture, Design Constitution & Domain Models**
- **Goal:** Establish the foundational architecture, TypeScript data models for Kenyan tax/business laws, responsive UI shell, and local state store.
- **Key Deliverables:**
  - Setup core data schema: Products, Categories, Stock batches, Tax bands (16% VAT, 8% Fuel/Special, 0% Exempt, Zero-rated), Customers, Suppliers, Invoices, Payments, Outlets/Branches.
  - Kenyan currency formatters (`KES`), KRA PIN validation (`A012345678X`), Phone normalization (`+254` / `07...` / `01...`).
  - Professional, high-density ERP & POS navigation shell (Sidebar, Header with online/offline indicator, branch selector, role badge).
  - Seed dataset tailored to Kenyan retail/wholesale (chemist, minimart, electronics shop, hardware store).

---

### **Phase 2: Point of Sale (POS) & Automated eTIMS Invoicing Engine**
- **Goal:** Lightning-fast cashier interface with real-time tax breakdown, KRA eTIMS VSCU/OSCU payload simulation, QR code generation, and digital receipts.
- **Key Deliverables:**
  - Rapid search & barcode scanner input (keyboard wedge & camera).
  - Dynamic cart with line-item discounts, custom price edits, tax auto-calculation.
  - Automated KRA eTIMS invoice generation:
    - Control Unit (CU) Serial number format (`KRA-VSCU-XXXXXXXX-YYYY`).
    - Internal cryptographic verification hash & QR Code encoder.
    - KRA tax categorization (A: 16%, B: 0%, C: Exempt, D: Non-VATable).
  - Print-ready 58mm / 80mm thermal receipt generator, plus one-tap WhatsApp & Email share links.

---

### **Phase 3: Safaricom Daraja M-Pesa & Payment Engine**
- **Goal:** Complete payments workflow with real-time simulated Daraja STK Push, Till/Paybill reconciliation, and split tenders.
- **Key Deliverables:**
  - Integrated M-Pesa modal: Instant STK Push to customer phone with live countdown, callback polling & status confirmation.
  - Till Number (Buy Goods) & Paybill manual/auto-reconciliation tool.
  - Split Tender handling: e.g., KES 2,500 Cash + KES 5,000 M-Pesa + KES 1,000 Store Credit.
  - Transaction reference logger with duplicate check.

---

### **Phase 4: Smart Inventory, Expiry Tracking & Multi-Branch Stock**
- **Goal:** Tight stock control preventing shrinkage, batch tracking for perishables/pharmaceuticals, and reorder alerts.
- **Key Deliverables:**
  - Stock-In (Goods Received Note / GRN) and Stock-Out (Damage, Theft, Transfer, Return) audit trails.
  - Batch number, manufacture date, and expiry date monitoring with early warning badges.
  - Multi-location/branch inventory view with inter-branch stock transfers.
  - Low stock warning triggers with automated SMS/WhatsApp draft order to suppliers.

---

### **Phase 5: Credit (Madeni) Management, Opex & Supplier Ledger**
- **Goal:** Manage informal Kenyan credit customer relationships and control operational expenses.
- **Key Deliverables:**
  - Customer Debt (Madeni) ledger: Credit limits, overdue days, payment history.
  - Automated friendly SMS payment reminder template generator in English & Sheng/Swahili.
  - Opex & Overhead logging: Rent, KPLC electricity tokens, water, county council licenses, staff daily advances.
  - Wholesaler/Supplier accounts payable ledger and purchase history.

---

### **Phase 6: Compliance Analytics, Daily Z-Reports & KRA VAT Filing**
- **Goal:** Give the business owner instant visibility into P&L and automate month-end KRA iTax filing.
- **Key Deliverables:**
  - End-of-Day Z-Report generator (Opening float, total sales by payment mode, tax collected, cash in drawer vs theoretical).
  - Real-time Profit & Loss statement based on Cost of Goods Sold (COGS) vs Net Sales.
  - 1-Click KRA iTax VAT 3 / eTIMS CSV/Excel export formatted exactly to KRA template specifications.
  - Fast business performance charts (top 10 grossing items, dead stock, cashier sales velocity).

---

### **Phase 7: Offline-First Architecture & Hardware Integration**
- **Goal:** Ensure uninterrupted sales during Safaricom network or ISP fiber downtime.
- **Key Deliverables:**
  - Service Worker & IndexedDB offline cache: Full POS operations function seamlessly without internet.
  - Pending sync queue: Queues eTIMS submissions and cloud backups; auto-flushes when back online with conflict resolution.
  - Web Bluetooth / WebUSB ESC/POS thermal printer direct connection toggle.
  - PWA manifest configuration for 1-click home screen install on Android POS terminals & tablets.

---

### **Phase 8: Multi-Role RBAC, SaaS Monetization & Vercel Production Build**
- **Goal:** Role-based security, subscription tier limits (Solo, Business, Enterprise), and production deployment readiness.
- **Key Deliverables:**
  - User Access Control: Cashier (POS only, cannot delete sales/view margins), Manager (Discounts, Stock-in, Z-reports), Admin/Owner (Full access, P&L, settings).
  - SaaS Plan Switcher & feature gates according to LipaTim pricing (Solo KES 1.2k, Business KES 3k, Enterprise KES 7k).
  - Comprehensive unit & integration checks, environment variables setup, zero-error production build.
  - Vercel configuration (`vercel.json`), serverless routing, edge headers, and step-by-step live deployment instructions.

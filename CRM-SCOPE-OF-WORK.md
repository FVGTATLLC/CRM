# CRM Application - Scope of Work

## Project Overview

Build a **Travel Industry CRM** (Customer Relationship Management) web application for a multi-national travel company (Flyvento). The system manages leads, accounts, contacts, activities, and business operations across multiple business lines, regions, countries, and branches. The CRM must support role-based access control with three user tiers (Super Admin, Admin, Standard) and a modular architecture where modules can be enabled/disabled.

---

## Tech Stack (Recommended)

- **Frontend**: React 18+ with TypeScript, Tailwind CSS, Shadcn/UI components
- **Backend**: Node.js with Express or Next.js API routes
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT-based session auth
- **State Management**: Zustand or React Context
- **Table/Grid**: TanStack Table (React Table v8)
- **Export**: xlsx library for Excel, csv generation
- **Deployment**: Docker-ready

---

## Module Architecture

The system is organized into 6 module categories. Each module has a short code, supports CRUD operations, and follows standard UI behaviors defined below.

### Category 1: System Modules (Always Enabled, Super Admin Only)

| Module | Short Code | Access |
|--------|-----------|--------|
| Module Master | MM | Super Admin only |
| Master Data Management (MDM) | MDM | Super Admin only |
| User Management | UID | Super Admin + Admin |
| Role & Permissions | RP | Super Admin only |

### Category 2: Settings & Master Modules (Always Enabled, Admin-managed)

| Module | Short Code | Description |
|--------|-----------|-------------|
| Business Line | BL | Business verticals (e.g., STTS, T3, SOE) |
| Region | RN | Geographic regions (R1-R20+) |
| Country | CN | 200+ countries with ISO codes, dialing codes, continent/sub-continent |
| Branch | BN | Branch offices linked to Region > Country |
| Department | DN | Departments (9+ departments) |
| API Management | -- | Hold/Future |
| Alerts | AA | Hold/Future |

### Category 3: Utility Modules (Always Enabled, All Users)

| Module | Description |
|--------|-------------|
| Reports | Configurable reports (enable/disable per deployment) |
| Global Dashboard | System-wide dashboard |
| Login Page | Authentication entry point |
| CRM Home | Landing page after login |
| User Profile | User profile view/edit |
| Notifications | Bell icon notification system |
| Activity Logs | Audit trail of user actions |

### Category 4: Core CRM Modules (Enable/Disable, All User Tiers)

| Module | Description |
|--------|-------------|
| Contact | Contact management |
| Leads | Lead management (single module, categorized by type) |
| Account | Account management (single module, categorized by segment) |
| Activity - Meeting | Meeting scheduling and tracking |
| Activity - MOM | Minutes of Meeting records |
| Activity - Calls | Call logging |
| Activity - Email | Email activity tracking |
| Activity - Chat | Chat activity tracking |

### Category 5: Add-On Modules (Enable/Disable, All User Tiers)

| Module | Description |
|--------|-------------|
| Tender | Tender/bid management |
| Query vs Conversion (Enquiry) | Enquiry tracking and conversion |
| Geo Fencing | Location-based features |
| Time Zone | Multi-timezone support |

### Category 6: Phase II Modules (Future - Structure Only)

FACTS Integration, Email Integration (EMS), Contract, Opportunity, Task, Notes, Booking, Currency, Client Portal, Calendar, Quotes, Assets, Employees/People, Forecast/Target, Approval, HRMS Integration, Chat Integration, Recycle Bin, KRA/KPI Scorecard, Digital Marketing

---

## Data Model & Entity Definitions

### Module Master
- Module ID (auto), Module Name, Module Short Code, API Name
- Module Category: System / Master / Core / Transactional / Supporting
- Module Status, Module Description, Detailed Notes/Remarks
- Access Control: Super Admin / Admin / Standard
- Audit fields: Owner, Owner ID, Created By, Created By ID, Created At, Last Modified By, Last Modified By ID, Last Modified At

### Global Master (MDM - Master Data Management)
- Module ID, Module Name, Dropdown ID, Dropdown Name
- L1 Category, L2 Sub Category, L3 Type
- Parent ID, Is Active, Remarks
- Audit fields (same pattern as above)

### Business Line
- Business Line ID (auto), Business Line Name (dropdown: STTS, T3, SOE)
- Business Line Status, Remarks
- Owner ID, Owner
- Audit fields

### Region
- Region Name ID (auto), Region Name (R1-R20+), Region Code
- Business Line ID, Business Line (linked)
- Regional Manager, Region Status, Remarks
- Audit fields

### Country
- Country Name ID (auto), Country Name (200+ countries)
- Continent, Sub-Continent
- Country Code ISO-2, Country Code ISO-3, Country Dialing Code
- Country Presence Status (Yes/No for 35 countries with presence)
- Country Status, Remarks
- Audit fields

### Branch
- Branch Name Code ID (auto), Branch Name Code, Branch Full Name
- Business Line ID/Name (linked), Region Name ID/Name (linked), Country Name ID/Name (linked)
- City, Branch Status, Remarks
- Audit fields

### Department
- Department Name ID (auto), Department Name (9 departments), Department Code
- Business Line ID/Name (linked)
- Department Status, Remarks
- Audit fields

### Role & Permissions (3-part structure)
**Part 1 - Create a Role:**
- Business Line, Department, User Type (Super Admin/Admin/Standard)
- Role Name (e.g., Branch Manager), Role Display Name (auto-generated concatenation)
- Role Status, Remarks
- Audit fields

**Part 2 - Assign Module Access:**
For each module, configure:
- CRUD Operations (Create/Read/Update/Delete - individually toggleable)
- Export permission (Yes/No)
- Import permission (Yes/No)
- Transfer permission (Yes/No)

**Part 3 - Assign Field-Level Access:**
For each module's columns/fields:
- CRUD Operation permission per field (Yes/No)

### User
- Business Line, Region, Country, Branch (linked dropdowns - cascading)
- Salutation, First Name, Last Name
- Username (ID auto), Username (email format)
- Phone Number Type, Country Dialing Code, Phone Number
- Password (hashed)
- Designation, Department, Sub-Department, Team/Function
- User Type (Super Admin/Admin/Standard)
- Role Name (linked), Role Display Name (auto)
- Reporting To (lookup within branch), Alternative Escalations
- Extra Branch access
- Timezone, Language, Number Format, Date Format
- Audit fields

### Lead Types (categorized within single Leads module)
- Corporate, Retail, Non-IATA, IATA, Airline, Other
- Each with segment > sub-segment > type hierarchy

### Account Types (categorized within single Account module)
- Corporate (with sub-segments: NCA, PNW, etc.), Retail, Non-IATA, Interbranch, Other

---

## Organizational Hierarchy

```
Business Line (STTS / T3 / SOE)
  |
  +-- Department (9 types)
  |     +-- Role (with permission sets)
  |           +-- User
  |
  +-- Region (R1-R20)
        +-- Country (200+)
              +-- Branch (offices)
```

---

## Standard UI Behaviors (Apply to ALL Module List/Table Views)

### 1. Search Bar
- Location: Top toolbar of module table view
- Placeholder text customizable per module
- Case-insensitive "contains" match logic
- Multi-word AND token search
- Combines with active filters using AND logic
- Debounced input (300-500ms) or Enter key triggers search
- Recent search history: max 5 per module, session-scoped
- Arrow key navigation through history, Enter to select
- ESC closes dropdown
- Shows result count; "No results found" for empty results
- Clearing search restores previous table view

### 2. Footer Bar - Rows Per Page
- Location: Bottom-left of footer bar
- Options: 25, 50, 75, 100 (max 100)
- Default: 25 rows per page
- Applies after search and filter logic
- Syncs with pagination dynamically
- Footer text: "Showing X-Y of Z entries" (with filtered count variant)
- Keyboard navigable (arrows, Enter, ESC)
- Session-persistent selection

### 3. Pagination
- Location: Bottom-right of footer bar (fixed position, frozen)
- Components: Previous/Next buttons, page number buttons, ellipsis for large ranges, manual page input
- Stays fixed during horizontal AND vertical scrolling
- Manual page entry with validation (auto-clamp to valid range)
- Hides when single page or no results
- Recalculates on filter/search/rows-per-page changes

### 4. Selected Record Details Bar
- Location: Left side of footer bar
- Format: "Showing X to Y of Z entries"
- Updates instantly on any table interaction
- Non-interactive, purely informational
- "No records found" for empty states

### 5. Sidebar Navigation
- Location: Left edge, fixed position (never scrolls with content)
- Expanded mode: Full logo + icons + module names
- Collapsed mode: Compact logo ("G") + icons only
- Toggle via hamburger/burger button
- Tooltips on hover in collapsed mode
- Active module always highlighted
- Vertical scroll for long module lists
- Responsive: auto-collapse on mobile

### 6. Full Screen Mode
- Location: Top header bar, right-side actions
- Toggle via click; ESC to exit
- Hides browser chrome, expands workspace
- All module state preserved (filters, pagination, search)
- Tables, dashboards, charts resize to fill space
- Sidebar maintains its expand/collapse state

### 7. Export Button
- Location: Top header bar
- 4 export modes:
  - **Export Current Selections**: Only selected rows
  - **Export Default View**: System default columns + filtered results
  - **Export My View**: User's personalized column layout + filters
  - **Export All**: Entire dataset, ignores filters
- File formats: CSV (always), Excel (optional per module)
- File naming: `Module_ExportType_DDMMMYYYY_HHMM`
- Never resets filters or pagination
- Permission-restricted columns excluded

### 8. Notification System (Bell Icon)
- Location: Top header bar, right-aligned
- Badge with unread count (9+ for >9)
- Dropdown panel: newest first, scrollable
- 4 notification types: Success (green), Info (blue), Warning (yellow), Error (red)
- Unread: highlighted + bold; auto-mark read on view
- Max 5 visible, scroll for more
- Dismiss individual or "Clear All" (session-based)
- Keyboard accessible (Tab, Enter, arrows, ESC)

### 9. Create Button
- Location: Top header bar, right-aligned
- Label: "+ Create New [Module Name]"
- Single-action modules: opens form directly
- Multi-action modules: opens dropdown menu
- Hidden/disabled if user lacks create permission
- Keyboard accessible

### 10. Create Form
- Opens from Create button; preserves page state
- Form header: "Create New [Module Name]"
- Sections with grouped fields (Basic Info, System Info, etc.)
- Field types: text, dropdown, date picker, multi-line text, radio buttons
- Mandatory fields marked with red asterisk (*)
- Validation on submit AND on field focus-out
- Inline error messages; form prevents submission until resolved
- Save: creates record, closes form, shows success notification
- Cancel/ESC: closes without saving (optional confirmation if data entered)
- Permission-controlled: button hidden if no create permission

### 11. Read Form (Detail View)
- Opens on clicking hyperlink value in table
- Header: "[Module Name] Details: [Record Name]"
- All fields non-editable, read-only visual style
- Sections: Basic Information, System & Other Info, Ownership, Status
- Hyperlinks inside form open related Read Forms (nested navigation)
- Status fields use visual badges/indicators
- Close via button, ESC, or back navigation
- Preserves table state on close
- Missing fields shown as "—"

### 12. Edit Form
- Opens from Edit icon in table OR Edit button in Read Form
- Header: "Edit [Module Object]: [Record Name]"
- Same structure as Create Form but with pre-populated data
- Only editable fields are input controls; others read-only
- Validation matches Create Form rules
- Save updates only modified fields
- Table row refreshes after save
- Permission-controlled: Edit icon hidden if no edit permission
- Some fields may be role-restricted (e.g., Status toggle)

### 13. User Profile Dropdown
- Location: Top-right corner of header bar
- Shows: Avatar + Username + Role
- Dropdown contains: enlarged avatar, username (bold), email, "View Profile" button, "Sign Out" button
- Opens on click only; closes on outside click, ESC, close button, or navigation
- Only one dropdown open at a time
- Session-based: username, email, role always available
- Default avatar icon if no image uploaded
- Sign Out clears session and redirects to login

---

## Date/Time Filter System

The system supports comprehensive date filtering with the following options:

| Category | Filters |
|----------|---------|
| General | Lifetime/All Time, Custom Range, MTD, YTD |
| Daily | Today, Yesterday, Last 7/14/30/60/90 Days, Tomorrow, Next 7/14/30/60/90 Days |
| Weekly | This Week, Last Week, Last 2/4 Weeks, Next Week, Next 2/4 Weeks |
| Monthly | This Month, Last Month, Last 2/3 Months, Next Month, Next 2/3 Months |
| Quarterly | This Quarter, Last Quarter, Last 2/3 Quarters, Next Quarter, Next 2/3 Quarters |
| Yearly | This Year, Last Year, Last 2/3 Years, Next Year, Next 2/3 Years |

Filter persistence options: Apply Filter, My Filter, All Filters, Custom Filter

---

## Role-Based Access Control (RBAC) Matrix

| Feature | Super Admin | Admin | Standard |
|---------|-------------|-------|----------|
| System Modules | Full Access | No Access | No Access |
| Settings & Master Modules | Full Access | No Access | No Access |
| User Management | Full Access | Full Access | No Access |
| Core CRM Modules | Full Access | Full Access | Full Access (per permission set) |
| Add-On Modules | Full Access | Full Access | Full Access (per permission set) |
| Module Enable/Disable | Yes | No | No |
| Role & Permission Management | Yes | No | No |

Permissions are granular:
- **Module level**: CRUD + Export + Import + Transfer
- **Field level**: Per-column CRUD visibility

---

## Pages & Routes to Build

1. **Login Page** - Email/password authentication
2. **CRM Home / Dashboard** - Global dashboard with key metrics
3. **Module Master** - CRUD for system modules (Super Admin)
4. **Master Data Management (MDM)** - Global dropdown/master data management
5. **User Management** - User CRUD with cascading dropdowns (BL > Region > Country > Branch)
6. **Role & Permissions** - 3-part role creation (Role + Module Access + Field Access)
7. **Business Line** - CRUD with dropdown values
8. **Region** - CRUD linked to Business Line
9. **Country** - CRUD with ISO codes, dialing codes, presence status
10. **Branch** - CRUD linked to BL > Region > Country
11. **Department** - CRUD linked to Business Line
12. **Contact** - Contact management with full CRUD
13. **Leads** - Lead management with type categorization (Corporate/Retail/Non-IATA/IATA/Airline/Other)
14. **Account** - Account management with segment categorization
15. **Activity - Meeting** - Meeting CRUD
16. **Activity - MOM** - Minutes of Meeting CRUD
17. **Activity - Calls** - Call log CRUD
18. **Activity - Email** - Email activity CRUD
19. **Activity - Chat** - Chat activity CRUD
20. **User Profile** - View/edit own profile
21. **Tender** - Tender management (Add-On)
22. **Query vs Conversion (Enquiry)** - Enquiry tracking (Add-On)

---

## Key Technical Requirements

### Authentication & Session
- JWT-based authentication
- Session management with token refresh
- Redirect to login on session expiry
- Password hashing (bcrypt)

### Cascading Dropdowns
- Business Line > Region > Country > Branch (linked selections)
- Department selection independent but linked to Business Line
- All master data dropdowns populated from MDM

### Audit Trail
- Every entity tracks: Created By, Created At, Last Modified By, Last Modified At, Owner
- All IDs stored alongside display names for referential integrity

### Data Table (Standard for ALL modules)
- Sortable columns
- Column visibility toggle (user-configurable "My View")
- Row selection (checkbox)
- Action column with: View (Read), Edit, Delete icons
- Hyperlink on primary field (opens Read Form)
- Fixed header during vertical scroll
- Horizontal scroll for wide tables
- Responsive layout

### API Design
- RESTful API endpoints per module
- Standard CRUD: GET (list + single), POST, PUT/PATCH, DELETE
- Pagination params: page, limit, sort, order
- Filter params: per-field filtering
- Search params: global search across filterable fields
- Response format: `{ data, total, page, limit, success, message }`

---

## Build Order (Recommended Phases)

### Phase 1: Foundation
1. Project scaffolding, database setup, auth system
2. Login page, JWT auth, session management
3. Sidebar navigation (expand/collapse)
4. Top header bar (search, create, export, fullscreen, notifications, user profile)
5. Standard data table component with all behaviors (search, pagination, footer, export)
6. Standard forms (Create, Read, Edit) as reusable components

### Phase 2: System & Master Modules
7. Module Master
8. Master Data Management (MDM) / Global Master
9. Business Line CRUD
10. Region CRUD (linked to BL)
11. Country CRUD
12. Branch CRUD (linked to BL > Region > Country)
13. Department CRUD (linked to BL)

### Phase 3: Access Control
14. Role & Permissions (3-part: Role + Module Access + Field Access)
15. User Management (with cascading dropdowns)
16. RBAC middleware and permission checks

### Phase 4: Core CRM
17. Contact module
18. Leads module (with type categorization)
19. Account module (with segment categorization)
20. Activity modules (Meeting, MOM, Calls, Email, Chat)

### Phase 5: Add-On Modules
21. Tender
22. Query vs Conversion (Enquiry)
23. Geo Fencing, Time Zone

### Phase 6: Polish
24. Global Dashboard with metrics
25. Notification system
26. Activity Logs / Audit Trail view
27. User Profile page
28. CRM Home page

---

## File/Folder Structure (Suggested)

```
src/
  app/                    # Next.js app router pages
    (auth)/
      login/
    (dashboard)/
      layout.tsx          # Sidebar + Header layout
      dashboard/
      modules/
      mdm/
      users/
      roles/
      business-lines/
      regions/
      countries/
      branches/
      departments/
      contacts/
      leads/
      accounts/
      activities/
        meetings/
        mom/
        calls/
        email/
        chat/
      tenders/
      enquiries/
      profile/
  components/
    layout/
      Sidebar.tsx
      Header.tsx
      Footer.tsx
    table/
      DataTable.tsx        # Standard table with all behaviors
      Pagination.tsx
      SearchBar.tsx
      RowsPerPage.tsx
      RecordDetailsBar.tsx
      ExportButton.tsx
      ColumnToggle.tsx
    forms/
      CreateForm.tsx
      ReadForm.tsx
      EditForm.tsx
      FormField.tsx
    ui/                    # Shadcn/UI components
    notifications/
      NotificationBell.tsx
      NotificationPanel.tsx
    auth/
      UserProfileDropdown.tsx
  lib/
    auth.ts
    db.ts
    permissions.ts
    utils.ts
  types/
    index.ts               # All TypeScript interfaces
  hooks/
    useAuth.ts
    usePermissions.ts
    useTable.ts
    useFilters.ts
  api/                     # API route handlers
    auth/
    modules/
    users/
    roles/
    ...per module
  prisma/
    schema.prisma
    seed.ts
```

---

## Summary

This CRM is a **multi-tenant, role-based, modular travel industry CRM** with:
- **22+ modules** across 6 categories
- **3-tier RBAC** (Super Admin > Admin > Standard) with module-level AND field-level permissions
- **13 standard UI behaviors** consistently applied across all modules
- **Cascading organizational hierarchy** (Business Line > Region > Country > Branch)
- **Comprehensive date filtering** system
- **Full audit trail** on every entity
- **Reusable component architecture** (table, forms, navigation)

All standard behaviors (search, pagination, export, forms, navigation, notifications, user profile) are thoroughly specified in the supporting documentation and must be implemented consistently across every module.

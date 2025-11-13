# Admin/Moderator System Implementation Documentation

## Overview
This document details all changes made to implement a tiered admin/moderator system for content moderation in the FINLOG application. The system uses database-driven role management with server-side authentication and authorization.

---

## Table of Contents
1. [Database Schema Changes](#database-schema-changes)
2. [Backend Changes](#backend-changes)
3. [Frontend Changes](#frontend-changes)
4. [API Endpoints](#api-endpoints)
5. [Permission System](#permission-system)
6. [Migration Guide](#migration-guide)
7. [Testing Checklist](#testing-checklist)

---

## Database Schema Changes

### File: `src/init_data/01_create.sql`

#### 1. Moderators Table - Added `admin_power` Column
**Change:** Added `admin_power` column to distinguish between moderators and admins.

```sql
-- BEFORE
CREATE TABLE IF NOT EXISTS moderators (
    moderator_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    assigned_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- AFTER
CREATE TABLE IF NOT EXISTS moderators (
    moderator_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    admin_power VARCHAR(50) NOT NULL DEFAULT 'moderator' CHECK (admin_power IN ('moderator', 'admin')),
    assigned_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);
```

**Purpose:**
- `admin_power` can be either `'moderator'` or `'admin'`
- Default value is `'moderator'` for backward compatibility
- CHECK constraint ensures only valid values are allowed

#### 2. Posts Table - Added `status` Column
**Change:** Added `status` column to track moderation state of posts.

```sql
-- BEFORE
CREATE TABLE IF NOT EXISTS posts (
    post_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    caption TEXT,
    date_created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- AFTER
CREATE TABLE IF NOT EXISTS posts (
    post_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    caption TEXT,
    date_created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'flagged', 'deleted')),
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);
```

**Purpose:**
- Tracks moderation status: `'pending'`, `'approved'`, `'flagged'`, or `'deleted'`
- Default value is `'pending'` for new posts
- CHECK constraint ensures only valid status values

---

## Backend Changes

### File: `src/index.js`

#### 1. Login Endpoint Enhancement
**Location:** `app.post('/login', ...)`

**Changes:**
- Added role checking by querying `moderators` table
- Stores role in session: `req.session.role`
- Returns role in login response: `{ user: { ..., role: 'user'|'moderator'|'admin' } }`

**Code Added:**
```javascript
// Check if user is moderator or admin
const moderatorQuery = `SELECT * FROM moderators WHERE user_id = $1`;
const moderator = await db.oneOrNone(moderatorQuery, [user.user_id]);

let role = 'user'; // Default role
if (moderator) {
  role = moderator.admin_power; // 'moderator' or 'admin'
}

req.session.user = user;
req.session.role = role; // Store role in session
```

**Impact:**
- Backward compatible: Regular users still get `role: 'user'`
- New functionality: Admins/moderators get their role returned

#### 2. Auth Check Endpoint Enhancement
**Location:** `app.get('/api/auth/check', ...)`

**Changes:**
- Made endpoint `async` to support database queries
- Checks role if not already in session (for backward compatibility)
- Returns role in response: `{ user: { ..., role: '...' } }`

**Code Added:**
```javascript
// Check role if not already in session (for backward compatibility)
let role = req.session.role;
if (!role) {
  const moderator = await db.oneOrNone(
    'SELECT * FROM moderators WHERE user_id = $1',
    [req.session.user.user_id]
  );
  role = moderator ? moderator.admin_power : 'user';
  req.session.role = role;
}
```

**Impact:**
- Existing sessions without role will get role on next check
- Frontend can now access `result.user.role`

#### 3. Admin Middleware Functions
**Location:** After logout endpoint, before user posts endpoint

**New Functions:**

##### `requireModerator` Middleware
- **Purpose:** Allows both moderators and admins to access routes
- **Checks:**
  1. User is authenticated
  2. User is in `moderators` table (role is 'moderator' or 'admin')
- **Returns:** 401 if not authenticated, 403 if not moderator/admin
- **Usage:** `app.get('/api/admin/posts', requireModerator, ...)`

##### `requireAdmin` Middleware
- **Purpose:** Allows only admins to access routes
- **Checks:**
  1. User is authenticated
  2. User has `admin_power = 'admin'` in `moderators` table
- **Returns:** 401 if not authenticated, 403 if not admin
- **Usage:** `app.delete('/api/admin/posts/:id', requireAdmin, ...)`

#### 4. Admin API Routes
**Location:** After middleware functions

##### GET `/api/admin/posts`
- **Purpose:** Fetch all posts for moderation
- **Access:** Moderators + Admins (`requireModerator`)
- **Response:** Array of posts with status, username, image paths
- **Returns:**
  ```json
  {
    "status": "success",
    "data": [
      {
        "post_id": 1,
        "caption": "...",
        "date_created": "...",
        "status": "pending",
        "username": "...",
        "user_id": 1,
        "image_path": "/user_images/1.jpg"
      }
    ]
  }
  ```

##### PUT `/api/admin/posts/:id/status`
- **Purpose:** Update post status (approve, flag, or set to pending)
- **Access:** Moderators + Admins (`requireModerator`)
- **Request Body:** `{ "status": "approved" | "flagged" | "pending" }`
- **Response:** Updated post object

##### DELETE `/api/admin/posts/:id`
- **Purpose:** Permanently delete a post
- **Access:** Admins only (`requireAdmin`)
- **Response:** Deleted post object

---

## Frontend Changes

### File: `ProjectSourceCode/login.html`

#### Login Form Handler Update
**Location:** `document.getElementById('loginForm').addEventListener('submit', ...)`

**Changes:**
- Added role-based redirect logic
- Checks `result.user.role` from login response
- Redirects admins/moderators to `admin-dashboard.html`
- Redirects regular users to `dashboard.html`

**Code Added:**
```javascript
if (response.ok && result.user) {
  // Redirect based on role
  const role = result.user.role || 'user';
  
  if (role === 'admin' || role === 'moderator') {
    window.location.href = 'admin-dashboard.html';
  } else {
    window.location.href = 'dashboard.html';
  }
}
```

**Impact:**
- Backward compatible: Falls back to `'user'` if role is missing
- New functionality: Automatic role-based routing

### File: `ProjectSourceCode/admin-dashboard.html`

#### Complete Rewrite of JavaScript Section
**Location:** Entire `<script>` section

**Major Changes:**

1. **Removed Client-Side Authentication**
   - **Before:** Used `sessionStorage.getItem('username')` and `sessionStorage.getItem('userRole')`
   - **After:** Uses server-side authentication via `/api/auth/check`

2. **Added Server-Side Auth Check**
   - New function: `checkAdminAccess()`
   - Fetches user info from `/api/auth/check`
   - Validates role is 'admin' or 'moderator'
   - Redirects to login if not authenticated
   - Redirects to dashboard if not admin/moderator

3. **Replaced Mock Data with Real API Calls**
   - **Before:** `initializeDemoData()` with hardcoded posts
   - **After:** `loadPosts()` fetches from `/api/admin/posts`

4. **Updated Post Rendering**
   - Uses real post data from API
   - Displays actual post images from `image_path`
   - Shows real captions and dates
   - Uses `post_id` instead of hardcoded `id`

5. **Implemented Real Moderation Actions**
   - **Before:** Client-side status updates (not persisted)
   - **After:** API calls to update/delete posts
   - `approvePost()` → `PUT /api/admin/posts/:id/status` with `{status: 'approved'}`
   - `flagPost()` → `PUT /api/admin/posts/:id/status` with `{status: 'flagged'}`
   - `deletePost()` → `DELETE /api/admin/posts/:id` (admin only)

6. **Role-Based UI**
   - Delete button only shows for admins
   - Moderators see approve/flag buttons only

7. **Updated Logout Link**
   - **Before:** `onclick="sessionStorage.clear()"` with `href="login.html"`
   - **After:** `href="/logout"` (uses server-side logout)

**New Functions:**
- `checkAdminAccess()` - Server-side auth validation
- `loadPosts()` - Fetch posts from API
- `updatePostStatus(postId, status)` - Update post status via API
- `deletePost(postId)` - Delete post via API (admin only)

---

## API Endpoints

### New Admin Endpoints

| Method | Endpoint | Access | Purpose |
|--------|----------|--------|---------|
| GET | `/api/admin/posts` | Moderator + Admin | Get all posts for moderation |
| PUT | `/api/admin/posts/:id/status` | Moderator + Admin | Update post status |
| DELETE | `/api/admin/posts/:id` | Admin only | Delete post permanently |

### Modified Endpoints

| Method | Endpoint | Change |
|--------|----------|--------|
| POST | `/login` | Now returns `role` in response |
| GET | `/api/auth/check` | Now returns `role` in user object |

---

## Permission System

### Role Hierarchy

1. **User** (default)
   - Can create posts
   - Can view own posts
   - Cannot access admin dashboard
   - Cannot moderate content

2. **Moderator**
   - All user permissions, plus:
   - Can access admin dashboard
   - Can view all posts
   - Can approve posts
   - Can flag posts
   - Cannot delete posts

3. **Admin**
   - All moderator permissions, plus:
   - Can delete posts permanently
   - Full system access

### Permission Matrix

| Action | User | Moderator | Admin |
|--------|------|-----------|-------|
| View own posts | Yes | Yes | Yes |
| Create posts | Yes | Yes | Yes |
| View all posts | No | Yes | Yes |
| Approve posts | No | Yes | Yes |
| Flag posts | No | Yes | Yes |
| Delete posts | No | No | Yes |
| Access admin dashboard | No | Yes | Yes |

---

## Migration Guide

### For Existing Databases

If you have an existing database with data, you'll need to run migration SQL:

```sql
-- 1. Add admin_power column to moderators table
ALTER TABLE moderators 
ADD COLUMN admin_power VARCHAR(50);

-- 2. Set default for existing rows
UPDATE moderators 
SET admin_power = 'moderator' 
WHERE admin_power IS NULL;

-- 3. Add constraints
ALTER TABLE moderators 
ALTER COLUMN admin_power SET NOT NULL,
ALTER COLUMN admin_power SET DEFAULT 'moderator';

ALTER TABLE moderators 
ADD CONSTRAINT check_admin_power 
CHECK (admin_power IN ('moderator', 'admin'));

-- 4. Add status column to posts table
ALTER TABLE posts 
ADD COLUMN status VARCHAR(50) DEFAULT 'pending';

-- 5. Set default for existing posts (approve them)
UPDATE posts 
SET status = 'approved' 
WHERE status IS NULL;

-- 6. Add constraint
ALTER TABLE posts 
ADD CONSTRAINT check_status 
CHECK (status IN ('pending', 'approved', 'flagged', 'deleted'));
```

### Creating Admin Users

#### Hardcode in SQL File (Recommended)

The easiest way to create admin/moderator users is to hardcode them in `src/init_data/02_insert_admins.sql`:

**Step 1: Generate a bcrypt hash for the password:**
```bash
node -e "const bcrypt=require('bcryptjs');bcrypt.hash('yourpassword',10).then(h=>console.log(h))"
```

**Step 2: Edit `src/init_data/02_insert_admins.sql`**

For each admin/moderator, you need **TWO INSERT statements**:

1. **Create the user:**
```sql
INSERT INTO users (username, user_email, user_password)
VALUES ('your_username', 'your_email@example.com', '$2a$10$YOUR_BCRYPT_HASH_HERE')
ON CONFLICT (user_email) DO NOTHING;
```

2. **Add to moderators table:**
```sql
-- For admin:
INSERT INTO moderators (user_id, admin_power)
SELECT user_id, 'admin' FROM users WHERE username = 'your_username'
ON CONFLICT (user_id) DO UPDATE SET admin_power = 'admin';

-- For moderator (change 'admin' to 'moderator'):
INSERT INTO moderators (user_id, admin_power)
SELECT user_id, 'moderator' FROM users WHERE username = 'your_username'
ON CONFLICT (user_id) DO UPDATE SET admin_power = 'moderator';
```

**Step 3: Recreate the database:**
```bash
docker compose down -v && docker compose up
```

**Complete Example:**

```sql
-- Admin User: john (admin)
-- Password: mySecurePassword123
INSERT INTO users (username, user_email, user_password)
VALUES ('john', 'john@finlog.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy')
ON CONFLICT (user_email) DO NOTHING;

INSERT INTO moderators (user_id, admin_power)
SELECT user_id, 'admin' FROM users WHERE username = 'john'
ON CONFLICT (user_id) DO UPDATE SET admin_power = 'admin';
```

**What happens:**
- On database initialization (when Docker starts), users are created in the `users` table and added to the `moderators` table with their role
- If users already exist (email conflict), they're skipped
- If moderators already exist (user_id conflict), their role is updated
- You can login immediately with the username and password you specified

#### Manual SQL Insertion (Runtime)

To make a user an admin manually, insert into `moderators` table:

```sql
-- Make user_id 1 an admin
INSERT INTO moderators (user_id, admin_power) 
VALUES (1, 'admin');

-- Make user_id 2 a moderator
INSERT INTO moderators (user_id, admin_power) 
VALUES (2, 'moderator');
```

**Note:** Users must exist in `users` table first.

---

## Testing Checklist

### Database
- [ ] `moderators` table has `admin_power` column
- [ ] `posts` table has `status` column
- [ ] Can insert admin user into `moderators` table
- [ ] Can insert moderator user into `moderators` table

### Backend
- [ ] Login returns role for admin user
- [ ] Login returns role for moderator user
- [ ] Login returns 'user' for regular user
- [ ] `/api/auth/check` returns role
- [ ] `requireModerator` blocks regular users
- [ ] `requireModerator` allows moderators
- [ ] `requireModerator` allows admins
- [ ] `requireAdmin` blocks regular users
- [ ] `requireAdmin` blocks moderators
- [ ] `requireAdmin` allows admins
- [ ] GET `/api/admin/posts` works for moderators
- [ ] GET `/api/admin/posts` works for admins
- [ ] GET `/api/admin/posts` returns 403 for regular users
- [ ] PUT `/api/admin/posts/:id/status` works for moderators
- [ ] DELETE `/api/admin/posts/:id` works for admins
- [ ] DELETE `/api/admin/posts/:id` returns 403 for moderators

### Frontend
- [ ] Admin login redirects to admin dashboard
- [ ] Moderator login redirects to admin dashboard
- [ ] Regular user login redirects to user dashboard
- [ ] Admin dashboard loads posts from API
- [ ] Admin dashboard shows delete button for admins
- [ ] Admin dashboard hides delete button for moderators
- [ ] Approve button updates post status
- [ ] Flag button updates post status
- [ ] Delete button deletes post (admin only)
- [ ] Regular user cannot access admin dashboard
- [ ] Logout works correctly

---

## Backward Compatibility

### What Still Works
- Regular user registration and login
- Regular user dashboard
- All existing API endpoints (`/api/user/posts`, `/api/posts`, `/api/locations`)
- Existing frontend pages (home, finlog, map, upload)
- Existing sessions (role added on next check)

### What Changed
- Admin dashboard now requires server-side authentication
- Login response now includes `role` field (optional for frontend)
- `/api/auth/check` now includes `role` field (optional for frontend)

### Breaking Changes
- None - All changes are additive and backward compatible

---

## Security Considerations

1. **Server-Side Validation**
   - All admin actions are validated on the server
   - Client-side checks are for UX only, not security

2. **Session-Based Auth**
   - Uses `express-session` for secure session management
   - Role is stored in server session, not client-side

3. **Database-Driven Roles**
   - Roles are stored in database, not hardcoded
   - Can be managed via SQL without code changes

4. **Middleware Protection**
   - All admin routes protected by middleware
   - Unauthorized access returns 403 Forbidden

---

## Future Enhancements

Potential additions:
- User management (promote to moderator/admin)
- Ban/warn users functionality
- Moderation history/audit log
- Bulk moderation actions
- Email notifications for moderation actions

---

## Summary

This implementation adds a complete admin/moderator system with:
- Database schema for roles and post status
- Server-side authentication and authorization
- Role-based access control (user, moderator, admin)
- Admin API endpoints for moderation
- Secure admin dashboard with real data
- Backward compatible with existing functionality

All changes follow RESTful API design principles and use server-side validation for security.


# FINLOG Application Features

## 🎯 Overview

FINLOG is a fishing log application where users can record their catches, view them on a map, and share with the community. The application now includes a complete admin/moderator system for content management.

---

## 👤 User Features (All Users)

### Authentication & Registration
- **User Registration**
  - Create account with username, email, and password
  - Password hashing with bcrypt
  - Email and username uniqueness validation
  - Registration form with validation

- **User Login**
  - Secure login with session management
  - Role-based redirect (admin/moderator → admin dashboard, user → user dashboard)
  - Session persistence
  - Logout functionality

### User Dashboard
- **Personal Dashboard** (`dashboard.html`)
  - View your own fishing catches/posts
  - Display statistics (total catches, species, largest catch, days fished)
  - View posts with images
  - Profile section with user info
  - Quick actions (upload new catch, view map)

- **Post Management**
  - View all your posts
  - See post images, captions, and dates
  - Posts fetched from database via API

### Content Creation
- **Upload New Catch** (`upload.html`)
  - Upload fishing catch images
  - Add captions/details
  - Store location coordinates
  - Image stored with unique ID
  - Supports multiple image formats (jpg, jpeg, png, gif, webp)

### Discovery & Community
- **Fish Log Feed** (`finlog.html`)
  - View all community posts
  - See posts from all users
  - Browse fishing catches

- **Interactive Map** (`map_page.html`)
  - View all catch locations on map
  - Click markers to see post details
  - See username, caption, and date for each location
  - Uses Leaflet/OpenStreetMap

### Home Page
- **Home Page** (`home.html`)
  - Navigation hub
  - Links to all main features
  - Clean, accessible interface

---

## 🔐 Admin/Moderator Features (NEW)

### Role-Based Access Control
- **Three-Tier Permission System**
  - **User**: Default role, can create/view own content
  - **Moderator**: Can approve/flag posts, view all content
  - **Admin**: Full access including delete posts

### Admin Dashboard (`admin-dashboard.html`)
- **Content Moderation Queue**
  - View all posts from all users
  - See post status (pending, approved, flagged, deleted)
  - Filter by status
  - Search by username or caption
  - Real-time statistics

- **Moderation Actions**
  - **Approve Posts** (Moderator + Admin)
    - Change post status to "approved"
    - Posts become visible to community
  
  - **Flag Posts** (Moderator + Admin)
    - Mark posts for review
    - Highlight flagged content
  
  - **Delete Posts** (Admin only)
    - Permanently remove posts
    - Cannot be undone

- **Statistics Dashboard**
  - Total posts count
  - Flagged posts count
  - Pending review count
  - Approved posts count

- **Search & Filter**
  - Search posts by title/caption or username
  - Filter by status (all, pending, approved, flagged)
  - Clear filters option

### Security Features
- **Server-Side Authentication**
  - All admin actions validated on server
  - Session-based authentication
  - Middleware protection for admin routes
  - 403 Forbidden for unauthorized access

- **Database-Driven Roles**
  - Roles stored in database
  - Hardcoded admin users via SQL
  - Can be managed without code changes

---

## 🔌 API Endpoints

### Public Endpoints
- `GET /` - Redirects to home page
- `GET /welcome` - Welcome message
- `GET /home.html` - Home page
- `GET /login` - Login page
- `POST /login` - User login (returns role)
- `GET /register` - Registration page
- `POST /register` - User registration
- `GET /logout` - User logout

### User Endpoints (Authenticated)
- `GET /api/auth/check` - Check authentication status (returns role)
- `GET /api/user/posts` - Get current user's posts
- `POST /upload` - Upload new catch/image
- `GET /api/posts` - Get all posts for feed
- `GET /api/locations` - Get all catch locations for map

### Admin Endpoints (Moderator + Admin)
- `GET /api/admin/posts` - Get all posts for moderation
- `PUT /api/admin/posts/:id/status` - Update post status (approve/flag)

### Admin Endpoints (Admin Only)
- `DELETE /api/admin/posts/:id` - Delete post permanently

---

## 🗄️ Database Features

### Tables
- **users** - User accounts with authentication
- **moderators** - Admin/moderator roles with `admin_power` field
- **posts** - Fishing catches with `status` field for moderation
- **comments** - Post comments
- **likes** - Post likes/favorites
- **location** - Geographic coordinates for catches

### Post Status System
- `pending` - New posts awaiting review
- `approved` - Posts approved by moderators
- `flagged` - Posts flagged for review
- `deleted` - Posts deleted by admins

---

## 🛠️ Helper Tools

### Password Hash Generation
- **Generate bcrypt hashes for hardcoded users**
  - Use: `node -e "const bcrypt=require('bcryptjs');bcrypt.hash('password',10).then(h=>console.log(h))"`
  - Copy the hash output and paste into `src/init_data/02_insert_admins.sql`

### Hardcoded Admins
- **SQL File** (`src/init_data/02_insert_admins.sql`)
  - Hardcoded admin users
  - Created automatically on database init
  - Easy to add more admins

---

## 🎨 Frontend Features

### Pages
1. **home.html** - Landing page with navigation
2. **login.html** - Login/Registration with tabs
3. **dashboard.html** - User's personal dashboard
4. **finlog.html** - Community feed
5. **upload.html** - Upload new catch
6. **map_page.html** - Interactive map view
7. **admin-dashboard.html** - Admin moderation dashboard

### UI/UX
- Bootstrap 5 styling
- Responsive design
- Clean, modern interface
- Role-based UI (different buttons for admins vs moderators)
- Real-time updates after moderation actions
- Error handling and user feedback

---

## 🔒 Security Features

- Password hashing with bcrypt
- Session-based authentication
- Server-side role validation
- Protected admin routes with middleware
- SQL injection protection (parameterized queries)
- Input validation
- Secure file upload handling

---

## 📊 Permission Matrix

| Feature | User | Moderator | Admin |
|---------|------|-----------|-------|
| Register/Login | ✅ | ✅ | ✅ |
| Create Posts | ✅ | ✅ | ✅ |
| View Own Posts | ✅ | ✅ | ✅ |
| View All Posts | ❌ | ✅ | ✅ |
| Upload Images | ✅ | ✅ | ✅ |
| View Map | ✅ | ✅ | ✅ |
| Access Admin Dashboard | ❌ | ✅ | ✅ |
| Approve Posts | ❌ | ✅ | ✅ |
| Flag Posts | ❌ | ✅ | ✅ |
| Delete Posts | ❌ | ❌ | ✅ |
| View Statistics | ❌ | ✅ | ✅ |

---

## 🚀 How to Use

### For Regular Users
1. Register an account
2. Login
3. Upload fishing catches
4. View your dashboard
5. Browse community feed
6. View map of all catches

### For Admins/Moderators
1. Login with admin credentials
2. Automatically redirected to admin dashboard
3. View all posts in moderation queue
4. Approve, flag, or delete posts
5. Search and filter posts
6. View moderation statistics

### Creating Admin Users
```bash
# Hardcode in SQL file
# Edit src/init_data/02_insert_admins.sql
# Then: docker compose down -v && docker compose up
```

---

## 📝 Current Implementation Status

### Fully Implemented
- User registration and authentication
- Role-based login redirect
- User dashboard with posts
- Image upload and storage
- Community feed
- Interactive map
- Admin dashboard
- Post moderation (approve/flag/delete)
- Search and filtering
- Statistics dashboard
- Hardcoded admin users
- Helper scripts

### 🔄 Future Enhancements (Not Yet Implemented)
- User management (promote users to admin)
- Ban/warn users
- Moderation history/audit log
- Bulk moderation actions
- Email notifications
- Comments system (tables exist, UI not implemented)
- Likes/favorites system (tables exist, UI not implemented)
- User profile editing
- Post editing by owners

---

## 🎯 Summary

**Total Features:**
- 7 frontend pages
- 12+ API endpoints
- 6 database tables
- 3-tier permission system
- Complete admin moderation system
- Helper tools for admin management

**Key Highlights:**
- Full CRUD operations for posts
- Role-based access control
- Content moderation system
- Interactive map
- Secure authentication
- Image upload and storage
- Real-time statistics




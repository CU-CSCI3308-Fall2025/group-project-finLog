-- ============================================================
-- Hardcoded Admin/Moderator Users
-- ============================================================
-- This file creates initial admin and moderator users.
-- These users are hardcoded and will be created on database initialization.
--
-- TO ADD ADMINS/MODERATORS:
-- 1. Generate bcrypt hash for password:
--    node -e "const bcrypt=require('bcryptjs');bcrypt.hash('yourpassword',10).then(h=>console.log(h))"
-- 2. Recreate database: docker compose down -v && docker compose up
-- ============================================================

-- Admin User 1: adhar (admin)
-- Password: Denver70
INSERT INTO users (username, user_email, user_password)
VALUES ('adhar', 'Aditya.Dhar@colorado.edu', '$2a$10$2S27EPslwmiAUfh/lOfk4OrotRG3m6oNmi8fa2.zUgNtB4cfBpZI2')
ON CONFLICT (user_email) DO NOTHING;

INSERT INTO moderators (user_id, admin_power)
SELECT user_id, 'admin' FROM users WHERE username = 'adhar'
ON CONFLICT (user_id) DO UPDATE SET admin_power = 'admin';

-- Moderator User: ken01 (moderator)
-- Password: 
INSERT INTO users (username, user_email, user_password)
VALUES ('ken01', 'kenherrmann01@gmail.com', '$2b$12$kD3Umff5XyOsaJeMe0poMe6XwKP.RP3nh6GdlFMG2wtagn4QPwVS6')
ON CONFLICT (user_email) DO NOTHING;

INSERT INTO moderators (user_id, admin_power)
SELECT user_id, 'moderator' FROM users WHERE username = 'ken01'
ON CONFLICT (user_id) DO UPDATE SET admin_power = 'moderator';


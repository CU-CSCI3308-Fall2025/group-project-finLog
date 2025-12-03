# FinLog
Brief description: FinLog is a web-based fishing log that lets users record and analyze their catches—tracking species, weight, length, and location—with an optional AI feature that identifies fish from photos and provides facts or habitat details.

Contributors: Aditya Dhar, Claire Ricca, Fred Zorgdrager, Juan Pleitiz, Michelle Lisowski 

Technology Stack: 
Database
Primary datastore is PostgreSQL (v14) with pg-promise as the Node.js client. Schema includes tables for users, moderators, posts, comments, likes, and a location table storing geographic coordinates for catches.

AI & external services
Image identification and species/habitat information are provided by Google Generative AI (Gemini 1.5 Flash) via the Google Cloud client; the service handles multimodal image analysis and text generation for fish ID and metadata enrichment.

Application & architecture
Server-side is Node.js with an MVC-inspired structure: Handlebars for views, Express route handlers for controllers, and PostgreSQL-backed models accessed via pg-promise. Session-based auth and bcrypt password hashing manage user authentication and credentials.

File storage
During development images are stored on the local filesystem under user_images/. For production, plan to migrate to an object store (S3 or S3-compatible) with signed URLs and a CDN for performance and reliability.

DevOps & deployment
Local development and integration are containerized with Docker, orchestrated with Docker Compose (separate containers for the Node app and PostgreSQL). Use nodemon and npm-run-all for developer workflow and task automation.

Testing
Automated tests run with Mocha and Chai; chai-http is used for HTTP/integration tests against the running API.

Environment & configuration
Environment variables live in a .env file for local dev (DB credentials, API keys, session secrets, ports). In production, secrets should be moved to a secrets manager and not checked into source control.

Security & operational notes
Passwords are hashed with bcrypt. Use pg-promise parameterized queries to prevent SQL injection. Replace in-memory sessions with a persistent store (e.g., Redis) for scale, add upload scanning and size limits, enforce HTTPS/CORS, and rotate API keys/secrets regularly. Add DB migrations and backups for safe schema changes.

Ports
App listens on port 3000; internal DB port 5432 for the PostgreSQL container.


Prerequisites to run the application: Node, Docker, PostgresSQL

Instructions on how to run the application locally.
Connect to the database using PostgresSQL
Compose up using docker
open localhost3000 in your browser! 

How to run the tests
The tests run automatically when you compose the docker file! 

Link to the deployed application
https://finlog-7lhk.onrender.com/
// *****************************************************
// <!-- Section 1 : Import Dependencies -->
// *****************************************************

const express = require("express");
const bodyParser = require("body-parser");
const pgp = require('pg-promise')();
const session = require('express-session');
const bcrypt = require('bcryptjs');

// *****************************************************
// <!-- Section 2 : Initialization -->
// *****************************************************

// defining the Express app
const app = express();
// using bodyParser to parse JSON in the request body into JS objects
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Database connection details
const dbConfig = {
  host: 'db',
  port: 5432,
  database: process.env.POSTGRES_DB,
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
};

// Connect to database using the above details
const db = pgp(dbConfig);

// Test database connection
db.connect()
  .then(obj => {
    console.log('Database connection successful');
    obj.done(); // success, release the connection;
  })
  .catch(error => {
    console.log('ERROR:', error.message || error);
  });

// Session configuration
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'super_secret_key',
    saveUninitialized: false,
    resave: false,
  })
);

// Serve static files from ProjectSourceCode directory
app.use(express.static('ProjectSourceCode'));

// *****************************************************
// <!-- Section 3 : API Routes -->
// *****************************************************

app.get("/welcome", (req, res) => {
  res.json({ status: "success", message: "Welcome!" });
});

app.get('/register', (req, res) => {
  res.render('pages/register');
});

app.post('/register', async (req, res) => {
  const hash = await bcrypt.hash(req.body.password, 10);

  const query = `
    INSERT INTO users (username, user_email, user_password)
    VALUES ($1, $2, $3)
    RETURNING *;
  `;

  const values = [req.body.username, req.body.email, hash];

  db.query(query, values)
    .then(() => {
      res.redirect('/login');
    })
    .catch((error) => {
      res.redirect('/register');
    });
});

app.get('/login', (req, res) => {
  res.render('pages/login');
});

app.post('/login', async (req, res) => {
  const query = `SELECT * FROM users WHERE username = $1`;

  db.one(query, [req.body.username])
    .then(async (user) => {
      const match = await bcrypt.compare(req.body.password, user.user_password);

      if (match) {
        req.session.user = user;
        req.session.save();
        res.redirect('/discover');
      } else {
        res.render('pages/login', {
          message: 'Incorrect username or password.',
          error: true,
        });
      }
    })
    .catch((error) => {
      res.redirect('/register');
    });
});

// *****************************************************
// <!-- Section 4 : Start Server -->
// *****************************************************

module.exports = app.listen(3000, () => {
  console.log('Server is listening on port 3000');
});
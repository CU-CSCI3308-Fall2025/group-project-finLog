const express = require("express");
const bodyParser = require("body-parser");

const app = express();
app.use(bodyParser.json());

app.get("/welcome", (req, res) => {
  res.json({ status: "success", message: "Welcome!" });
});

app.get('/register', (req, res) => {
  res.render('pages/register');
});

app.post('/register', async (req, res) => {
  const hash = await bcrypt.hash(req.body.password, 10);

  const query = `
    INSERT INTO users (username, password)
    VALUES ($1, $2)
    RETURNING *;
  `;

  const values = [req.body.username, hash];

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
      const match = await bcrypt.compare(req.body.password, user.password);

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


module.exports = app.listen(3000)
const express = require("express");
const bodyParser = require("body-parser");

const app = express();
app.use(bodyParser.json());

app.get("/welcome", (req, res) => {
  res.json({ status: "success", message: "Welcome!" });
});

module.exports = app.listen(3000)
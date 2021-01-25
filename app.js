//jshint esversion: 6

const express = require("express");
const https = require("https");
const bodyParser = require("body-parser");
const request = require("request");

const app = express();

app.use(express.static("public"));

app.use(bodyParser.urlencoded({
  extended: true
}));

app.get("/", function(req, res) {
  res.sendFile(__dirname + "/login.html");
});

app.post("/", function(req, res) {
  if (req.body.button === "login") {
    res.sendFile(__dirname + "/failure.html");
  } else  {
    res.sendFile(__dirname + "/create.html");
  }
});

app.post("/failure", function(req, res) {
  res.redirect("/");
});

app.post("/create", function(req, res) {
  res.sendFile(__dirname + "/failure.html");
});

app.listen(process.env.PORT || 3000, function() {
  console.log("Server is running on port 3000.");
});

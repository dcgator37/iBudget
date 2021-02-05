//jshint esversion: 8
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const date = require(__dirname + "/date.js");

const app = express();

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(session({
  secret: process.env.SESSION,
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

 // if (process.env.NODE_ENV === "dev") {
 // mongoose.connect("mongodb://localhost:27017/userDB", {useNewUrlParser: true, useUnifiedTopology: true});
 // } else {
mongoose.connect("mongodb+srv://admin-brent:" + process.env.MONGODB + "@cluster0.1mr2f.mongodb.net/iBudget", {useNewUrlParser: true, useUnifiedTopology: true});
 // }
mongoose.set("useCreateIndex", true);

const userSchema = new mongoose.Schema ({
  username: String,
  password: String,
  verified: Boolean
});

const budgetSchema = new mongoose.Schema ({
  user: String,
  month: String,
  monthNum: Number,
  year: Number,
  category: [
    {
      name: String,
      items: [
        {
          name: String,
          planned: Number
        }
      ]
    }
  ],
  transaction: [
    {
      type: String,
      amt: Number,
      date: Date,
      merchant: String,
      notes: String,
      budgetItem: String
    }
  ]
});

userSchema.plugin(passportLocalMongoose);

const User = new mongoose.model("User", userSchema);
const Budget = new mongoose.model("Budget", budgetSchema);

const defaultBudget = new Budget({
  category: [
    {
      name: "Income",
      items: [
        {
          name: "Paycheck 1",
          planned: 0
        },
        {
          name: "Paycheck 2",
          planned: 0
        }
      ]
    },
    {
      name: "Giving",
      items: [
        {
          name: "Church",
          planned: 0
        },
        {
          name: "Charity",
          planned: 0
        }
      ]
    },
    {
      name: "Savings",
      items: [
        {
          name: "Emergency Fund",
          planned: 0
        }
      ]
    },
    {
      name: "Housing",
      items: [
        {
          name: "Mortgage/Rent",
          planned: 0
        },
        {
          name: "Electricity",
          planned: 0
        },
        {
          name: "Cable and Internet",
          planned: 0
        }
      ]
    },
    {
      name: "Transportation",
      items: [
        {
          name: "Gas",
          planned: 0
        },
        {
          name: "Uber/Bus",
          planned: 0
        }
      ]
    },
    {
      name: "Food",
      items: [
        {
          name: "Groceries",
          planned: 0
        },
        {
          name: "Restaurants",
          planned: 0
        }
      ]
    },
    {
      name: "Personal",
      items: [
        {
          name: "Cellphone",
          planned: 0
        },
        {
          name: "Subscriptions",
          planned: 0
        }
      ]
    },
    {
      name: "Lifestyle",
      items: [
        {
          name: "Entertainment",
          planned: 0
        },
        {
          name: "Misc",
          planned: 0
        }
      ]
    },
    {
      name: "Health",
      items: [
        {
          name: "Gym",
          planned: 0
        },
        {
          name: "Medicine",
          planned: 0
        },
        {
          name: "Doctor",
          planned: 0
        }
      ]
    },
    {
      name: "Insurance",
      items: [
        {
          name: "Auto",
          planned: 0
        },
        {
          name: "Homeowner/Renter",
          planned: 0
        }
      ]
    },
    {
      name: "Debt",
      items: [
        {
          name: "Car",
          planned: 0
        },
        {
          name: "Student Loans",
          planned: 0
        },
        {
          name: "Medical Bill",
          planned: 0
        },
        {
          name: "Personal Loan",
          planned: 0
        }
      ]
    },
  ],

});

//let activeBudget = new Budget({});
let activeBudget;
let monthArr;

passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

//deletes unverified users once a day 24 is hours
setInterval(deleteNotVerified, 1000 * 60 * 60 * 24);


app.get("/", function(req, res) {
  res.render("login");
});

app.post("/", function(req, res) {
  if (req.body.button === "login") {

    const user = new User({
      username: req.body.username,
      password: req.body.password,
    });

    req.login(user, function(err) {
      if(err) {
        console.log(err);
      } else {

        passport.authenticate('local')(req, res, function() {
          res.redirect("/budget2");
        });
      }
    });
  } else  {
    res.redirect("/create");
  }
});

app.get("/deleteAccount", function(req, res) {

  User.deleteOne({username: req.user.username}, function(err) {
    if (err) {
      console.log(err);
    } else {
      req.logout();
      res.redirect("/");
    }
  });
});

app.post("/logout", function(req, res) {
  if (req.body.button === "deleteAccount") {
    res.redirect("/deleteAccount");
  } else {
  req.logout();
  res.redirect("/");
}
});

app.post("/failure", function(req, res) {
  res.redirect("/");
});

app.get("/budget", function(req, res) {
  if (req.isAuthenticated()) {

    res.render("budget", {username: req.user.username});
  } else {
    res.redirect("/");
  }
});

app.get("/budget2", function(req, res) {
  if (req.isAuthenticated()) {

    if (!activeBudget){
      console.log("no active budget");

      Budget.findOne({user: req.user.username, month: date.getMonth()}, function (err, budget) {
        if (err) {

        } else if(!budget) {
          console.log("no budget in db for this month. generating default budget");
          // next idea is to display website that asks user if they want to load from the past month
          defaultBudget.user = req.user.username;
          defaultBudget.month = date.getMonth();
          defaultBudget.year = date.getYear();
          defaultBudget.monthNum = date.getMonthNum();


          console.log(date.getMonthNum());
          console.log(date.getYear());
          //date.getMonth();
          defaultBudget.save();

          activeBudget = defaultBudget;

          Budget.find({user: activeBudget.user}, "month _id monthNum year", function (err, months) {
            monthArr = months;
            console.log(monthArr);
            res.render("budget2", {budget: activeBudget, months: monthArr});
          });

          //res.render("budget2", {budget: defaultBudget});

        } else {
          console.log("Budget found in db for this month. loading budget");
          activeBudget = budget;

          Budget.find({user: activeBudget.user}, "month _id monthNum year", function (err, months) {
            monthArr = months;

            res.render("budget2", {budget: activeBudget, months: monthArr});
          });



          //res.render("budget2", {budget: budget, months: monthArr});
        }
      });
    } else {
      console.log(monthArr);
      res.render("budget2", {budget: activeBudget, months: monthArr});
    }
  } else {
    res.redirect("/");
  }
});

app.get("/create", function(req, res) {
  res.render("create");
});

app.post("/create", function(req, res) {

  User.register({username: req.body.username}, req.body.password, function(err, user){
    if (err) {
      console.log(err);
      res.redirect("/create");
    } else {
      passport.authenticate('local')(req, res, function(){
        emailAuth(req.body.username);
        User.updateOne({username: req.body.username}, {verified: false}, function(err, user) {
          if (err) {
            console.log(err);
          } else {
          }
        });
        res.render("verify");
      });
    }
  });
});

app.get("/verify", function(req, res) {
  const token = req.query.id;
  if (token) {
    try {
      jwt.verify(token, process.env.SECRET, (e, decoded) => {
        if (e) {
          console.log(e);
          return res.sendStatus(403);
        } else {
          id = decoded.id;

          User.updateOne({username: id}, {verified: true}, function(err) {
            if (err) {
              console.log(err);
            } else {
            }
          });

          res.redirect("/budget");
        }
      });
    } catch (err) {
      console.log(err);
      return res.sendStatus(403);
    }
  } else {
    return res.sendStatus(403);
  }
});

app.post("/addItem", function(req, res) {

  const index = req.body.button;
  activeBudget.category[index].items.push({});
  activeBudget.save();
  res.redirect("/budget2");
});

app.post("/editItem" , function(req, res) {
  const index = req.body.index;
  const itemIndex = req.body.itemIndex;
  const name = req.body.itemName;
  const itemAmt = req.body.planned;

  activeBudget.category[index].items[itemIndex].name = name;
  activeBudget.category[index].items[itemIndex].planned = itemAmt;
  activeBudget.save();

  res.redirect("/budget2");
  // + "#" + activeBudget.category[index].items[itemIndex-1]._id
});

app.post("/deleteItem", function(req, res) {
  const index = req.body.button;
  const itemIndex = req.body.itemIndex;

   // console.log(index);
   // console.log(itemIndex);
  // console.log(req.body);

  activeBudget.category[index].items[itemIndex].remove();
  activeBudget.save();

  res.redirect("/budget2");
});

app.post("/addCat", function(req, res) {

  activeBudget.category.push({});
  activeBudget.save();
  res.redirect("/budget2");
});

app.post("/editCat" , function(req, res) {
  const index = req.body.index;
  const name = req.body.catName;
  console.log(name);
  console.log(index);
  activeBudget.category[index].name = name;
  activeBudget.save();
  res.redirect("/budget2");
});

app.listen(process.env.PORT || 3000, function() {
  console.log("Server is running on port 3000.");
});

function emailAuth(email) {
  const date = new Date();
  const mail = {
    "id": email,
    "created": date.toString()
  };

  const token_mail_verification = jwt.sign(mail, process.env.SECRET, {expiresIn: '1d'});
  let host = "";

  // if (process.env.NODE_ENV === "dev") {
  //   host = "http://localhost:3000/";
  // } else {
    host = process.env.DATABASE_URL;
  //}
  const url = host + "verify?id=" + token_mail_verification;

  var transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
      user: "ibudgetauth",
      pass: process.env.GMAIL
    }
  });

  const mailOptions = {
    from: "ibudgetauth@gmail.com",
    to: email,
    subject: "Please confirm your Email account to complete registration at iBudget",
    html: "Hello,<br> Please click on the link to verify your email.<br><a href=" + url + ">Click here to verify</a>"
  };

  transporter.sendMail(mailOptions, function(err, res) {
    if (err) {
      console.log(err);
      res.end("error");
    } else {
      console.log("Message sent: " + res.message);
      res.end("sent");
    }
  });
}

function deleteNotVerified() {
  User.deleteMany({verified: false}, function(err) {
    if (err) {
      console.log(err);
    } else {

    }
  });
}

function budgetMonthsArray() {
  const user = activeBudget.user;
  let exportmonths = [];
  Budget.find({user: user}, "month _id", function (err, months) {


  });

  console.log(exportmonths);

  return exportmonths;

}

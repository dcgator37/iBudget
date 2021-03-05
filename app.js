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
const path = require('path');
const utils = require(__dirname + "/date.js");
const $ = require('jquery');
const datejs = require('datejs');

const app = express();

//set template engine
app.set('view engine', 'ejs');

//set bodyparser to be able to parse data from body post from client
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));

//set the path of the jquery file
app.use('/jquery', express.static(path.join(__dirname + '/node_modules/jquery/dist/')));
app.use('/charts', express.static(path.join(__dirname + '/node_modules/@mongodb-js/charts-embed-dom/dist/')));

//set static public folder
app.use(express.static(path.join(__dirname + '/public')));

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
  verified: Boolean,
  monthsArray: [{
    active: Boolean,
    month: Number,
    year: Number,
    monthString: String
  }]
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
          planned: Number,
          sumOfTransactions: Number,
          transactions: [
            {
              type: String,
              amt: Number,
              date: Date,
              merchant: String,
              notes: String,
            }
          ]
        }
      ]
    }
  ],

},
{ typeKey: '$type' });

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
          planned: 0,
          sumOfTransactions: 0
        },
        {
          name: "Paycheck 2",
          planned: 0,
          sumOfTransactions: 0
        }
      ]
    },
    {
      name: "Giving",
      items: [
        {
          name: "Church",
          planned: 0,
          sumOfTransactions: 0
        },
        {
          name: "Charity",
          planned: 0,
          sumOfTransactions: 0
        }
      ]
    },
    {
      name: "Savings",
      items: [
        {
          name: "Emergency Fund",
          planned: 0,
          sumOfTransactions: 0
        }
      ]
    },
    {
      name: "Housing",
      items: [
        {
          name: "Mortgage/Rent",
          planned: 0,
          sumOfTransactions: 0
        },
        {
          name: "Electricity",
          planned: 0,
          sumOfTransactions: 0
        },
        {
          name: "Cable and Internet",
          planned: 0,
          sumOfTransactions: 0
        }
      ]
    },
    {
      name: "Transportation",
      items: [
        {
          name: "Gas",
          planned: 0,
          sumOfTransactions: 0
        },
        {
          name: "Uber/Bus",
          planned: 0,
          sumOfTransactions: 0
        }
      ]
    },
    {
      name: "Food",
      items: [
        {
          name: "Groceries",
          planned: 0,
          sumOfTransactions: 0
        },
        {
          name: "Restaurants",
          planned: 0,
          sumOfTransactions: 0
        }
      ]
    },
    {
      name: "Personal",
      items: [
        {
          name: "Cellphone",
          planned: 0,
          sumOfTransactions: 0
        },
        {
          name: "Subscriptions",
          planned: 0,
          sumOfTransactions: 0
        }
      ]
    },
    {
      name: "Lifestyle",
      items: [
        {
          name: "Entertainment",
          planned: 0,
          sumOfTransactions: 0
        },
        {
          name: "Misc",
          planned: 0,
          sumOfTransactions: 0
        }
      ]
    },
    {
      name: "Health",
      items: [
        {
          name: "Gym",
          planned: 0,
          sumOfTransactions: 0
        },
        {
          name: "Medicine",
          planned: 0,
          sumOfTransactions: 0
        },
        {
          name: "Doctor",
          planned: 0,
          sumOfTransactions: 0
        }
      ]
    },
    {
      name: "Insurance",
      items: [
        {
          name: "Auto",
          planned: 0,
          sumOfTransactions: 0
        },
        {
          name: "Homeowner/Renter",
          planned: 0,
          sumOfTransactions: 0
        }
      ]
    },
    {
      name: "Debt",
      items: [
        {
          name: "Car",
          planned: 0,
          sumOfTransactions: 0
        },
        {
          name: "Student Loans",
          planned: 0,
          sumOfTransactions: 0
        },
        {
          name: "Medical Bill",
          planned: 0,
          sumOfTransactions: 0
        },
        {
          name: "Personal Loan",
          planned: 0,
          sumOfTransactions: 0
        }
      ]
    },
  ],

});

let activeBudget;
let monthArr;

passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

//doesn't work yet. deletes unverified users once a day 24 is hours
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
          res.redirect("/budget");
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

    if (req.user.monthsArray.length === 0) {
      console.log('no month array');
      createBudgetArray(req);
    }

    if (!activeBudget) {
      console.log("no active budget");

      let today = new Date();

      Budget.findOne({user: req.user.username, month: utils.getMonth(today)}, function (err, budget) {
        if (err) {
          alert('Mongo is down!');
        } else if(!budget) {
          console.log("no budget in db for this month. generating default budget");
          // next idea is to display website or popup that asks user if they want to load from the past month

          var newBudget = new Budget();

          newBudget.user = req.user.username;
          newBudget.month = utils.getMonth(today);
          newBudget.year = utils.getYear(today);
          newBudget.monthNum = utils.getMonthNum(today);

          newBudget.category = defaultBudget.category;

          // defaultBudget.user = req.user.username;
          // defaultBudget.month = utils.getMonth(today);
          // defaultBudget.year = utils.getYear(today);
          // defaultBudget.monthNum = utils.getMonthNum(today);

          // defaultBudget.save();

          newBudget.save();

          activeBudget = newBudget;

          //save the monthsArray for new month
          let arraySearch = req.user.monthsArray.find((month, index) => {
            if (month.monthString === newBudget.month) {
              req.user.monthsArray[index].active = true;
            }
          });

          req.user.save();

          // const url = createChart(activeBudget._id);

          res.render("budget", {budget: activeBudget, months: req.user.monthsArray});

        } else {
          console.log("Budget found in db for this month. loading budget");
          activeBudget = budget;

          // const url = createChart(activeBudget._id);

          res.render("budget", {budget: activeBudget, months: req.user.monthsArray});
        }
      });

    } else {
      console.log('refreshing screen. there is an activebudget');

      // const url = createChart(activeBudget._id);

      res.render("budget", {budget: activeBudget, months: req.user.monthsArray});
    }
  } else {

    //not authenticated. haven't logged in yet
    res.redirect("/");
  }
});

app.post('/switchmonth', (req, res) => {
  //load month
  const month = req.body.monthString;
  console.log(month);

  Budget.findOne({user: req.user.username, month: month}, (err, budget) => {

    if (err) {
      alert('Error loading month');
    } else if (!budget) {
      //load default budget

      var newBudget = new Budget();
      newBudget.user = req.user.username;
      newBudget.month = month;
      newBudget.year = parseInt(req.body.year);
      newBudget.monthNum = req.body.monthNum;

      newBudget.category = defaultBudget.category;

      // defaultBudget.user = req.user.username;
      // defaultBudget.month = month;
      // defaultBudget.year = parseInt(req.body.year);
      // defaultBudget.monthNum = req.body.monthNum;
      //
      // defaultBudget.save();

      newBudget.save();

      activeBudget = newBudget;

      //save the monthsArray for new month
      let arraySearch = req.user.monthsArray.find((month, index) => {
        if (month.monthString === newBudget.month) {
          req.user.monthsArray[index].active = true;
        }
      });

      req.user.save();
      res.redirect('/budget');

    } else {
        //laod the actual budget because it exists
        console.log('loading actual budget');
        activeBudget = budget;

        res.redirect('/budget');
    }

  });

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

  const index = req.body.index;
  activeBudget.category[index].items.push({sumOfTransactions: 0});
  activeBudget.save();
  const itemIndex = activeBudget.category[index].items.length - 1;

  res.json({msg: 'success', data: {itemIndex: itemIndex} });
});

app.post("/editItem" , function(req, res) {
  const index = req.body.index;
  const itemIndex = req.body.itemIndex;
  const name = req.body.itemName;
  const itemAmt = req.body.planned;

  activeBudget.category[index].items[itemIndex].name = name;
  activeBudget.category[index].items[itemIndex].planned = itemAmt;
  activeBudget.save();

  res.redirect("/budget");
});

app.put("/editItemAmt", (req, res) => {
  const index = req.body.index;
  const itemIndex = req.body.itemIndex;
  const amt = req.body.amt;

  activeBudget.category[index].items[itemIndex].planned = amt;
  activeBudget.save();

  //when you edit the planned amount, the remaining will change. so get the total transaction amt
  const sum = activeBudget.category[index].items[itemIndex].sumOfTransactions;

  //loop through the items in the category, summing the total planned amt. this is used to update the chart
  var newCatSum = 0;
  activeBudget.category[index].items.forEach((item, index) => {
    if (item.planned) {
    newCatSum += item.planned;
  } else {
    newCatSum += 0;
  }
  });

  res.json({msg: 'success', sum: sum, newCatSum: newCatSum });
});

app.put("/editItemName", (req, res) => {
  const index = req.body.index;
  const itemIndex = req.body.itemIndex;
  const name = req.body.name;

  activeBudget.category[index].items[itemIndex].name = name;
  activeBudget.save();

  res.json({msg: 'success'});
});

app.delete("/deleteItem", function(req, res) {
  const index = req.body.index;
  const itemIndex = req.body.itemIndex;

  activeBudget.category[index].items[itemIndex].remove();
  activeBudget.save();

  var newCatSum = 0;

  activeBudget.category[index].items.forEach((item, index) => {
    if (item.planned) {
    newCatSum += item.planned;
  } else {
    newCatSum += 0;
  }
  });

  res.json({msg: 'success', newCatSum: newCatSum });
});

app.post("/addCat", function(req, res) {

  activeBudget.category.push({});
  activeBudget.save();

  const index = activeBudget.category.length - 1;

  res.json({msg: 'success', data: {index: index}});
});

app.put("/editCat" , function(req, res) {
  const index = req.body.index;
  const name = req.body.name;

  activeBudget.category[index].name = name;
  activeBudget.save();

  res.json({msg: 'success' });
});

app.post('/addTransaction', (req, res) => {
  const index = req.body.index;
  const itemIndex = req.body.itemIndex;
  const type = req.body.type;
  const amt = parseFloat(req.body.amt);
  const date = req.body.date;
  const merchant = req.body.merchant;
  const notes = req.body.notes;

  //create transaction object
  let obj = {
    type: type,
    amt: amt,
    date: date,
    merchant: merchant,
    notes: notes
  };

  //initialize sum to 0
  var sum = 0;

  //add the transaction to the array of transactions for the item
  activeBudget.category[index].items[itemIndex].transactions.push(obj);

  //if the sumOfTransactions variable does not exist for the budget, set to zero
  //only needed for old budgets created before this. I've changed the default budget to set this to zero
  //i will delete everyone's budgets to so this will be unecessary in the future
  if (!activeBudget.category[index].items[itemIndex].sumOfTransactions) {
    activeBudget.category[index].items[itemIndex].sumOfTransactions = 0;
  }

  //increment the sum with the new transaction
  activeBudget.category[index].items[itemIndex].sumOfTransactions += amt;

  //save the budget to the database
  activeBudget.save();

  //set sum to the sum from the db
  sum = activeBudget.category[index].items[itemIndex].sumOfTransactions;

  // activeBudget.category[index].items[itemIndex].transactions.forEach((transaction) => {
  //   sum =  sum + transaction.amt;
  // });

  console.log('transaction: ' + amt);
  console.log('sum of transactions: ' + sum);

  //send the sum back to the client so it can do the math and update the remaining span and data-value attribute
  res.json({msg: 'success', sum: sum});
});

app.post('/getTransactions', (req, res) => {
  const index = req.body.index;
  const itemIndex = req.body.itemIndex;
  const categoryName = activeBudget.category[index].name;
  const itemName = activeBudget.category[index].items[itemIndex].name;
  const currentMonth = activeBudget.monthNum;
  const currentYear = activeBudget.year;
  var priorMonth = currentMonth - 1;
  var priorMonthYear = currentYear;
  var sum = 0;

  if (currentMonth == 1) {
    priorMonth = 12;
    --priorMonthYear;
  }

  const transactions = activeBudget.category[index].items[itemIndex].transactions;

  // Budget.findOne({user: req.user.username, month: month}, (err, budget) => {


  Budget.find({user: req.user.username, monthNum: priorMonth, year: priorMonthYear, 'category.name': categoryName, 'category.items.name': itemName}, (err, budget) => {
    if (err) {
      alert(err);
    } else if (budget.length) {
      console.log(budget);
      budget[0].category.find( function (el, index, array) {
        if (el.name == categoryName) {
          el.items.find( function (item, index, array) {
            if (item.name == itemName) {
              sum = item.sumOfTransactions;
            }
          });
        }
      });

      res.json({msg: 'success', transactions: transactions, sum: sum});
    } else {
      console.log('no budget found');
      res.json({msg: 'success', transactions: transactions, sum: sum});
    }
  });

  // res.json({msg: 'success', transactions: transactions, budget: budget});

});

app.get('/testData', (req, res) => {
  const labels = [];
  const data = [];
  var plannedSum;


  activeBudget.category.forEach((category, index) => {
    labels.push(category.name);

    plannedSum = 0;

    category.items.forEach((item, index) => {
      if (item.planned) {
      plannedSum += item.planned;
    } else {
      plannedSum += 0;
    }
    });

    data.push(plannedSum);
  });

  res.json({msg: 'success', labels: labels, data: data});
});

app.listen(process.env.PORT || 3000, function() {
  console.log("Server is running on port 3000.");
});

function emailAuth(email) {
  const date = new Date();
  const mail = {
    "id": email,
    "created": utils.toString()
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

function createBudgetArray(req) {

  let monthArray = [];
  var i;
  let myDate = new Date();

  console.log(myDate);

  for (i = 0; i < 24; i++) {
    monthArray.push({active: false, month: utils.getMonthNum(myDate), year: utils.getYear(myDate), monthString: utils.getMonth(myDate)});
    myDate = myDate.add(1).month();
  }

  Budget.find({user: req.user.username}, "month", (err, budgets) => {
    console.log(budgets);
    monthArray.forEach((month, index, theArray) => {
      budgets.forEach((budget) => {
        if (month.monthString === budget.month) {
          console.log('there is an active month');
          theArray[index].active = true;
        }
      });
    });

    // console.log('month array');
    // console.log(monthArray);

    req.user.monthsArray = monthArray;
    req.user.save();
  });

}

function createChart(id) {
  const src= 'https://charts.mongodb.com/charts-ibudget-zqzdh/embed/charts?id=df5582b5-8d8d-45a9-9817-80e7ed5de323&theme=light&autoRefresh=true&maxDataAge=30';

  const filterDoc = {"_id": id};
  const encodedFilter = encodeURIComponent(JSON.stringify(filterDoc));

  const url = src + '&filter={"_id":' + id + '}';
  return url;
}

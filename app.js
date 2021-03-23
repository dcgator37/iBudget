//jshint esversion: 8
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const Budget = require('./models/budget');
const PlaidItem = require('./models/plaid_item');
const PlaidAccount = require('./models/plaid_account');
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const path = require('path');
const utils = require(__dirname + "/date.js");
const $ = require('jquery');
const datejs = require('datejs');
const plaid = require('plaid');
const flash = require('connect-flash');


const PLAID_CLIENT_ID = process.env.PLAID_CLIENT_ID;
const PLAID_SECRET = process.env.PLAID_SECRET;
const PLAID_ENV = process.env.PLAID_ENV || 'sandbox';
const PLAID_PRODUCTS = (process.env.PLAID_PRODUCTS || 'transactions').split(
  ',',
);
// PLAID_COUNTRY_CODES is a comma-separated list of countries for which users
// will be able to select institutions from.
const PLAID_COUNTRY_CODES = (process.env.PLAID_COUNTRY_CODES || 'US').split(
  ',',
);
// Parameters used for the OAuth redirect Link flow.
//
// Set PLAID_REDIRECT_URI to 'http://localhost:3000'
// The OAuth redirect flow requires an endpoint on the developer's website
// that the bank website should redirect to. You will need to configure
// this redirect URI for your client ID through the Plaid developer dashboard
// at https://dashboard.plaid.com/team/api.
const PLAID_REDIRECT_URI = process.env.PLAID_REDIRECT_URI || '';

// Parameter used for OAuth in Android. This should be the package name of your app,
// e.g. com.plaid.linksample
const PLAID_ANDROID_PACKAGE_NAME = process.env.PLAID_ANDROID_PACKAGE_NAME || '';

// We store the access_token in memory - in production, store it in a secure
// persistent data store
let ACCESS_TOKEN = null;
let PUBLIC_TOKEN = null;
let ITEM_ID = null;
// The payment_id is only relevant for the UK Payment Initiation product.
// We store the payment_id in memory - in production, store it in a secure
// persistent data store
let PAYMENT_ID = null;

// Initialize the Plaid client
// Find your API keys in the Dashboard (https://dashboard.plaid.com/account/keys)
const client = new plaid.Client({
  clientID: PLAID_CLIENT_ID,
  secret: PLAID_SECRET,
  env: plaid.environments[PLAID_ENV],
  options: {
    version: '2019-05-29',
  },
});

const app = express();

//set template engine
app.set('view engine', 'ejs');

//set bodyparser to be able to parse data from body post from client
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(flash());

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
    monthString: String,
    date: Date
  }]
});

// const budgetSchema = new mongoose.Schema ({
//   user: String,
//   month: String,
//   monthNum: Number,
//   year: Number,
//   category: [
//     {
//       name: String,
//       items: [
//         {
//           name: String,
//           planned: Number,
//           sumOfTransactions: Number,
//           transactions: [
//             {
//               type: String,
//               amt: Number,
//               date: Date,
//               merchant: String,
//               notes: String,
//             }
//           ]
//         }
//       ]
//     }
//   ],
//
// },
// { typeKey: '$type' });

userSchema.plugin(passportLocalMongoose);

const User = new mongoose.model("User", userSchema);
// const Budget = new mongoose.model("Budget", budgetSchema);

const defaultBudget = new Budget(Budget.defaultBudget);
// const defaultBudget = new Budget({
//   category: [
//     {
//       name: "Income",
//       items: [
//         {
//           name: "Paycheck 1",
//           planned: 0,
//           sumOfTransactions: 0
//         },
//         {
//           name: "Paycheck 2",
//           planned: 0,
//           sumOfTransactions: 0
//         }
//       ]
//     },
//     {
//       name: "Giving",
//       items: [
//         {
//           name: "Church",
//           planned: 0,
//           sumOfTransactions: 0
//         },
//         {
//           name: "Charity",
//           planned: 0,
//           sumOfTransactions: 0
//         }
//       ]
//     },
//     {
//       name: "Savings",
//       items: [
//         {
//           name: "Emergency Fund",
//           planned: 0,
//           sumOfTransactions: 0
//         },
//         {
//           name: "Savings",
//           planned: 0,
//           sumOfTransactions: 0
//         }
//       ]
//     },
//     {
//       name: "Housing",
//       items: [
//         {
//           name: "Mortgage/Rent",
//           planned: 0,
//           sumOfTransactions: 0
//         },
//         {
//           name: "Electricity",
//           planned: 0,
//           sumOfTransactions: 0
//         },
//         {
//           name: "Cable and Internet",
//           planned: 0,
//           sumOfTransactions: 0
//         }
//       ]
//     },
//     {
//       name: "Transportation",
//       items: [
//         {
//           name: "Gas",
//           planned: 0,
//           sumOfTransactions: 0
//         },
//         {
//           name: "Uber/Bus",
//           planned: 0,
//           sumOfTransactions: 0
//         }
//       ]
//     },
//     {
//       name: "Food",
//       items: [
//         {
//           name: "Groceries",
//           planned: 0,
//           sumOfTransactions: 0
//         },
//         {
//           name: "Restaurants",
//           planned: 0,
//           sumOfTransactions: 0
//         }
//       ]
//     },
//     {
//       name: "Personal",
//       items: [
//         {
//           name: "Cellphone",
//           planned: 0,
//           sumOfTransactions: 0
//         },
//         {
//           name: "Subscriptions",
//           planned: 0,
//           sumOfTransactions: 0
//         }
//       ]
//     },
//     {
//       name: "Lifestyle",
//       items: [
//         {
//           name: "Entertainment",
//           planned: 0,
//           sumOfTransactions: 0
//         },
//         {
//           name: "Misc",
//           planned: 0,
//           sumOfTransactions: 0
//         }
//       ]
//     },
//     {
//       name: "Health",
//       items: [
//         {
//           name: "Gym",
//           planned: 0,
//           sumOfTransactions: 0
//         },
//         {
//           name: "Medicine",
//           planned: 0,
//           sumOfTransactions: 0
//         },
//         {
//           name: "Doctor",
//           planned: 0,
//           sumOfTransactions: 0
//         }
//       ]
//     },
//     {
//       name: "Insurance",
//       items: [
//         {
//           name: "Auto",
//           planned: 0,
//           sumOfTransactions: 0
//         },
//         {
//           name: "Homeowner/Renter",
//           planned: 0,
//           sumOfTransactions: 0
//         }
//       ]
//     },
//     {
//       name: "Debt",
//       items: [
//         {
//           name: "Car",
//           planned: 0,
//           sumOfTransactions: 0
//         },
//         {
//           name: "Student Loans",
//           planned: 0,
//           sumOfTransactions: 0
//         },
//         {
//           name: "Medical Bill",
//           planned: 0,
//           sumOfTransactions: 0
//         },
//         {
//           name: "Personal Loan",
//           planned: 0,
//           sumOfTransactions: 0
//         }
//       ]
//     },
//   ],
//
// });

let activeBudget;
let monthArr;

passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

//doesn't work yet. deletes unverified users once a day 24 is hours
setInterval(deleteNotVerified, 1000 * 60 * 60 * 24);


app.get("/", function(req, res) {

    var info;

    res.render('login', {error: info});

});

// app.post("/", function(req, res) {
//   if (req.body.button === "login") {
//
//     const user = new User({
//       username: req.body.username,
//       password: req.body.password,
//     });
//
//     req.login(user, function(err) {
//       if (err) {
//         console.log(err);
//       } else {
//
//         console.log('about to be authenticated');
//
//         passport.authenticate('local')(req, res, function(error) {
//
//           res.redirect("/budget");
//         });
//       }
//     });
//   } else  {
//     res.redirect("/create");
//   }
// });

// app.post("/login", passport.authenticate('local', { successRedirect: '/budget', failureRedirect: '/', failureFlash: true})
//
// );

app.post('/login', function(req, res, next) {
  passport.authenticate('local', function(err, user, info) {
    if (err) { return next(err); }
    if (!user) {
      return res.render('login', {error: info.message}); }
    req.logIn(user, function(err) {
      if (err) { return next(err); }
      return res.redirect('/budget');
    });
  })(req, res, next);
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

app.get("/logout", function(req, res) {
  req.logout();
  res.clearCookie();
  req.session.destroy();
  res.redirect('/');
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

    //createBudgetArray(req);

    //createPastBudgets(req);

    if (!activeBudget) {
      console.log("no active budget");

      let today = new Date();

      Budget.findOne({user: req.user.username, month: utils.getMonth(today)}, function (err, budget) {
        if (err) {
          console.log('mongo is down!');
        } else if(!budget) {
          console.log("no budget in db for this month. generating default budget");
          // next idea is to display website or popup that asks user if they want to load from the past month

          var newBudget = new Budget();

          newBudget.user = req.user.username;
          newBudget.user_id = req.user._id;
          newBudget.month = utils.getMonth(today);
          newBudget.year = utils.getYear(today);
          newBudget.monthNum = utils.getMonthNum(today);
          const date = new Date(utils.getYear(today) + "-" + utils.getMonthNum(today) + "-" + "1");
          newBudget.date = date;

          newBudget.category = defaultBudget.category;

          // defaultBudget.user = req.user.username;
          // defaultBudget.month = utils.getMonth(today);
          // defaultBudget.year = utils.getYear(today);
          // defaultBudget.monthNum = utils.getMonthNum(today);

          // defaultBudget.save();

          newBudget.save();

          activeBudget = newBudget;

          //save the monthsArray for new month
          req.user.monthsArray.find((month, index) => {
            if (month.monthString === newBudget.month) {
              req.user.monthsArray[index].active = true;
            }
          });

          req.user.save();

          // const url = createChart(activeBudget._id);

          res.render("budget", {budget: activeBudget, months: req.user.monthsArray});

        } else {
          console.log("Budget found in db for this month. loading budget");
          // if (budget.user_id == undefined) {
          //   budget.user_id = req.user._id;
          //   budget.save();
          // }
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
    console.log("Not authenticated");
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
      const date = new Date(req.body.year + "-" + req.body.button + "-" + "1");

      newBudget.user = req.user.username;
      newBudget.user_id = req.user._id;
      newBudget.month = month;
      newBudget.year = parseInt(req.body.year);
      newBudget.monthNum = req.body.button;
      newBudget.date = date;

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
      req.user.monthsArray.find((month, index) => {
        if (month.monthString === newBudget.month) {
          req.user.monthsArray[index].active = true;
        }
      });

      req.user.save();
      res.redirect('/budget');

    } else {
        //laod the actual budget because it exists
        console.log('loading actual budget');
        if (budget.user_id == undefined) {
          budget.user_id = req.user._id;
          budget.save();
        }
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

app.delete("/deleteCategory", function(req, res) {
  const index = req.body.index;

  activeBudget.category[index].remove();
  activeBudget.save();

  // activeBudget.category[index].items.forEach((item, index) => {
  //   if (item.planned) {
  //   newCatSum += item.planned;
  // } else {
  //   newCatSum += 0;
  // }
  // });

  res.json({msg: 'success'});
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

app.post('/getTransaction', (req, res) => {
  const index = req.body.index;
  const itemIndex = req.body.itemIndex;
  const transactionIndex = req.body.transactionIndex;

  const transaction = activeBudget.category[index].items[itemIndex].transactions[transactionIndex];

  res.json({msg: 'success', transaction: transaction});
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

  // console.log('transaction: ' + amt);
  // console.log('sum of transactions: ' + sum);

  //send the sum back to the client so it can do the math and update the remaining span and data-value attribute
  res.json({msg: 'success', sum: sum, transactionIndex: activeBudget.category[index].items[itemIndex].transactions.length - 1});
});

app.post('/editTransaction', (req, res) => {
  const index = req.body.index;
  const itemIndex = req.body.itemIndex;
  const transactionIndex = req.body.transactionIndex;
  const type = req.body.type;
  const amt = parseFloat(req.body.amt);
  const date = req.body.date;
  const merchant = req.body.merchant;
  const notes = req.body.notes;

  var priorAmt = activeBudget.category[index].items[itemIndex].transactions[transactionIndex].amt;
  var difference = amt - priorAmt;

  activeBudget.category[index].items[itemIndex].transactions[transactionIndex].type = type;
  activeBudget.category[index].items[itemIndex].transactions[transactionIndex].amt = amt;
  activeBudget.category[index].items[itemIndex].transactions[transactionIndex].date = date;
  activeBudget.category[index].items[itemIndex].transactions[transactionIndex].merchant = merchant;
  activeBudget.category[index].items[itemIndex].transactions[transactionIndex].notes = notes;

  //increment the sum with the new transaction
  activeBudget.category[index].items[itemIndex].sumOfTransactions += difference;

  //set sum to the sum from the db
  sum = activeBudget.category[index].items[itemIndex].sumOfTransactions;

  activeBudget.save();

  res.json({msg: 'success', sum: sum});
});

app.post('/testmodalpost', (req, res) => {

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
  var sum;

  if (currentMonth == 1) {
    priorMonth = 12;
    --priorMonthYear;
  }

  const transactions = activeBudget.category[index].items[itemIndex].transactions;

  // Budget.findOne({user: req.user.username, month: month}, (err, budget) => {


  Budget.find({user: req.user.username, monthNum: priorMonth, year: priorMonthYear}, 'category', (err, budget) => {
    if (err) {

    } else if (budget.length) {
      // console.log("last month's budget" + budget);
      budget[0].category.find( function (el, index, array) {
        if (el.name == categoryName) {
          el.items.find( function (item, index, array) {
            if (item.name == itemName) {
              sum = item.sumOfTransactions;
            } else {

            }
          });
        } else {

        }
      });

      res.json({msg: 'success', transactions: transactions, sum: sum});
    } else {

      res.json({msg: 'success', transactions: transactions, sum: sum});
    }
  });

  // res.json({msg: 'success', transactions: transactions, budget: budget});

});

app.get('/testData', (req, res) => {
  const labels = [];
  const data = [];
  var income;
  var plannedSum;


  activeBudget.category.forEach((category, index) => {
    if (index > 0) {
      labels.push(category.name);
    }

    plannedSum = 0;

    category.items.forEach((item, index) => {

        if (item.planned) {
          plannedSum += item.planned;
        } else {
          plannedSum += 0;
        }

    });

    if (index > 0) {
      data.push(plannedSum);
    } else {
      income = plannedSum;
    }
  });

  res.json({msg: 'success', labels: labels, data: data, income: income});
});

//***********************************Insights***********************************************

app.get('/insights', (req, res) => {
  res.render('insights');
});

app.get('/getBudgetData', async (req, res) => {
  const user = req.user.username;
  const id = req.user._id;
  const today = new Date();
  //const fourMonths = today.add(4).months();
  const twelveMonthsAgo = new Date().add(-12).months();
  console.log(twelveMonthsAgo);
  try {
    const budgets = await Budget.find({'user_id': id, date: { $gte: twelveMonthsAgo, $lte: today}});
    res.json({msg: 'success', data: budgets});
  } catch(e) {
    res.status(500).send();
  }


});


//***********************************Plaid***********************************************

app.post('/api/create_link_token', (req, res, next) => {
  console.log(req.user._id);

  const configs = {
    user: {
      // This should correspond to a unique id for the current user.
      client_user_id: req.user._id,
    },
    client_name: 'iBudget',
    products: PLAID_PRODUCTS,
    country_codes: PLAID_COUNTRY_CODES,
    language: 'en',
  };

  if (PLAID_REDIRECT_URI !== '') {
    configs.redirect_uri = PLAID_REDIRECT_URI;
  }

  if (PLAID_ANDROID_PACKAGE_NAME !== '') {
    configs.android_package_name = PLAID_ANDROID_PACKAGE_NAME;
  }

  client.createLinkToken(configs, function (error, createTokenResponse) {
    if (error != null) {
      console.log(error);
      return res.json({
        error: error
      });
    }
    res.json(createTokenResponse);
  });


});

app.post('/api/get_public_token', async (req, res, next) => {
  PUBLIC_TOKEN = req.body.public_token;

  client.exchangePublicToken(PUBLIC_TOKEN, function (error, tokenResponse) {
    if (error != null) {

      return res.json({
        error
      });
    }
    ACCESS_TOKEN = tokenResponse.access_token;
    ITEM_ID = tokenResponse.item_id;




    const plaidItem = new PlaidItem({
      user_id: req.user._id,
      item_id: ITEM_ID,
      access_token: ACCESS_TOKEN
    });

     plaidItem.save();


    res.json({
      access_token: ACCESS_TOKEN,
      item_id: ITEM_ID,
      error: null,
    });
  });

});

// const configs = {
//   user: {
//     // This should correspond to a unique id for the current user.
//     client_user_id: req.user._id,
//   },
//   client_name: 'iBudget',
//   country_codes: PLAID_COUNTRY_CODES,
//   language: 'en',
//   webhook: 'https://webhook.sample.com',
//   access_token: myToken,
// };
//
// client.createLinkToken(configs, function (error, createTokenResponse) {
//   if (error != null) {
//     console.log(error);
//     return res.json({
//       error: error
//     });
//   }
//   console.log('new token response', createTokenResponse);
//   return res.json({error: theError, token: createTokenResponse.link_token});
// });

app.post('/api/updateLink', (req, res, next) => {
  const configs = {
    user: {
      // This should correspond to a unique id for the current user.
      client_user_id: req.user._id,
    },
    client_name: 'iBudget',
    country_codes: PLAID_COUNTRY_CODES,
    language: 'en',
    webhook: 'https://webhook.sample.com',
    access_token: req.body.token,
  };

  client.createLinkToken(configs, function (error, createTokenResponse) {
    if (error != null) {
      console.log(error);
      return res.json({
        error: error
      });
    }
    console.log('new token response', createTokenResponse);
    res.json({error: error, token: createTokenResponse.link_token});
  });

});

app.get('/api/accounts', async (req, res, next) => {




  var item = await PlaidItem.findOne({'user_id': req.user._id});
  //item = null;
  var theError;
  var token = item.access_token;
  console.log('token from db ', token);
  token = ACCESS_TOKEN;

  if (token) {


    // const response = await client
    // .invalidateAccessToken(token)
    // .catch((err) => {
    //   // handle error
    // });
    // // Store the new access_token in a persistent, secure datastore
    // const accessToken = response.new_access_token;
    // console.log('new token ', accessToken);
    // item.access_token = accessToken;
    // item.save();



  console.log('access token from db ', token);
  //console.log(ACCESS_TOKEN);
  client.getAccounts(token, function (error, accountsResponse) {
    if (error != null) {
      theError = error;
      console.log('the error ', theError);


      return res.json({
        error: error,
        token: token
      });
    }

    console.log('accounts response ', accountsResponse);


  //   if (!item.institution_name) {
  //   client.getInstitutionById(accountsResponse.item.institution_id, 'US', (err, result) => {
  //     item.institution_name = result.institution.name;
  //     item.save();
  //   });
  // } else {
  //   //console.log(result.institution.name);
  // }

    res.json({ error: null, accounts: accountsResponse });
  });

} else {
  res.json({error: 'no accounts'});
}


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

async function fixBudgets() {
  const id = '601956cc9805010004ff17ad';
  var user = await User.findOne({_id: id});

  let monthArray = [];
  var i;
  let myDate = new Date();
  var newDate;

  for (i = 0; i < 24; i++) {
    monthArray.push({active: false, date: new Date(utils.getYear(myDate) + "-" + utils.getMonthNum(myDate) + "-" + "1"), month: utils.getMonthNum(myDate), year: utils.getYear(myDate), monthString: utils.getMonth(myDate)});
    myDate = myDate.add(1).month();
    //console.log(myDate);
  }

  Budget.find({user: ''}, "month", (err, budgets) => {

    monthArray.forEach((month, index, theArray) => {
      budgets.forEach((budget) => {
        if (month.monthString === budget.month) {
          theArray[index].active = true;

          if (budget.date == undefined) {
            budget.date = month.date;
            budget.user_id = id;
            budget.save();
          }
        }
      });
    });

    user.monthsArray = monthArray;
    user.save();

  });

}

async function createPastBudgets(req) {
  var id = req.user._id;
  id = '602eafb82982f1000477ec5a';
  // console.log(id);
  if (id == '602eafb82982f1000477ec5a') {
    // var startMonth = req.user.monthsArray[0].date;
    // console.log(startMonth);
    // startMonth.add(-11).months();
    // console.log(startMonth);
    // const userArray = req.user.monthsArray;
    // var theArray = [];
    // const transactionDate = startMonth;
    // transactionDate.add(5).days();

    // Budget.deleteMany({user_id: id}, (budget) => {
    //
    // });

var transactionDate;
    const connor = await User.findOne({_id: '602eafb82982f1000477ec5a'});

    for (i = 0; i < 12; i++) {

      //req.user.monthsArray.forEach((month, index, theArray) => {
        // if (req.user.monthsArray[i].active === false) {
          var newBudget = new Budget();

          newBudget.user = connor.username;
          newBudget.user_id = id;
          newBudget.month = connor.monthsArray[i].monthString;
          newBudget.year = connor.monthsArray[i].year;
          newBudget.monthNum = connor.monthsArray[i].month;
          newBudget.date = connor.monthsArray[i].date;

          transactionDate = newBudget.date;
          //console.log(transactionDate);
          transactionDate.add(5).days();
          //console.log(transactionDate);
          newBudget.category = Budget.chartBudgets;
          newBudget.category.forEach((category) => {
            category.items.forEach((item) => {
              //console.log(item.transactions);
              //console.log(transactionDate);
              if (item.transactions.length !== 0) {
                item.transactions[0].date = transactionDate;
              }

            });
          });
          newBudget.save();

          connor.monthsArray[i].active = true;

          //theArray[index].active = true;

        // }

      //});


    }
    connor.save();

    // req.user.monthsArray = theArray.concat(req.user.monthsArray);
    // req.user.save();

    //console.log('user array ', req.user.monthsArray);
  }
}

 function createBudgetArray(req) {

  let monthArray = [];
  var i;
  let myDate = new Date();
  myDate.add(-12).months();
  var newDate;

  console.log(myDate);

  for (i = 0; i < 36; i++) {
    monthArray.push({active: false, date: new Date(utils.getYear(myDate) + "-" + utils.getMonthNum(myDate) + "-" + "1"), month: utils.getMonthNum(myDate), year: utils.getYear(myDate), monthString: utils.getMonth(myDate)});
    // console.log(new Date(utils.getYear(myDate) + "-" + utils.getMonthNum(myDate) + "-" + "1"));
    myDate = myDate.add(1).month();
    //console.log(myDate);
  }

  //user: req.user.username

  Budget.find({user: req.user.username}, "month", (err, budgets) => {
    // console.log(budgets);
    monthArray.forEach((month, index, theArray) => {
      budgets.forEach((budget) => {
        if (month.monthString === budget.month) {
          // console.log('there is an active month');
          theArray[index].active = true;

          // if (budget.date == undefined) {
          //   budget.date = month.date;
          //   budget.save();
          // }
        }
      });
    });

    // console.log('month array');
    // console.log(monthArray);

    //const connor = await User.findOne({_id: '602eafb82982f1000477ec5a'});
     req.user.monthsArray = monthArray;
     req.user.save();
    // console.log(connor);
    // connor.monthsArray = monthArray;
    // connor.save();
  });

}



function createChart(id) {
  const src= 'https://charts.mongodb.com/charts-ibudget-zqzdh/embed/charts?id=df5582b5-8d8d-45a9-9817-80e7ed5de323&theme=light&autoRefresh=true&maxDataAge=30';

  const filterDoc = {"_id": id};
  const encodedFilter = encodeURIComponent(JSON.stringify(filterDoc));

  const url = src + '&filter={"_id":' + id + '}';
  return url;
}

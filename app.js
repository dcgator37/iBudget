//jshint esversion: 8
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const Budget = require('./models/budget');
const PlaidItem = require('./models/plaid_item');
const PlaidTransaction = require('./models/plaid_transaction');
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
const moment = require('moment');
const _ = require('lodash');


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
  plus: {
    type: Boolean,
    default: false
  },
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

let activeBudget;
let monthArr;

passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

//doesn't work yet. deletes unverified users once a day 24 is hours
//setInterval(deleteNotVerified, 1000 * 60 * 60 * 24);


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

app.get("/budget", async function(req, res) {
  if (req.isAuthenticated()) {



    var count;

    if (req.user.monthsArray.length === 0) {
      console.log('no month array');
      createBudgetArray(req);
    }

    //createBudgetArray(req);

    //createPastBudgets(req);

    // if user has iBudget Plus, load Plaid transactions and pass count of new transactions
    // if (req.user.plus == true) {
    //   count = countofPlaidTransactions();
    // }

    if (!activeBudget) {
      console.log("no active budget");

      let today = new Date();

      Budget.findOne({user: req.user.username, month: utils.getMonth(today)}, async function (err, budget) {
        if (err) {
          console.log('mongo is down!');
        } else if(!budget) {

          var tempToday = new Date();
          var monthNumber = utils.getMonthNum(tempToday);
          var year = utils.getYear(tempToday);

          console.log(monthNumber);
          console.log(year);
          if (monthNumber == 1) {
            monthNumber = 12;
            console.log(monthNumber);
            --year;
            console.log(year);
          } else {
            --monthNumber;
            console.log(monthNumber);

          }

          const lastMonth = await Budget.findOne({user_id: req.user._id, monthNum: monthNumber, year: year}).catch((err) => {
            console.log(err);
          });

          if (lastMonth == undefined) {
            console.log('no last month');

            var newBudget = new Budget();

            newBudget.user = req.user.username;
            newBudget.user_id = req.user._id;
            newBudget.month = utils.getMonth(today);
            newBudget.year = utils.getYear(today);
            newBudget.monthNum = utils.getMonthNum(today);
            const date = new Date(utils.getYear(today) + "-" + utils.getMonthNum(today) + "-" + "1");
            newBudget.date = date;

            newBudget.category = defaultBudget.category;

            newBudget.save();

            activeBudget = newBudget;

            //save the monthsArray for new month
            req.user.monthsArray.find((month, index) => {
              if (month.monthString === newBudget.month) {
                req.user.monthsArray[index].active = true;
              }
            });

            req.user.save();


          } else {

            console.log('last month budget found');

            var newBudget2 = new Budget();
            const date2 = new Date(year + "-" + monthNumber + "-" + "1");

            newBudget2.user = req.user.username;
            newBudget2.user_id = req.user._id;
            newBudget2.month = lastMonth.month;
            newBudget2.year = parseInt(year);
            newBudget2.monthNum = monthNumber;
            newBudget2.date = date2;

            const category2 = lastMonth.category;

            category2.forEach((cat) => {
              cat.items.forEach((item, index, theArray) => {
                if (item.fund == true) {
                  theArray[index].startingBalance = item.endingBalance;
                }
                theArray[index].sumOfTransactions = 0;
                if (theArray[index].transactions.length > 0) {
                  theArray[index].transactions.splice(0);
                }

              });
            });

            newBudget2.category = category2;

            await newBudget2.save();
            activeBudget = newBudget2;


            //save the monthsArray for new month
               req.user.monthsArray.find((month, index) => {
                 if (month.monthString === newBudget2.month) {
                   req.user.monthsArray[index].active = true;
                 }
               });

               await req.user.save();

          }


          //console.log("no budget in db for this month. generating default budget");
          // next idea is to display website or popup that asks user if they want to load from the past month




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

app.post('/switchmonth', async (req, res) => {
  //load month
  const month = req.body.currentString;
  const lastMonth = req.body.lastString;
  console.log(month);
  console.log(lastMonth);
  try {
    if (lastMonth == undefined) {
      const budget = await Budget.findOne({user_id: req.user._id, month: month});

      activeBudget = budget;
      res.status(200).json({msg: 'success'});
      // return res.redirect('/budget');
    } else {

      const budget = await Budget.findOne({user_id: req.user._id, month: lastMonth});

      var newBudget = new Budget();
      const date = new Date(req.body.year + "-" + req.body.monthNum + "-" + "1");

      newBudget.user = req.user.username;
      newBudget.user_id = req.user._id;
      newBudget.month = month;
      newBudget.year = parseInt(req.body.year);
      newBudget.monthNum = req.body.monthNum;
      newBudget.date = date;

      if (budget) {

        const category = budget.category;

        category.forEach((cat) => {
          cat.items.forEach((item, index, theArray) => {
            if (item.fund == true) {
              theArray[index].startingBalance = item.endingBalance;
            }
            theArray[index].sumOfTransactions = 0;
            if (theArray[index].transactions.length > 0) {
              theArray[index].transactions.splice(0);
            }

          });
        });

        newBudget.category = category;

      } else {
        newBudget.category = defaultBudget.category;
      }

      await newBudget.save();
      activeBudget = newBudget;


      //save the monthsArray for new month
         req.user.monthsArray.find((month, index) => {
           if (month.monthString === newBudget.month) {
             req.user.monthsArray[index].active = true;
           }
         });

         await req.user.save();

         res.status(200).json({msg: 'success'});

    }


  } catch (e) {
    console.log(e);
  }

  // Budget.findOne({user: req.user.username, month: month}, (err, budget) => {
  //
  //   if (err) {
  //     alert('Error loading month');
  //   } else if (!budget) {
  //     //load default budget
  //
  //     var newBudget = new Budget();
  //     const date = new Date(req.body.year + "-" + req.body.button + "-" + "1");
  //
  //     newBudget.user = req.user.username;
  //     newBudget.user_id = req.user._id;
  //     newBudget.month = month;
  //     newBudget.year = parseInt(req.body.year);
  //     newBudget.monthNum = req.body.button;
  //     newBudget.date = date;
  //
  //     newBudget.category = defaultBudget.category;
  //
  //     // defaultBudget.user = req.user.username;
  //     // defaultBudget.month = month;
  //     // defaultBudget.year = parseInt(req.body.year);
  //     // defaultBudget.monthNum = req.body.monthNum;
  //     //
  //     // defaultBudget.save();
  //
  //     newBudget.save();
  //
  //     activeBudget = newBudget;
  //
  //     //save the monthsArray for new month
  //     req.user.monthsArray.find((month, index) => {
  //       if (month.monthString === newBudget.month) {
  //         req.user.monthsArray[index].active = true;
  //       }
  //     });
  //
  //     req.user.save();
  //     res.redirect('/budget');
  //
  //   } else {
  //       //laod the actual budget because it exists
  //       console.log('loading actual budget');
  //       if (budget.user_id == undefined) {
  //         budget.user_id = req.user._id;
  //         budget.save();
  //       }
  //       activeBudget = budget;
  //
  //       res.redirect('/budget');
  //   }
  //
  // });

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
  const amt = parseFloat(req.body.amt);
  const fund = req.body.fund;

  if (fund == 'true') {
    activeBudget.category[index].items[itemIndex].endingBalance = activeBudget.category[index].items[itemIndex].startingBalance + amt - activeBudget.category[index].items[itemIndex].sumOfTransactions;
  }

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

app.delete('/deleteBudget', async (req, res) => {
  var year = activeBudget.year;
  var monthNum = activeBudget.monthNum;
  const id = activeBudget._id;
  var budget;

  while (!budget) {
    if (monthNum == 1) {
      monthNum = 12;
      --year;
    } else {
      --monthNum;
    }

    budget = await Budget.findOne({user_id: req.user._id, year: year, monthNum: monthNum}).catch((e) =>{
      console.log(e);
    });

   }

   req.user.monthsArray.find((month, index) => {
     if (month.monthString === activeBudget.month) {
       req.user.monthsArray[index].active = false;
     }
   });

   await req.user.save();

   activeBudget = budget;

   await Budget.findByIdAndDelete(id);

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
  const fund = req.body.fund;



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

  if (fund == 'true') {
    activeBudget.category[index].items[itemIndex].endingBalance -= amt;
  }

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
  const fund = req.body.fund;

  var priorAmt = activeBudget.category[index].items[itemIndex].transactions[transactionIndex].amt;
  var difference = amt - priorAmt;

  activeBudget.category[index].items[itemIndex].transactions[transactionIndex].type = type;
  activeBudget.category[index].items[itemIndex].transactions[transactionIndex].amt = amt;
  activeBudget.category[index].items[itemIndex].transactions[transactionIndex].date = date;
  activeBudget.category[index].items[itemIndex].transactions[transactionIndex].merchant = merchant;
  activeBudget.category[index].items[itemIndex].transactions[transactionIndex].notes = notes;

  //increment the sum with the new transaction
  activeBudget.category[index].items[itemIndex].sumOfTransactions += difference;

  if (fund == 'true') {
    activeBudget.category[index].items[itemIndex].endingBalance -= difference;
  }

  //set sum to the sum from the db
  sum = activeBudget.category[index].items[itemIndex].sumOfTransactions;

  activeBudget.save();

  res.json({msg: 'success', sum: sum});
});

app.delete('/deleteTransaction', (req, res) => {
  const index = req.body.index;
  const itemIndex = req.body.itemIndex;
  const transactionIndex = req.body.transactionIndex;
  const amt = parseFloat(req.body.amtDB);
  const fund = req.body.fund;

  activeBudget.category[index].items[itemIndex].sumOfTransactions -= amt;
  const sum = activeBudget.category[index].items[itemIndex].sumOfTransactions;
  activeBudget.category[index].items[itemIndex].transactions.splice(transactionIndex,1);

  if (fund == 'true') {
    activeBudget.category[index].items[itemIndex].endingBalance += amt;
  }

  activeBudget.save();

  res.json({msg: 'success', sum: sum});

});

app.post('/createFund', (req, res) => {
  const index = req.body.index;
  const itemIndex = req.body.itemIndex;

  console.log(index);
  console.log(itemIndex);

  activeBudget.category[index].items[itemIndex].fund = true;
  activeBudget.category[index].items[itemIndex].startingBalance = 0;
  activeBudget.category[index].items[itemIndex].endingBalance = 0;
  activeBudget.save();

  res.json({msg: 'success'});
});

app.patch('/editFundStartBalance', (req, res) => {
  const index = req.body.index;
  const itemIndex = req.body.itemIndex;
  const startBal = req.body.startBal;
  const endBal = req.body.endBal;

  console.log(index);

  activeBudget.category[index].items[itemIndex].startingBalance = startBal;
  activeBudget.category[index].items[itemIndex].endingBalance = endBal;
  activeBudget.save();

  res.json({msg: 'success'});

});

app.patch('/editFundGoal', (req, res) => {
  const index = req.body.index;
  const itemIndex = req.body.itemIndex;
  const fundGoal = req.body.fundGoal;

  activeBudget.category[index].items[itemIndex].fundGoal = fundGoal;
  activeBudget.save();

  res.json({msg: 'success'});

});

app.post('/testmodalpost', (req, res) => {

});

app.post('/getTransactions', async (req, res) => {
  const index = req.body.index;
  const itemIndex = req.body.itemIndex;
  const categoryName = activeBudget.category[index].name;
  const itemName = activeBudget.category[index].items[itemIndex].name;
  const currentMonth = activeBudget.monthNum;
  const fund = req.body.fund;
  if (fund == 'true') {
    console.log('fund ',fund);
  }

  var currentYear = activeBudget.year;
  var priorMonth = currentMonth - 1;
  var priorMonthYear = currentYear;
  var sum;
  var sumLastYear;

  if (currentMonth == 1) {
    priorMonth = 12;
    --priorMonthYear;
  }

  const transactions = activeBudget.category[index].items[itemIndex].transactions;

  // Budget.findOne({user: req.user.username, month: month}, (err, budget) => {
  try {
    const budget = await Budget.findOne({user: req.user.username, monthNum: priorMonth, year: priorMonthYear}, 'category');
    if (budget) {
      budget.category.find( function (el, index, array) {
        if (el.name == categoryName) {
          el.items.find( function (item, index, array) {
            if (item.name == itemName) {
              if (fund == 'true') {
                sum = item.planned;
              } else {
                sum = item.sumOfTransactions;
              }
            } else {

            }
          });
        } else {

        }
      });
    }

    const budgetLastYear = await Budget.findOne({user: req.user.username, monthNum: currentMonth, year: --currentYear}, 'category');

    if (budgetLastYear) {
      budgetLastYear.category.find( function (el, index, array) {
        if (el.name == categoryName) {
          el.items.find( function (item, index, array) {
            if (item.name == itemName) {
              if (fund == 'true') {
                sumLastYear = item.planned;
              } else {
                sumLastYear = item.sumOfTransactions;
              }
            } else {

            }
          });
        } else {

        }
      });
    }

    res.json({msg: 'success', transactions: transactions, sum: sum, sumLastYear: sumLastYear});

  } catch (e) {
    res.status(500).send();
  }


  // Budget.find({user: req.user.username, monthNum: priorMonth, year: priorMonthYear}, 'category', (err, budget) => {
  //   if (err) {
  //
  //   } else if (budget.length) {
  //     // console.log("last month's budget" + budget);
  //     budget[0].category.find( function (el, index, array) {
  //       if (el.name == categoryName) {
  //         el.items.find( function (item, index, array) {
  //           if (item.name == itemName) {
  //             sum = item.sumOfTransactions;
  //           } else {
  //
  //           }
  //         });
  //       } else {
  //
  //       }
  //     });
  //
  //     res.json({msg: 'success', transactions: transactions, sum: sum});
  //   } else {
  //
  //     res.json({msg: 'success', transactions: transactions, sum: sum});
  //   }
  // });

  // res.json({msg: 'success', transactions: transactions, budget: budget});

});

app.get('/testData', (req, res) => {
  const labels = [];
  const labelsSpent = [];
  const data = [];
  const dataSpent = [];
  var income;
  var plannedSum;
  var spentSum;


  activeBudget.category.forEach((category, index) => {
    if (index > 0) {
      labels.push(category.name);
    }

    plannedSum = 0;
    spentSum = 0;

    category.items.forEach((item, index) => {

        if (item.planned) {
          plannedSum += item.planned;
        } else {
          plannedSum += 0;
        }

        spentSum += item.sumOfTransactions;

    });

    if (index > 0) {
      data.push(plannedSum);
      if (spentSum > 0) {
        dataSpent.push(spentSum);
        labelsSpent.push(category.name);
      }

    } else {
      income = plannedSum;
    }
  });

  res.json({msg: 'success', labels: labels, labelsSpent: labelsSpent, data: data, dataSpent: dataSpent, income: income});
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
    const budgets = await Budget.find({'user_id': id, date: { $gte: twelveMonthsAgo, $lte: today}}, null, {sort: {date: 1}});
    res.json({msg: 'success', data: budgets});
  } catch(e) {
    res.status(500).send();
  }


});


//***********************************Plaid***********************************************

app.post('/api/create_link_token', (req, res, next) => {
  //console.log(req.user._id);
  if (req.user.plus !== true) {
    return res.json({error: 'not a plus member'});
  }

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

app.post('/api/get_public_token', (req, res, next) => {
  PUBLIC_TOKEN = req.body.public_token;

  client.exchangePublicToken(PUBLIC_TOKEN, async function (error, tokenResponse) {
    if (error != null) {

      return res.json({
        error
      });
    }
    ACCESS_TOKEN = tokenResponse.access_token;
    ITEM_ID = tokenResponse.item_id;

    //add call to Plaid accounts before saving to the db
    try {
      const accounts = await client.getAccounts(ACCESS_TOKEN);
      console.log('accounts from await ', accounts);
      //console.log('balances from await ', accounts.accounts[0].balances);

      const result = await client.getInstitutionById(accounts.item.institution_id, 'US');
      //     item.institution_name = result.institution.name;;
      //console.log('accounts from await ', accounts);
      console.log('inst_name from await ', result.institution.name);

    } catch (e) {
      console.log(e);
    }

    //call to get insitution name from institution_id


    // const plaidItem = new PlaidItem({
    //   user_id: req.user._id,
    //   item_id: ITEM_ID,
    //   access_token: ACCESS_TOKEN,
    //   available_products: accounts.item.available_products ,
    //   billed_products: accounts.item.billed_products,
    //   institution_id: accounts.item.institution_id,
    //   institution_name: result.institution.name,
    //   webhook: accounts.item.webhook,
    //   accounts: accounts.accounts
    // });
    //
    //  plaidItem.save();


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

  // loop through plaid_item doc, accounts, for any accounts with sync = true
  // return the access token and account id?
  // query plaid balances and update the balance in db and in html

  // before that, query item doc and add anything that is missing

  if (req.user.plus !== true) {
    return res.json({error: 'not a plus member'});
  }

  var item = await PlaidItem.findOne({'user_id': req.user._id, item_id: 'aJDdZX3LZ4i7486e8mM3fKEYvXbVdgujb6vKo'});
  //item = null;
  var theError;
  var token = item.access_token;
  var dbAccounts = item.accounts;
  console.log('token from db ', token);
  //token = ACCESS_TOKEN;

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

    // const response = await client.getBalance(token).catch((e) => {
    //   console.log(e);
    //   return res.json({error: e});
    // });
    //
    // const accounts = response.accounts;
    // console.log(response);




  console.log('access token from db ', token);
  //console.log(ACCESS_TOKEN);

  const result = await client.getAccounts(token).catch((e) => {
    console.log(e);
    return res.json({error: e});
  });

  item.accounts.forEach((dbAccount, index, theArray) => {
    result.accounts.forEach((account) => {
      if (dbAccount.account_id === account.account_id) {
        theArray[index].balances = account.balances;
      }
    });
  });

  await item.save();

  // client.getAccounts(token, function (error, accountsResponse) {
  //   if (error != null) {
  //     theError = error;
  //     console.log('the error ', theError);
  //
  //
  //     return res.json({
  //       error: error,
  //       token: token
  //     });
  //   }
  //
     //console.log('accounts response ', result);

                //add code to check if the db item is missing fields and add and save them

                // item.available_products = accountsResponse.item.available_products;
                // item.billed_products = accountsResponse.item.billed_products;
                // item.institution_id = accountsResponse.item.institution_id;
                // item.webhook = accountsResponse.item.webhook;
                // item.accounts = accountsResponse.accounts;
                //
                // await item.save();


              //   if (!item.institution_name) {
              //   client.getInstitutionById(accountsResponse.item.institution_id, 'US', (err, result) => {
              //     item.institution_name = result.institution.name;
              //     item.save();
              //   });
              // } else {
              //   //console.log(result.institution.name);
              // }

    res.json({ error: null, item });
  // });

  // res.json({error: null, accounts: accounts, item: item});

} else {
  res.json({error: 'no accounts'});
}


});

app.get('/api/getNewTransactions', async (req, res, next) => {

  if (req.user.plus !== true) {
    return res.json({msg: 'not a plus member'});
  }

  //console.log('loading new transactions...');
  // await PlaidTransaction.deleteMany();
  // console.log('transactions deleted');


  const items = await PlaidItem.find({user_id: req.user._id, _id: { $ne: '604e41e6518abb3498943f5e'}});

  var year = moment().year();
  var month = moment().format("MM");
  const start_date = year + "-" + month + "-01";

  if (month == 12) {
    ++year;
    month = "01";
  } else {
    month = moment().add(1, 'M').format('MM');
  }

  const end_date = year + "-" + month + "-01";

  let offset = 0;
  let transactionsToFetch = true;
  let resultData = {transactions: []};
  let separateAccountVar = [];
  const batchSize = 100;
  let accountsToSync = [];
  let accountIdsToSync = [];
  var token;

  items.forEach((item) => {
    item.accounts.forEach((account) => {
      if (account.sync == true) {
        accountsToSync.push({account_id: account.account_id, name: account.name});
      }
    });
  });

  //console.log('accountstosync ', accountsToSync);
  const start = async () => {



  await asyncForEach(items, async (item) => {

    //console.log('item ', item);

    let accountIdsToSync = [];
    offset = 0;
    token = item.access_token;
    //console.log('token ',token);

    item.accounts.forEach((account) => {
      if (account.sync == true) {
        accountIdsToSync.push(account.account_id);
      }
    });

    //console.log('accountIdsToSync ', accountIdsToSync);

     while (transactionsToFetch) {

       //console.log('inside while ');

      const options = {
        count: batchSize,
        offset
      };
      //console.log(start_date);
      //console.log(end_date);

      const { transactions } = await client.getTransactions(token, start_date, end_date, options).catch((e) => {
        return res.json({error: e});
      });

      //console.log('transactions ', transactions);

      // separateAccountVar = accounts;
      // console.log('accounts ', separateAccountVar);

      resultData = {
        transactions: [...resultData.transactions, ...transactions]
      };

      if (transactions.length === batchSize) {
        offset += batchSize;
      } else {
        transactionsToFetch = false;
      }

    }

  });

  // items.forEach( async (item) => {
  //
  //   console.log('item ', item);
  //
  //   let accountIdsToSync = [];
  //   offset = 0;
  //   token = item.access_token;
  //   console.log('token ',token);
  //
  //   item.accounts.forEach((account) => {
  //     if (account.sync == true) {
  //       accountIdsToSync.push(account.account_id);
  //     }
  //   });
  //
  //   //console.log('accountIdsToSync ', accountIdsToSync);
  //
  //    while (transactionsToFetch) {
  //
  //      console.log('inside while ');
  //
  //     const options = {
  //       count: batchSize,
  //       offset
  //     };
  //     console.log(start_date);
  //     console.log(end_date);
  //
  //     const { transactions } = await client.getTransactions(token, start_date, end_date, options).catch((e) => {
  //       return res.json({error: e});
  //     });
  //
  //     console.log('transactions ', transactions);
  //
  //     // separateAccountVar = accounts;
  //     // console.log('accounts ', separateAccountVar);
  //
  //     resultData = {
  //       transactions: [...resultData.transactions, ...transactions]
  //     };
  //
  //     if (transactions.length === batchSize) {
  //       offset += batchSize;
  //     } else {
  //       transactionsToFetch = false;
  //     }
  //
  //   }
  //
  //   //console.log('resultdata ', resultData);
  //
  // });

  //console.log('resultdata ', resultData.transactions.length);

  const existingTransactions = await PlaidTransaction.find({user_id: req.user._id, date: { $gte: start_date, $lte: end_date}});

  //console.log('existing transactions ', existingTransactions);

  const existingTransactionsIds = existingTransactions.reduce(
    (idMap, {transaction_id: transactionId}) => ({
      ...idMap,
      [transactionId]: transactionId,
    }),
    {}
  );

  //console.log('exisiting transaction ids ', existingTransactionsIds);

  const transactionsToStore = resultData.transactions.filter(({transaction_id: transactionId}) => {
    const isExisting = existingTransactionsIds[transactionId];
    return !isExisting;
  });

  //console.log('transactions to store ', transactionsToStore);

  if (transactionsToStore.length > 0) {

    transactionsToStore.forEach((transaction, index, theArray) => {
      theArray[index].user_id = req.user._id;

      accountsToSync.forEach((account) => {
        if (transaction.account_id === account.account_id) {
          theArray[index].account_name = account.name;
        }
      });

    });

    await PlaidTransaction.insertMany(transactionsToStore).catch((e) => {
      console.log(e);
    });



  }

const untrackedTransactions = await PlaidTransaction.find({user_id: req.user._id, tracked: false});



  res.json({msg: 'success', countNewTransactions: untrackedTransactions.length});

  };

  start();

});

async function asyncForEach(array, callback) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
}

app.get('/api/getTransactions', async (req, res, next) => {
//   const account_ids = ['yEz61B4E9PT61rq1xXvzh17o6LKgVZhrpq1Zl'];
//   const item = await PlaidItem.findOne({user_id: req.user._id, item_id: 'aJDdZX3LZ4i7486e8mM3fKEYvXbVdgujb6vKo'});
//   var token = ACCESS_TOKEN;
//   token = item.access_token;
//
//   //await PlaidTransaction.deleteMany();
//
//   var year = moment().year();
//   var month = moment().month();
//   month = moment().format("MM");
//   const start_date = year + "-" + month + "-01";
//   //console.log(start_date);
//
//   if (month == 12) {
//     ++year;
//     month = "01";
//   } else {
//     month = moment().add(1, 'M').format('MM');
//   }
//
//   const end_date = year + "-" + month + "-01";
//   //console.log(end_date);
//
//
//   //get array of account ids that you want to sync with account name. pass account name to res
//   //'2020-01-01', '2020-02-01'
//
//   var offset = 0;
//   let transactionsToFetch = true;
//   let resultData = {transactions: []};
//   let separateAccountVar = [];
//   const batchSize = 100;
//
//   while (transactionsToFetch) {
//     const options = {
//       count: batchSize,
//       offset,
//     };
//
//     const { transactions, accounts } = await client.getTransactions(token, start_date, end_date, options).catch((e) => {
//       return res.json({error: e});
//     });
//
//
//     separateAccountVar = accounts;
//     console.log('accounts ', separateAccountVar);
//
//
//     resultData = {
//       transactions: [...resultData.transactions, ...transactions]
//     };
//
//     if (transactions.length === batchSize) {
//       offset += batchSize;
//     } else {
//       transactionsToFetch = false;
//     }
//     //console.log("LOOOOOOPPPPP");
//   }
//
//
//   // const response = await client
//   // .getTransactions(token, start_date, end_date, {
//   //   count: 500,
//   //   offset: 0
//   //   //account_ids: account_ids
//   // })
//   // .catch((err) => {
//   //   console.log(err);
//   //   // handle error
//   // });
// // const transactions = response.transactions;
// // console.log('transaction response ', response);
//
// //console.log('result data', resultData);
//
// // resultData.transactions.forEach((transaction, index, theArray) => {
// //   theArray[index].user_id = req.user._id;
// // });
//
// const existingTransactions = await PlaidTransaction.find({user_id: req.user._id, date: { $gte: start_date, $lte: end_date}});
//
// const existingTransactionsIds = existingTransactions.reduce(
//   (idMap, {transaction_id: transactionId}) => ({
//     ...idMap,
//     [transactionId]: transactionId,
//   }),
//   {}
// );
//
// const transactionsToStore = resultData.transactions.filter(({transaction_id: transactionId}) => {
//   const isExisting = existingTransactionsIds[transactionId];
//   return !isExisting;
//   });
//
//   console.log('count of transactionsToStore ', transactionsToStore.length);
//
//
//   if (transactionsToStore.length > 0) {
//
//     transactionsToStore.forEach((transaction, index, theArray) => {
//       theArray[index].user_id = req.user._id;
//
//       separateAccountVar.forEach((account) => {
//         if (transaction.account_id === account.account_id) {
//           theArray[index].account_name = account.name;
//         }
//       });
//
//     });
//
//     await PlaidTransaction.insertMany(transactionsToStore).catch((e) => {
//       console.log(e);
//     });
//
//   }

if (req.user.plus !== true) {
  return res.json({error: 'not a plus member'});
}

const untrackedTransactions = await PlaidTransaction.find({user_id: req.user._id, tracked: false});



res.json({result: untrackedTransactions});
});

app.post('/trackPlaidTransaction', async (req, res) => {

  const transaction = await PlaidTransaction.findById(req.body.id);

  transaction.tracked = true;
  await transaction.save();

  res.json({msg: 'success'});

});

function countofPlaidTransactions() {
  var count = 7;
  //get array of accounts that are synced from Plaid Item account array.
  // run plaid getTransactions for those accounts
  // loop through plaid transactions comparing to plaid transaction document, looking for new transactions (not tracked)
  // count these up and return the count;

  return count;

}




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
  id = '603a91e14e8c130a5c874600';
  // console.log(id);
  if (id == '603a91e14e8c130a5c874600') {
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

    //var transactionDate;
    const connor = await User.findOne({_id: id});

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

          var transactionDate = _.cloneDeep(newBudget.date);
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

 async function createBudgetArray(req) {

  let monthArray = [];
  var i;
  let myDate = new Date();
  //myDate.add(-12).months();
  var newDate;
  var id = req.user._id;

  console.log(myDate);

  for (i = 0; i < 24; i++) {
    monthArray.push({active: false, date: new Date(utils.getYear(myDate) + "-" + utils.getMonthNum(myDate) + "-" + "1"), month: utils.getMonthNum(myDate), year: utils.getYear(myDate), monthString: utils.getMonth(myDate)});
    // console.log(new Date(utils.getYear(myDate) + "-" + utils.getMonthNum(myDate) + "-" + "1"));
    myDate = myDate.add(1).month();
    //console.log(myDate);
  }

  //user: req.user.username
  //user_id: req.user._id

  Budget.find({user_id: id}, "month", (err, budgets) => {
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


//********************************************************************
     req.user.monthsArray = monthArray;
     req.user.save();


    // console.log(connor);


  });

  // const ram = await User.findOne({_id: id});
  // ram.monthsArray = monthArray;
  // ram.save();

}



function createChart(id) {
  const src= 'https://charts.mongodb.com/charts-ibudget-zqzdh/embed/charts?id=df5582b5-8d8d-45a9-9817-80e7ed5de323&theme=light&autoRefresh=true&maxDataAge=30';

  const filterDoc = {"_id": id};
  const encodedFilter = encodeURIComponent(JSON.stringify(filterDoc));

  const url = src + '&filter={"_id":' + id + '}';
  return url;
}

//Styling

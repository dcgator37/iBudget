//jshint esversion: 8
const mongoose = require('mongoose');

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

const Budget = mongoose.model('Budget', budgetSchema);

const dBudget = {
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
        },
        {
          name: "Savings",
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

};

module.exports = Budget;
module.exports.defaultBudget = dBudget;
//module.exports = defaultBudget;

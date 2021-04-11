//jshint esversion: 8
const mongoose = require('mongoose');

const budgetSchema = new mongoose.Schema ({
  user: String,
  user_id: String,
  date: Date,
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
          fund: Boolean,
          startingBalance: Number,
          endingBalance: Number,
          fundGoal: Number,
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

const chartBudgets = [
    {
      name: "Income",
      items: [
        {
          name: "Paycheck 1",
          planned: 1000,
          sumOfTransactions: 1000,
          transactions: [
            {
              type: "Income",
              amt: 1000,
              merchant: "Paycheck 1",
              notes: "example notes",
              date: Date
            }
          ]
        },
        {
          name: "Paycheck 2",
          planned: 1000,
          sumOfTransactions: 1000,
          transactions: [
            {
              type: "Income",
              amt: 1000,
              merchant: "Paycheck 2",
              notes: "example notes",
              date: Date
            }
          ]
        },
        {
          name: "Side Hustle",
          planned: 500,
          sumOfTransactions: 500,
          transactions: [
            {
              type: "Income",
              amt: 500,
              merchant: "Side Hustle",
              notes: "example notes",
              date: Date
            }
          ]
        }
      ]
    },
    {
      name: "Giving",
      items: [
        {
          name: "Church",
          planned: 25,
          sumOfTransactions: 25,
          transactions: [
            {
              type: "Expense",
              amt: 25,
              merchant: "Church",
              notes: "example notes",
              date: Date
            }
          ]
        },
        {
          name: "Charity",
          planned: 25,
          sumOfTransactions: 25,
          transactions: [
            {
              type: "Expense",
              amt: 25,
              merchant: "Charity",
              notes: "example notes",
              date: Date
            }
          ]
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
          planned: 1000,
          sumOfTransactions: 1000,
          transactions: [
            {
              type: "Expense",
              amt: 1000,
              merchant: "Mortgage/Rent",
              notes: "example notes",
              date: Date
            }
          ]
        },
        {
          name: "Electricity",
          planned: 25,
          sumOfTransactions: 25,
          transactions: [
            {
              type: "Expense",
              amt: 25,
              merchant: "Elec",
              notes: "example notes",
              date: Date
            }
          ]
        },
        {
          name: "Cable and Internet",
          planned: 25,
          sumOfTransactions: 25,
          transactions: [
            {
              type: "Expense",
              amt: 25,
              merchant: "Cable",
              notes: "example notes",
              date: Date
            }
          ]
        }
      ]
    },
    {
      name: "Transportation",
      items: [
        {
          name: "Gas",
          planned: 25,
          sumOfTransactions: 25,
          transactions: [
            {
              type: "Expense",
              amt: 25,
              merchant: "Gas",
              notes: "example notes",
              date: Date
            }
          ]
        },
        {
          name: "Uber/Bus",
          planned: 25,
          sumOfTransactions: 25,
          transactions: [
            {
              type: "Expense",
              amt: 25,
              merchant: "Uber",
              notes: "example notes",
              date: Date
            }
          ]
        }
      ]
    },
    {
      name: "Food",
      items: [
        {
          name: "Groceries",
          planned: 25,
          sumOfTransactions: 25,
          transactions: [
            {
              type: "Expense",
              amt: 25,
              merchant: "Groceries",
              notes: "example notes",
              date: Date
            }
          ]
        },
        {
          name: "Restaurants",
          planned: 25,
          sumOfTransactions: 25,
          transactions: [
            {
              type: "Expense",
              amt: 25,
              merchant: "restuarants",
              notes: "example notes",
              date: Date
            }
          ]
        }
      ]
    },
    {
      name: "Personal",
      items: [
        {
          name: "Cellphone",
          planned: 25,
          sumOfTransactions: 25,
          transactions: [
            {
              type: "Expense",
              amt: 25,
              merchant: "Cell",
              notes: "example notes",
              date: Date
            }
          ]
        },
        {
          name: "Subscriptions",
          planned: 25,
          sumOfTransactions: 25,
          transactions: [
            {
              type: "Expense",
              amt: 25,
              merchant: "Subs",
              notes: "example notes",
              date: Date
            }
          ]
        }
      ]
    },
    {
      name: "Lifestyle",
      items: [
        {
          name: "Entertainment",
          planned: 25,
          sumOfTransactions: 25,
          transactions: [
            {
              type: "Expense",
              amt: 25,
              merchant: "Entertainment",
              notes: "example notes",
              date: Date
            }
          ]
        },
        {
          name: "Misc",
          planned: 25,
          sumOfTransactions: 25,
          transactions: [
            {
              type: "Expense",
              amt: 25,
              merchant: "Misc",
              notes: "example notes",
              date: Date
            }
          ]
        }
      ]
    },
    {
      name: "Health",
      items: [
        {
          name: "Gym",
          planned: 25,
          sumOfTransactions: 25,
          transactions: [
            {
              type: "Expense",
              amt: 25,
              merchant: "Gym",
              notes: "example notes",
              date: Date
            }
          ]
        },
        {
          name: "Medicine",
          planned: 25,
          sumOfTransactions: 25,
          transactions: [
            {
              type: "Expense",
              amt: 25,
              merchant: "Medicine",
              notes: "example notes",
              date: Date
            }
          ]
        },
        {
          name: "Doctor",
          planned: 25,
          sumOfTransactions: 25,
          transactions: [
            {
              type: "Expense",
              amt: 25,
              merchant: "Doctor",
              notes: "example notes",
              date: Date
            }
          ]
        }
      ]
    },
    {
      name: "Insurance",
      items: [
        {
          name: "Auto",
          planned: 25,
          sumOfTransactions: 25,
          transactions: [
            {
              type: "Expense",
              amt: 25,
              merchant: "Auto Ins",
              notes: "example notes",
              date: Date
            }
          ]
        },
        {
          name: "Homeowner/Renter",
          planned: 25,
          sumOfTransactions: 25,
          transactions: [
            {
              type: "Expense",
              amt: 25,
              merchant: "Renter",
              notes: "example notes",
              date: Date
            }
          ]
        }
      ]
    },
    {
      name: "Debt",
      items: [
        {
          name: "Car",
          planned: 350,
          sumOfTransactions: 350,
          transactions: [
            {
              type: "Expense",
              amt: 350,
              merchant: "Car",
              notes: "example notes",
              date: Date
            }
          ]
        },
        {
          name: "Student Loans",
          planned: 200,
          sumOfTransactions: 200,
          transactions: [
            {
              type: "Expense",
              amt: 200,
              merchant: "Student Loan",
              notes: "example notes",
              date: Date
            }
          ]
        },
        {
          name: "Medical Bill",
          planned: 25,
          sumOfTransactions: 25,
          transactions: [
            {
              type: "Expense",
              amt: 25,
              merchant: "Medical",
              notes: "example notes",
              date: Date
            }
          ]
        },
        {
          name: "Personal Loan",
          planned: 25,
          sumOfTransactions: 25,
          transactions: [
            {
              type: "Expense",
              amt: 25,
              merchant: "Pers Loan",
              notes: "example notes",
              date: Date
            }
          ]
        }
      ]
    },
  ];

module.exports = Budget;
module.exports.defaultBudget = dBudget;
module.exports.chartBudgets = chartBudgets;
//module.exports = defaultBudget;

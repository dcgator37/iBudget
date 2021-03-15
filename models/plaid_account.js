//jshint esversion: 8
const mongoose = require('mongoose');

const accountSchema = new mongoose.Schema({
  
  account_id: {
    type: String,
    required: true
  },
  balances: {
    available: Number,
    current: Number,
    limit: Number,
    iso_currency_code: String,
    unofficial_currency_code: String
  },
  mask: {
    type: String,
    required: true
  },
  name: {
    type: String,
    require: true
  }
});

const PlaidAccount = mongoose.model('PlaidAccount', accountSchema);

module.exports = PlaidAccount;

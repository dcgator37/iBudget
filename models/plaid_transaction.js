//jshint esversion: 8
const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  account_id: {
    type: String,
    required: true
  },
  account_name: {
    type: String
  },
  amount: {
    type: Number,
    required: true
  },
  category: {
    type: Array,
    required: true
  },
  category_id: {
    type: String,
  },
  date: {
    type: Date,
    required: true
  },
  iso_currency_code: {
    type: String,
    required: true
  },
  merchant_name: {
    type: String
  },
  name: {
    type: String
  },
  payment_channel: {
    type: String,
    required: true
  },
  pending: {
    type: Boolean,
    required: true
  },
  transaction_id: {
    type: String,
    required: true,
    unique: true
  },
  transaction_type: {
    type: String,
    required: true
  },
  tracked: {
    type: Boolean,
    required: true,
    default: false
  }
});

const PlaidTransaction = mongoose.model('PlaidTransaction', transactionSchema);

module.exports = PlaidTransaction;

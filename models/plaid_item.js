//jshint esversion: 8
const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  available_products: Array,
  billed_products: Array,
  institution_id: String,
  institution_name: String,
  item_id: {
    type: String,
    required: true
  },
  access_token: {
    type: String,
    required: true
  },
  webhook: String
});

const PlaidItem = mongoose.model('PlaidItem', itemSchema);

module.exports = PlaidItem;

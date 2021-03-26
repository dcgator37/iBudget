//jshint esversion: 8
const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  user_id: {
    $type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  available_products: Array,
  billed_products: Array,
  institution_id: String,
  institution_name: String,
  item_id: {
    $type: String,
    required: true
  },
  access_token: {
    $type: String,
    required: true
  },
  webhook: String,
  accounts: [
    {
      account_id: {
        $type: String,
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
        $type: String,
        required: true
      },
      name: {
        $type: String,
        require: true
      },
      official_name: {
        $type: String,
      },
      subtype: {
        $type: String
      },
      type: {
        $type: String
      },
      sync: {
        $type: Boolean,
        default: true
      }
    }
  ]
},
{ typeKey: '$type' });

const PlaidItem = mongoose.model('PlaidItem', itemSchema);

module.exports = PlaidItem;

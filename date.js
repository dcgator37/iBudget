//jshint esversion:6

exports.getDate = function() {

  const today = new Date();

  const options = {
    weekday: "long",
    day: "numeric",
    month: "long"
  };

  return today.toLocaleDateString("en-US", options);

};

exports.getMonth = function() {

  const today = new Date();

  const options = {
    month: "long",
    year: "numeric"
  };

  return today.toLocaleDateString("en-US", options);

};

exports.getMonthFromBudget = function(budgetDate) {


  const options = {
    month: "long",
    year: "numeric"
  };

  return budgetDate.toLocaleDateString("en-US", options);

};

exports.getDay = function () {

  const today = new Date();

  const options = {
    weekday: "long"
  };

  return today.toLocaleDateString("en-US", options);

};

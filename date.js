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

exports.getMonth = function (date) {
  const options = {
    month: "long",
    year: "numeric"
  };

  return date.toLocaleDateString("en-US", options);
};

exports.getMonthNum = function() {

  const today = new Date();

  const options = {
    month: "numeric",
  };

  return today.toLocaleDateString("en-US", options);

};

exports.getMonthNum = function(date) {

  const options = {
    month: "numeric",
  };

  return date.toLocaleDateString("en-US", options);

};

exports.getYear = function() {

  const today = new Date();

  const options = {
    Year: "numeric",
  };

  return today.getFullYear();

};

exports.getYear = function(date) {

  const options = {
    Year: "numeric",
  };

  return date.getFullYear();

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

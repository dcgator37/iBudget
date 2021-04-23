//jshint esversion: 8

var stackedIncome;
var stackedSpending;
var labels = [];
var datasets = [];
var datasetsStackedSpending = [];

$(document).ready(function() {

  // once the document loads and is ready

  //ajax call to pull over 12 months of budget data for the user
  //when successful with data back from database, call function to load and create the charts

  getChartData();

  // dropdown code

  $(document).on('click', '.timeframe', function() {

    const el = $(this).parent().parent().siblings('.btn');

    if ($(this).hasClass('active')) {
      return false;
    } else {
      $(el).text($(this).text());
      $(this).parent().siblings('li').children('.active').removeClass('active');
      $(this).addClass('active');

      updateTimeframe($(this).text());
    }

  });

});

function getChartData() {
  //ajax call to server and db

  $.ajax({
    url: '/getBudgetData',
    method: 'get',
    success: function(res) {
      if (res.msg == 'success') {
        createCharts(res.data);

      } else {
        alert('data did not get retrieved');
      }
    },
    error: function(res) {
      alert('server error occurred');
    }
  });

}

function createCharts(data) {

  //********************************************Stacked Bar Income*********************************************************

  var incomeItems = [];
  var budgetItems = [];
  var categories = [];

  var colors = [
    "#caf270",
    "#45c490",
    "#008d93",
    "#2e5468",
    "#C0392B",
    "#9B59B6",
    "#3498DB",
    "#F5B041",
    "#CCD1D1"
  ];

   // example of dataset
   // label: 'Paycheck 1',
   // backgroundColor: "#caf270",
   // data: [12, 59, 5, 56, 58,12, 59, 87, 45]

  // loop through all 12 budgets, creating the month labels. Ex: ['Jan', 'Feb', 'Mar']
  data.forEach((budget) => {
    labels.push(budget.month.substring(0,3));

    // loop through the items in the income category. If you had income for that item, and it doesn't already exist in incomeItems array, add it
    // Ex: ['Paycheck 1', 'Paycheck 2', 'Uber']
    budget.category[0].items.forEach((item) => {
      if (item.sumOfTransactions > 0) {
        if (incomeItems.indexOf(item.name) === -1) {
          incomeItems.push(item.name);
        }
      }
    });

    // loop through non-income items for stackedbar income spending
      budget.category.forEach((category, index) => {
        if (index > 0) {
        category.items.forEach((item) => {
          if (item.sumOfTransactions > 0) {
            if (budgetItems.indexOf(item.name) === -1) {
              budgetItems.push(item.name);
            }
            if (categories.indexOf(category.name) === -1) {
              categories.push(category.name);
            }

          }
        });
        }

      });



  });

  //console.log(categories);
  //console.log(budgetItems);

  // loop through the income item array
  incomeItems.forEach((income, index) => {

    var dataForDataset = [];

    // loop through every budget month, getting the amount earned for the item for that month. Add it to a dataset
    // Ex: 12 items in array for each month. If no income for that month add zero
    // [500,500,500,1000,500,0,0,1000,0,500,500,500]
    data.forEach((budget) => {
      var sum;
      budget.category[0].items.forEach((item) => {

        if (item.name == income) {
          sum = item.sumOfTransactions;
        }

      });

      if (sum == undefined) {
        dataForDataset.push(0);
      } else {
        dataForDataset.push(sum);
      }

    });

    // create the main dataset for the chart for each item. The income name, color, and the amt earned for each month
    // Ex: [{label: 'Paycheck 1', backgroundColor: '#caf270', data: [500,500,500,1000,500,0,0,1000,0,500,500,500]},{...},{...}]
    datasets.push({
      label: income,
      backgroundColor: colors[index],
      data: dataForDataset
    });
  });



  //make a clone of the main dataset
  var tempdatasets = _.cloneDeep(datasets);

  var ctx = $('#stackedIncome');
  stackedIncome = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: tempdatasets
    },
    options: {
      scales: {
        xAxes: [{
          stacked: true,
          gridLines: {
            display: false,
          }
        }],
        yAxes: [{
          stacked: true,
          ticks: {
            beginAtZero: true,
          },
          type: 'linear',
        }]
      },
      legend: { position: 'bottom' }
    }
  });


  //********************************************Stacked Bar Spending*********************************************************

  var colors2 = [
    "#FFCDD2",
    "#EF5350",
    "#B71C1C",
    "#EC407A",
    "#CE93D8",
    "#8E24AA",
    "#311B92",
    "#5C6BC0",
    "#42A5F5",
    "#00ACC1",
    "#009688",
    "#81C784",
    "#1B5E20",
    "#C5E1A5",
    "#827717",
    "#FFEE58",
    "#FF6F00",
    "#795548",
    "#757575",
    "#B0BEC5",
    "#263238",
    "#FF3366",
    "#660066",
    "#66CC33",
    "#00FFFF",
    "#000066",
    "#45c490",
    "#008d93",
    "#2e5468",
    "#C0392B",
    "#9B59B6",
  ];

  // loop through categories
  categories.forEach((category, index) => {

    var dataForDataset = [];

    //console.log(category);

    // loop through every budget month, getting the amount earned for the item for that month. Add it to a dataset
    // Ex: 12 items in array for each month. If no income for that month add zero
    // [500,500,500,1000,500,0,0,1000,0,500,500,500]
    data.forEach((budget) => {
      var sum = 0;

      budget.category.forEach((cat) => {
        if (cat.name == category) {
          cat.items.forEach((item) => {
            sum += item.sumOfTransactions;
          });

        }

        //console.log(budget.month, " ", cat.name, " ", sum);
      });

      if (sum == undefined) {
        dataForDataset.push(0);
      } else {
        dataForDataset.push(sum);
      }

    });

    // create the main dataset for the chart for each item. The income name, color, and the amt earned for each month
    // Ex: [{label: 'Paycheck 1', backgroundColor: '#caf270', data: [500,500,500,1000,500,0,0,1000,0,500,500,500]},{...},{...}]
    datasetsStackedSpending.push({
      label: category,
      backgroundColor: colors2[index],
      data: dataForDataset
    });

  });

  //make a clone of the main dataset
  var tempdatasets2 = _.cloneDeep(datasetsStackedSpending);

  var ctx2 = $('#stackedSpending');
  stackedSpending = new Chart(ctx2, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: tempdatasets2
    },
    options: {
      scales: {
        xAxes: [{
          stacked: true,
          gridLines: {
            display: false,
          }
        }],
        yAxes: [{
          stacked: true,
          ticks: {
            beginAtZero: true,
          },
          type: 'linear',
        }]
      },
      legend: { position: 'bottom' }
    }
  });






    // loop through the items in the income category. If you had income for that item, and it doesn't already exist in incomeItems array, add it
    // Ex: ['Paycheck 1', 'Paycheck 2', 'Uber']






}

function updateTimeframe(timeframe) {
  // update all the charts with the new selected timeframe
  var tempDatasets = [];
  var tempDatasets2 = [];

  switch (timeframe) {
    case 'Year To Date':

      //current month number
      var month = moment().month() + 1;
      //at what point to slice off months. April = 4, 12-4=8. Slice out index 8,9,10,11 of array
      var start = 12 - month;

      //make a clone of the main dataset
      tempDatasets = _.cloneDeep(datasets);

      //loop through
      tempDatasets.forEach((data, index, theArray) => {
        theArray[index].data = data.data.slice(start);
      });

      stackedIncome.data.labels = labels.slice(start);
      stackedIncome.data.datasets = tempDatasets;
      stackedIncome.update();



      //make a clone of the main dataset
      tempDatasets2 = _.cloneDeep(datasetsStackedSpending);

      //loop through
      tempDatasets2.forEach((data, index, theArray) => {
        theArray[index].data = data.data.slice(start);
      });

      stackedSpending.data.labels = labels.slice(start);
      stackedSpending.data.datasets = tempDatasets2;
      stackedSpending.update();
      break;
    case 'Past 12 Months':

      stackedIncome.data.labels = labels;
      stackedIncome.data.datasets = _.cloneDeep(datasets);
      stackedIncome.update();

      stackedSpending.data.labels = labels;
      stackedSpending.data.datasets = _.cloneDeep(datasetsStackedSpending);
      stackedSpending.update();
      break;
    case 'Past 9 Months':

      tempDatasets = _.cloneDeep(datasets);

      tempDatasets.forEach((data, index, theArray) => {
        theArray[index].data = theArray[index].data.slice(3);
      });

      stackedIncome.data.labels = labels.slice(3);
      stackedIncome.data.datasets = tempDatasets;

      stackedIncome.update();



      tempDatasets2 = _.cloneDeep(datasetsStackedSpending);

      tempDatasets2.forEach((data, index, theArray) => {
        theArray[index].data = theArray[index].data.slice(3);
      });

      stackedSpending.data.labels = labels.slice(3);
      stackedSpending.data.datasets = tempDatasets2;

      stackedSpending.update();

      break;
    case 'Past 6 Months':

      tempDatasets = _.cloneDeep(datasets);

      tempDatasets.forEach((data, index, theArray) => {
        theArray[index].data = data.data.slice(6);
      });

      stackedIncome.data.labels = labels.slice(6);
      stackedIncome.data.datasets = tempDatasets;
      stackedIncome.update();



      tempDatasets2 = _.cloneDeep(datasetsStackedSpending);

      tempDatasets2.forEach((data, index, theArray) => {
        theArray[index].data = data.data.slice(6);
      });

      stackedSpending.data.labels = labels.slice(6);
      stackedSpending.data.datasets = tempDatasets2;
      stackedSpending.update();

      break;
    case 'Past 3 Months':

      tempDatasets = _.cloneDeep(datasets);

      tempDatasets.forEach((data, index, theArray) => {
        theArray[index].data = data.data.slice(9);
      });

      stackedIncome.data.labels = labels.slice(9);
      stackedIncome.data.datasets = tempDatasets;
      stackedIncome.update();



      tempDatasets2 = _.cloneDeep(datasetsStackedSpending);

      tempDatasets2.forEach((data, index, theArray) => {
        theArray[index].data = data.data.slice(9);
      });

      stackedSpending.data.labels = labels.slice(9);
      stackedSpending.data.datasets = tempDatasets2;
      stackedSpending.update();

      break;
  }

}

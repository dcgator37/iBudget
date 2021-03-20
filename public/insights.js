//jshint esversion: 8

$(document).ready(function() {

  // once the document loads and is ready

  //ajax call to pull over 12 months of budget data for the user
  //when successful with data back from database, call function to load and create the charts
  getChartData();
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
  console.log(data);
}

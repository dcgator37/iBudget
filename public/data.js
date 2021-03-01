//jshint esversion: 8



$(document).ready(function() {

  $.getScript("jquery.formatCurrency-1.4.0.js", function() {
});

// $.getScript("Chart.js", function() {
//   console.log('chart loaded');
// });

  //initialize global chart variable
  var myChart;

  //load budget data from db and create the chart with it
  getChartData();

  //format all the values on the site as currency
  $('.planned-label').toNumber().formatCurrency();
  $('.span-rem').toNumber().formatCurrency();


  //listener when clicking off an item to hide item sidebar and re-display the chart
  $(document).click(function(event) {
    var $target = $(event.target);
    if(!$target.closest('.item').length && !$target.closest('#monthPicker').length && !$target.closest('.Budget-List-Item').length  && !$target.closest('.Transactions-List').length) {
      $('.item--selected').removeClass('item--selected');
      $('#myChart').css("display", "block");
      $('.Budget-List-Container').css("display", "none");
      $('.Transactions-List').css("display", "none");
      $('.Budget-List-Item').css("display", "none");
    }
  });

  $(document).on('click', '.item', function() {

    const index = $(this).parent().attr('data-cat');
    const itemIndex = $(this).attr('data-item');
    const categoryName = $(this).parent().attr('data-cat-name');
    const itemName = $(this).children('.input-label').val();
    const remaining = $(this).children('.span-rem').text();
    const spent = $(this).children('.planned-label').attr('data-value') - $(this).children('.span-rem').attr('data-value');
    const progressAmt = (spent / $(this).children('.planned-label').attr('data-value') * 100).toFixed(1);

    //Remove the my-list--selected class from any elements that already have it
    $('.item--selected').removeClass('item--selected');
    //Add the my-list--selected class to the clicked element
    $(this).addClass('item--selected');

    console.log(progressAmt);

    $('#catName').text(categoryName);
    $('#itemName').text(itemName);
    $('#remaining').text(remaining);
    $('#spent').text(spent);
    $('#spent').toNumber().formatCurrency();
    $('.progress-bar').css('width', progressAmt + '%');
    $('.progress-bar').attr('aria-valuenow', progressAmt);

    $('#Transaction-Container').children('.Transactions-List-Row').slice(1).remove();

    //ajax query to retrieve transactions from database
    $.ajax({
      url: '/getTransactions',
      method: 'post',
      dataType: 'json',
      data: {
        'index': index,
        'itemIndex': itemIndex
      },
      success: function(res) {
        if (res.msg == 'success') {
          console.log(res.transactions);
          updateTransactions(res.transactions);
        } else {
          alert('data did not get retrieved');
        }
      },
      error: function(res) {
        alert('server error occurred');
      }
    });

    $('.Budget-List-Container').css("display", "block");
    $('.Transactions-List').css("display", "flex");
    $('.Budget-List-Item').css("display", "flex");

    $('#myChart').css("display", "none");
  });

  $(document).on('click', '#closeBudgetListItem', function() {
    $('.Transactions-List').css("display", "none");
    $('.Budget-List-Item').css("display", "none");

    $('#myChart').css("display", "block");
  });

  // Add item button click event. Sends post request to server, sending the index of the category array you're adding an item to.
  // The server adds the new blank item to the database and responds with the index of the new item. When the server responds, run
  // addItem function which appends new item html with the itemIndex
  $(document).on('click', 'button.addItem', function() {
    const index = $(this).parent().parent().attr('data-cat');
    const el = $(this).parent();

    $.ajax({
      url: '/addItem',
      method: 'post',
      dataType: 'json',
      data: {
        'index': index
      },
      success: function(res) {
        if (res.msg == 'success') {
          addItem(el, res.data);
        } else {
          alert('data did not get added');
        }
      },
      error: function(res) {
        alert('server error occurred');
      }
    });
  });

  // type: String,
  // amt: Number,
  // date: Date,
  // merchant: String,
  // notes: String,


  // Add transaction button click event. Sends post request to server, sending the transaction data.
  //
  $(document).on('click', 'button.addTransaction', function() {
    // var index = $(this).parent().attr('data-cat');
    // var itemIndex = $(this).attr('data-item');

    const itemIndex = $('.item--selected').attr('data-item');
    const index = $('.item--selected').parent().attr('data-cat');
    const el = $('.item--selected');

    // index = 5;
    // itemIndex = 0;

    $.ajax({
      url: '/addTransaction',
      method: 'post',
      dataType: 'json',
      data: {
        'type': 'Expense',
        'amt': 25,
        'date': new Date(),
        'merchant': 'test merchant',
        'notes': 'test',
        'index': index,
        'itemIndex': itemIndex
      },
      success: function(res) {
        if (res.msg == 'success') {
          console.log('Success');
          updateRemaining(el, res.sum);
        } else {
          alert('data did not get added');
        }
      },
      error: function(res) {
        alert('server error occurred');
      }
    });
  });

  $(document).on('click', '#addTransaction', function() {
    // var index = $(this).parent().attr('data-cat');
    // var itemIndex = $(this).attr('data-item');

    const itemIndex = $('.item--selected').attr('data-item');
    const index = $('.item--selected').parent().attr('data-cat');
    const el = $('.item--selected');
    const amt = 25;
    const merchant = 'test';

    $.ajax({
      url: '/addTransaction',
      method: 'post',
      dataType: 'json',
      data: {
        'type': 'Expense',
        'amt': amt,
        'date': new Date(),
        'merchant': merchant,
        'notes': 'test',
        'index': index,
        'itemIndex': itemIndex
      },
      success: function(res) {
        if (res.msg == 'success') {
          console.log('Success');
          updateRemaining(el, res.sum);
          updateBudgetListItem(el);
          addTransactionList(merchant, amt);
        } else {
          alert('data did not get added');
        }
      },
      error: function(res) {
        alert('server error occurred');
      }
    });
  });


  // Add category button click event. Sends post request to server.
  // The server adds the new blank category to the database and responds with the index of the new category. When the server responds, run
  // addCat function which appends new category container html to the bottom with the index
  $(document).on('click', 'button.addCat', function() {
    const el = $(this).parent();

    $.ajax({
      url: '/addCat',
      method: 'post',
      dataType: 'json',
      data: {},
      success: function(res) {
        if (res.msg == 'success') {
          addCat(el, res.data.index);
        } else {
          alert('data did not get edited');
        }
      },
      error: function(res) {
        alert('server error occurred');
      }
    });
  });

  // trashcan; delete item button click event. Sends delete request to server with category index and item to be deleted index
  // The server deletes the item from the database and responds with success. When the server responds, delete the html element
  $(document).on('click', 'button.btndel', function() {
    const index = $(this).parent().parent().attr('data-cat');
    const itemIndex = $(this).parent().attr('data-item');
    const el = $(this).parent();

    $.ajax({
      url: '/deleteItem',
      method: 'delete',
      dataType: 'json',
      data: {
        'index': index,
        'itemIndex': itemIndex
      },
      success: function(res) {
        if (res.msg == 'success') {
          el.remove();
          updateChart(index, res.newCatSum);
        } else {
          alert('data did not get deleted');
        }
      },
      error: function(res) {
        alert('server error occurred');
      }
    });
  });



  // Edit item name event. Sends put request to server with category index, itemIndex, and name.
  // The server edits the item in the database and responds with success. When the server responds, do nothing since the input is already edited
  $(document).on('change', '.input-label', function() {
    var index = $(this).parent().parent().attr('data-cat');
    var itemIndex = $(this).parent().attr('data-item');
    var name = $(this).val();

    $.ajax({
      url: '/editItemName',
      method: 'put',
      dataType: 'json',
      data: {
        'index': index,
        'itemIndex': itemIndex,
        'name': name
      },
      success: function(res) {
        if (res.msg == 'success') {
            $('#itemName').text(name);
        } else {
          alert('data did not get edited');
        }
      },
      error: function(res) {
        alert('server error occurred');
      }
    });
  });


  // Edit planned amount event. Sends put request to server with the index of the category array, item array itemIndex, and amount planned that is inputted.
  // The server edits the item in the database and responds with success. When the server responds, run a function to edit the remaining value which should be zero at this time since no transactions
  $(document).on('change', '.planned-label', function() {

    var index = $(this).parent().parent().attr('data-cat');
    var itemIndex = $(this).parent().attr('data-item');
    var amtDB = parseFloat($(this).val()).toFixed(2);   //change the value entered to two decimal places
    //console.log(amtDB);
    $(this).toNumber().formatCurrency();    //format it as currency with dollar sign and commas, and not accept non-numbers
    var amt = $(this).val();
    //console.log(amt);

    var el = $(this).parent();


    //if it's blank, end the function
    if (amt == '') {
      console.log('not a number');
      return false;
    }

    //save the amt to the embedded data attribute in html
    $(this).attr('data-value', amtDB);
    console.log($(this).attr('data-value'));

    $.ajax({
      url: '/editItemAmt',
      method: 'put',
      dataType: 'json',
      data: {
        'index': index,
        'itemIndex': itemIndex,
        'amt': amtDB
      },
      success: function(res) {
        if (res.msg == 'success') {
          //function to update remaining value
          updateRemaining(el, res.sum);
          updateChart(index, res.newCatSum);
          updateBudgetListItem(el);
        } else {
          alert('data did not get edited');
        }
      },
      error: function(res) {
        alert('server error occurred');
      }
    });
  });

  // Edit category name event. Sends put request to server with category index, and name.
  // The server edits the category in the database and responds with success. When the server responds, run convertCat,
  // which changes it from an input to a span. Further development will be a click event on the span, which will change it to an input so it can be edited
  $(document).on('change', '.cat-label', function() {
    var index = $(this).parent().parent().attr('data-cat');
    var name = $(this).val();
    const el = $(this);

    $.ajax({
      url: '/editCat',
      method: 'put',
      dataType: 'json',
      data: {
        'index': index,
        'name': name
      },
      success: function(res) {
        if (res.msg == 'success') {
          convertCat(el, name);
        } else {
          alert('data did not get edited');
        }
      },
      error: function(res) {
        alert('server error occurred');
      }
    });
  });

  //not used. will delete soon
  function getChartData() {
    $.ajax({
      url: '/testData',
      method: 'get',
      dataType: 'json',
      success: function(res) {
        if (res.msg == 'success') {
          console.log(res.labels);
          console.log(res.data);
          createChart(res.labels, res.data);
        } else {
          alert('data did not get added');
        }
      },
      error: function(res) {
        alert('server error occurred');
      }
    });
  }

  //function to add item html
  function addItem(el, data) {
    const item = "<div class='item' onmouseover='dosomething(this)' onmouseout='dothat(this)' onclick='clickItem(this)' data-item='" + data.itemIndex + "'>" +
      "<button type='button' class='btndel' name='button' value=''><i class='far fa-trash-alt'></i></button>" +
      "<input class='input-label' type='text' name='itemName' value='' placeholder='Enter a name'></input>" +
      "<input class='planned-label' name='planned' data-value='' value='' placeholder='$0.00' onclick='this.select()'></input>" +
      "<span class='span-rem' data-value=''>$0.00</span>" +
      "</div>";
    $(el).before(item);
  }

  //function to add category html
  function addCat(el, index) {
    const category = "<div class='container mx-auto' data-cat='" + index + "'>" +
      "<div class='itemHeader'><input class='cat-label' type='text' name='catName' value='' placeholder='Untitled'></input>" +
      "<span class='header-column'>Planned</span><span class='header-column'>Remaining</span>" +
      "</div>" +
      "<div class='itemButton' data-cat='" + index + "'>" +
      "<button class='addItem' type='button' name='button'>Add Item</button>" +
      "</div>" +
      "</div>";

    $(el).before(category);
  }

  //converts category name input to a span
  function convertCat(el, name) {
    $(el).before("<span class='header-column'>" + name + "</div>");
    $(el).remove();
  }

  function updateRemaining(el, sum) {
    console.log('data-value from label: ' + $(el).children('.planned-label').attr('data-value'));
    console.log('value from label before edit: ' + $(el).children('.planned-label').val());

    // get the planned amt from the html data element
    plannedAmt = $(el).children('.planned-label').attr('data-value');
    console.log('value from label: ' + plannedAmt);

    //set the text of the remaining span; planned amount - all the transactions for the item
    $(el).children('span').text(plannedAmt - sum);

    //set the data-value for remaining
    $(el).children('span').attr('data-value', plannedAmt - sum );

    //format the span remaining as currency
    $(el).children('span').formatCurrency();
  }

  function updateBudgetListItem(el) {
    const remaining = $(el).children('.span-rem').text();
    const spent = $(el).children('.planned-label').attr('data-value') - $(el).children('.span-rem').attr('data-value');
    const progressAmt = (spent / $(el).children('.planned-label').attr('data-value') * 100).toFixed(1);
    const name = $(el).children('.input-label').val();

    console.log(name);

    $('#itemName').text(name);
    $('#remaining').text(remaining);
    $('#spent').text(spent);
    $('#spent').toNumber().formatCurrency();
    $('.progress-bar').css('width', progressAmt + '%');
    $('.progress-bar').attr('aria-valuenow', progressAmt);
  }

  function updateTransactions(transactions) {
    const numTransactions = transactions.length;
    const el = $('#Transaction-Container');
    var htmlRow = '';

    $('#numTransactions').text(numTransactions);

    transactions.forEach((transaction) => {
      htmlRow = "<div class='Transactions-List-Row'>" +
                  "<span>Date</span>" +
                  "<span>" + transaction.merchant + "</span>" +
                  "<span class='transactionAmt'>" + transaction.amt + "</span>" +
                "</div>";

      $(el).append(htmlRow);

    });

    $('.transactionAmt').toNumber().formatCurrency();
  }

  function addTransactionList(merchant, amt) {
    const el = $('#Transaction-Container');
    var htmlRow = '';

    htmlRow = "<div class='Transactions-List-Row'>" +
                "<span>Date</span>" +
                "<span>" + merchant + "</span>" +
                "<span class='transactionAmt'>" + amt + "</span>" +
              "</div>";

    $(el).append(htmlRow);
    $('.transactionAmt').toNumber().formatCurrency();
  }

  function createChart(labels, data) {
    const chartData = {
      datasets: [{
          data: data,
          backgroundColor: [
                'rgba(255, 99, 132)',
                'rgba(54, 162, 235)',
                'rgba(255, 206, 86)',
                'rgba(75, 192, 192)',
                'rgba(153, 102, 255)',
                'rgba(255, 159, 64)',
                'rgba(244, 67, 54)',
                'rgba(159, 39, 176)',
                'rgba(63, 81, 81)',
                'rgba(33, 150, 243)',
                'rgba(0, 150, 136)',
                'rgba(76, 175, 80)',
                'rgba(255, 235, 59)',
                'rgba(255, 152, 0)',
                'rgba(255, 87, 34)'
            ]
      }],
      labels : labels
    };

    const options = [];

    var ctx = document.getElementById('myChart').getContext('2d');
    myChart = new Chart(ctx, {
      type: 'doughnut',
      data: chartData,
      options: options
    });
  }

  function updateChart(index, newCatSum) {
    //var ctx = document.getElementById('myChart');
    console.log(myChart);
    myChart.config.data.datasets[0].data[index] = newCatSum;
    myChart.update();
  }

  function addChartData(chart, label, data) {
    chart.data.labels.push(label);
    chart.data.datasets.forEach((dataset) => {
        dataset.data.push(data);
    });
    chart.update();
}

});

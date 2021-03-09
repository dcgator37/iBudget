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
  $('.Input-Planned').toNumber().formatCurrency();
  $('.Budget-Row-Remaining').toNumber().formatCurrency();

  //listener when clicking off an item to hide item sidebar and re-display the chart
  $(document).click(function(event) {
    var $target = $(event.target);
    if(!$target.closest('.Budget-Row').length && !$target.closest('#monthPicker').length && !$target.closest('.Budget-List-Item').length  && !$target.closest('.Transactions-List').length  && !$target.closest('.modal').length) {
      $('.item--selected').removeClass('item--selected');
      $('#myChart').css("display", "block");
      $('.Budget-List-Container').css("display", "none");
      $('.Transactions-List').css("display", "none");
      $('.Budget-List-Item').css("display", "none");
    }

    if(!$target.closest('.Header-Left').length && !$target.closest('.btndelHidden').length && !$target.closest('.cat-label').length) {
      const name = $('.--selected--').val();

      $('.btndelHidden').css("visibility", "hidden");

      $('input.cat-label').before("<span class='Header-Left'>" + name + "</div>");
      $('input.cat-label').remove();
      // $('.--selected--').removeClass('.--selected--');

      //convert back to span
    }
  });

  $(document).on('click', '.Budget-Row', function(e) {

    console.log('click event for budget row');

    const index = $(this).parent().attr('data-cat');
    const itemIndex = $(this).attr('data-item');

    const categoryName = $(this).parent().attr('data-cat-name');
    const itemName = $(this).children('.Input-Name').val();
    const remaining = $(this).children('.Budget-Row-Remaining').text();
    const spent = $(this).children('.Input-Planned').attr('data-value') - $(this).children('.Budget-Row-Remaining').attr('data-value');
    var progressAmt = (spent / $(this).children('.Input-Planned').attr('data-value') * 100).toFixed(1);

    if (isNaN(progressAmt)) {
      progressAmt = 0;
    }

    //Remove the my-list--selected class from any elements that already have it
    $('.item--selected').removeClass('item--selected');
    //Add the my-list--selected class to the clicked element
    $(this).addClass('item--selected');



    //set the values from the clicked item for the sidebar spans and progress bar
    $('#catName').text(categoryName);
    $('#itemName').text(itemName);
    $('#remaining').text(remaining);
    $('#spent').text(spent);
    $('#spent').toNumber().formatCurrency();
    $('.progress-bar').css('width', progressAmt + '%');
    $('.progress-bar').attr('aria-valuenow', progressAmt);

    //remove all elements of the transaction container except the first one
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
          //console.log(res.transactions);

          updateTransactions(res.transactions);
          if (res.sum == undefined) {
            $('#last-Month-Val').text('Not Found');
          } else {
            $('#last-Month-Val').text(res.sum);
            $('#last-Month-Val').toNumber().formatCurrency();
          }

        } else {
          alert('data did not get retrieved');
        }
      },
      error: function(res) {
        alert('server error occurred');
      }
    });

    //display the budget item sidebar. hide the chart
    $('.Budget-List-Container').css("display", "block");
    $('.Transactions-List').css("display", "flex");
    $('.Budget-List-Item').css("display", "flex");

    $('#myChart').css("display", "none");
  }).on('click', 'button.btndel', function(e) {
    e.stopPropagation();
  });

  $(document).on('click', '.Header-Left', function() {
    const el = $(this);
    const name = $(this).text();


    $(this).parent().children('.btndelHidden').css("visibility", "visible");


    convertCatToInput(el, name);
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

  $(document).on('click', '#testTransaction', function() {

    const today = new Date().toISOString().substring(0, 10);
    $('#transactionModalDate').val(today);

    $('#modalRemoveItem').css("display", "block");
    $('#modalItemDropdown').css("display", "none");

    // this is the click event for the Test button that opens the modal

    // you have to get the values from the budget details sidebar to fill in the modal
    // merchant input is the same as the budget item
    // item span is also the budget item.

    // budget details sidebar
    // id="itemName"

    // modal
    // id="transactionModalMerchant"
    // id="transactionModalItem"

    // spans are changed by using .text()
    // inputs by .val()

    // look at my example above with transactionModalDate. # means id=
    // make some const variables for the budget details sidebar
    // assign the variables to modal elements

    // we'll use the red stopsign thing if we want to assign to a different budget item and
    // we'll use your form select that I commented out. Good job!




  });

  $('#transactionForm').on('submit', function(e) {
    e.preventDefault();
    const dropdown = $('#modalItemSelect');
    const index = dropdown.find('option:selected').data('cat');
    const itemIndex = dropdown.find('option:selected').data('item');
    console.log('do stuff to submit the form to the backend');
    console.log($('#modalItemSelect').val());
    console.log(index);
    console.log(itemIndex);
  });

  $(document).on('click', '.fa-minus-circle', function() {
    const el = $('#modalItemSelect');
    var html = '';
    var index = 0;
    var itemIndex = 0;
    var name = '';

    //empty the item dropdown of all options
    $(el).empty();

    //hide the default item and show the dropdown
    $("#modalRemoveItem").css("display", "none");
    $('#modalItemDropdown').css("display", "block");

    html = "<option selected>Choose Budget Item(s)</option>";

    //loop through the budget containers, getting the array index for the category and the name
    //build the disabled category option html
    $('.Budget-Container').each(function() {
      index = $(this).data('cat');
      name = $(this).data('catName');
      html += "<option disabled='true' class='select-disabled' data-cat=" + index + ">" + name + "</option>";

      // loop through the item rows, getting the item index and name
      $(this).children('.Budget-Row').each(function() {
        itemIndex = $(this).data('item');

        //access the input with the name of the item. build the option html
        $(this).children('.Input-Name').each(function() {
          name = $(this).val();
          html += "<option data-cat=" + index + " data-item=" + itemIndex + ">" + name + "</option>";
        });
      });
    });

    //append the options html
    $(el).append(html);
  });

  $(document).on('click', '#setPlannedOnBudget', function() {
    const el = $('.item--selected');
    const plannedAmt = parseInt(el.children('.Input-Planned').attr('data-value'));
    const leftToBudget = parseInt($('#leftToBudget').attr('data-value'));
    const newPlanned = plannedAmt + leftToBudget;

    el.children('.Input-Planned').val(newPlanned);
    el.children('.Input-Planned').change();

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

    console.log('delete button click');

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

  $(document).on('click', 'button.btndelHidden', function() {
    const index = $(this).parent().parent().attr('data-cat');
    const el = $(this).parent().parent();

    $.ajax({
      url: '/deleteCategory',
      method: 'delete',
      dataType: 'json',
      data: {
        'index': index,
      },
      success: function(res) {
        if (res.msg == 'success') {
          el.remove();
          deleteCatFromChart(index);
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
  $(document).on('change', '.Input-Name', function() {
    var index = $(this).parent().parent().attr('data-cat');
    var itemIndex = $(this).parent().attr('data-item');
    var name = capitalizeFirstLetter($(this).val());
    $(this).val(name);

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
  $(document).on('change', '.Input-Planned', function() {

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
    var name = capitalizeFirstLetter($(this).val());
    $(this).val(name);
    $(this).parent().parent().attr('data-cat-name', name);
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
          updateChartLabels(index, name);

          convertCat(el, name);
          //need to update chart since a category was added or the name changed. use the index.

        } else {
          alert('data did not get edited');
        }
      },
      error: function(res) {
        alert('server error occurred');
      }
    });
  });



  //function to add item html
  function addItem(el, data) {
    const item = "<div class='Budget-Row' onmouseover='dosomething(this)' onmouseout='dothat(this)' onclick='clickItem(this)' data-item='" + data.itemIndex + "'>" +
      "<button type='button' class='btndel' name='button' value=''><i class='far fa-trash-alt'></i></button>" +
      "<input class='Input-Name' type='text' name='itemName' value='' placeholder='Enter a name'></input>" +
      "<input class='Input-Planned' name='planned' data-value='' value='' placeholder='$0.00' onclick='this.select()'></input>" +
      "<span class='Budget-Row-Remaining' data-value=''>$0.00</span>" +
      "</div>";
    $(el).before(item);
  }

  //function to add category html
  function addCat(el, index) {
    const category = "<div class='container Budget-Container mx-auto' data-cat-name='' data-cat='" + index + "'>" +
      "<header class='Category-Header'>" +
      "<button type='button' class='btndelHidden' name='button'><i class='far fa-trash-alt'></i></button>" +
      "<input class='cat-label' type='text' name='catName' value='' placeholder='Untitled'></input>" +
      "<span class='Header-Right'>Planned</span><span class='Header-Right'>Remaining <i class='fas fa-angle-down'></i></span>" +
      "</header>" +
      "<div class='itemButton' data-cat='" + index + "'>" +
      "<button class='addItem' type='button' name='button'>Add Item</button>" +
      "</div>" +
      "</div>";

    $(el).before(category);
  }

  //converts category name input to a span
  function convertCat(el, name) {
    $(el).before("<span class='Header-Left'>" + name + "</div>");
    $(el).remove();
  }

  function convertCatToInput(el, name) {
    $(el).before("<input class='cat-label --selected--' type='text' name='catName' value='"+ name + "' placeholder=''></input>");
    $(el).remove();
  }

  function updateRemaining(el, sum) {
    console.log('data-value from label: ' + $(el).children('.Input-Planned').attr('data-value'));
    console.log('value from label before edit: ' + $(el).children('.Input-Planned').val());

    // get the planned amt from the html data element
    plannedAmt = $(el).children('.Input-Planned').attr('data-value');
    console.log('value from label: ' + plannedAmt);

    //set the text of the remaining span; planned amount - all the transactions for the item
    $(el).children('span').text(plannedAmt - sum);

    //set the data-value for remaining
    $(el).children('span').attr('data-value', plannedAmt - sum );

    //format the span remaining as currency
    $(el).children('span').formatCurrency();
  }

  function updateBudgetListItem(el) {
    const remaining = $(el).children('.Budget-Row-Remaining').text();
    const spent = $(el).children('.Input-Planned').attr('data-value') - $(el).children('.Budget-Row-Remaining').attr('data-value');
    const progressAmt = (spent / $(el).children('.Input-Planned').attr('data-value') * 100).toFixed(1);
    const name = $(el).children('.Input-Name').val();

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
      var theDate = new Date(transaction.date);
      var month = theDate.toLocaleDateString("en-US", {month: "short"});
      var day = theDate.toLocaleDateString("en-US", {day: "numeric"});

      htmlRow = "<div class='Transactions-List-Row'>" +
                  "<div class='monthDay-container'>" +
                  "<span class='transaction-month'>" + month + "</span><span class='transaction-day'>" + day + "</span>" +
                  "</div>" +
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
    var numOfTransactions = $('#numTransactions').text();
    var theDate = new Date();
    var month = theDate.toLocaleDateString("en-US", {month: "short"});
    var day = theDate.toLocaleDateString("en-US", {day: "numeric"});

    htmlRow = "<div class='Transactions-List-Row'>" +
                "<div class='monthDay-container'>" +
                "<span class='transaction-month'>" + month + "</span><span class='transaction-day'>" + day + "</span>" +
                "</div>" +
                "<span>" + merchant + "</span>" +
                "<span class='transactionAmt'>" + amt + "</span>" +
              "</div>";

    $(el).append(htmlRow);
    $('.transactionAmt').toNumber().formatCurrency();
    $('#numTransactions').text(++numOfTransactions);
  }

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
          budgetRemaining(res.data);
        } else {
          alert('data did not get added');
        }
      },
      error: function(res) {
        alert('server error occurred');
      }
    });
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

    myChart.config.data.datasets[0].data[index] = newCatSum;
    myChart.update();
    const data = myChart.config.data.datasets[0].data;
    budgetRemaining(data);
  }

  function updateChartLabels(index, name) {
    if (myChart.data.labels[index]) {
      myChart.data.labels[index] = name;
      myChart.update();
    }
  }
  // function to determine if the user is over budget, under budget or on budget
  function budgetRemaining(data){
    const income = data[0];
    var sumofPlannedAmt = 0;

    data.forEach(function(plannedAmt, index){
      if(index>0){
        sumofPlannedAmt = sumofPlannedAmt + plannedAmt;
      }
    });

    if(sumofPlannedAmt ==  income){
      //if on budget, remove the span with the value
      $('#leftToBudget').remove();
      $('#leftToBudgetText').text("You are on budget!");
      //remove prior css class before adding new one
      $('#leftToBudgetText').removeClass();
      $('#leftToBudgetText').addClass("on-buget");
    }
    else if(sumofPlannedAmt < income){
      //if the leftToBudget value span is missing, add it
      if (!$('#leftToBudget').length) {
        $('#leftToBudgetText').before('<span id="leftToBudget" data-value=""></span>');
      }

      $('#leftToBudget').text(income - sumofPlannedAmt);
      $('#leftToBudget').attr('data-value', income - sumofPlannedAmt);
      $('#leftToBudgetText').text(" left to budget");
      //remove prior css classes before adding new ones
      $('#leftToBudget').removeClass();
      $('#leftToBudgetText').removeClass();
      $('#leftToBudget').addClass("left-to-buget");
      $('#leftToBudgetText').addClass("left-to-buget");
    }
    else if (sumofPlannedAmt > income){
      //if the leftToBudget value span is missing, add it
      if (!$('#leftToBudget').length) {
        $('#leftToBudgetText').before('<span id="leftToBudget" data-value=""></span>');
      }

      $('#leftToBudget').text(sumofPlannedAmt - income);
      //if over budget, set data-value to negative number
      $('#leftToBudget').attr('data-value', (sumofPlannedAmt - income) * -1);
      $('#leftToBudgetText').text(" over budget");
      //remove prior css classes before adding new one
      $('#leftToBudget').removeClass();
      $('#leftToBudgetText').removeClass();
      $('#leftToBudget').addClass("over-buget");
      $('#leftToBudgetText').addClass("over-buget");
    }

    $('#leftToBudget').toNumber().formatCurrency();
  }

  function deleteCatFromChart(index) {

    myChart.config.data.datasets[0].data.splice(index,1);
    myChart.data.labels.splice(index,1);
    myChart.update();
  }

  function addChartData(chart, label, data) {
    chart.data.labels.push(label);
    chart.data.datasets.forEach((dataset) => {
        dataset.data.push(data);
    });
    chart.update();
}

function capitalizeFirstLetter(string) {
  return string[0].toUpperCase() + string.slice(1);
}



});

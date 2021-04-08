//jshint esversion: 8



$(document).ready(function() {

  $.getScript("jquery.formatCurrency-1.4.0.js", function() {
});

// $.getScript("Chart.js", function() {
//   console.log('chart loaded');
// });

  // add function to get new Plaid transactions. On Success update the count notification
  getNewPlaidTransactions();

  //initialize global chart variable
  var myChart;

  //load budget data from db and create the chart with it
  getChartData();

  //update budget progressbar
  loadProgressBar();

  //format all the values on the site as currency
  $('.Input-Planned').toNumber().formatCurrency();
  $('.Budget-Row-Remaining').toNumber().formatCurrency();


  //listener when clicking off an item to hide item sidebar and re-display the chart
  $(document).click(function(event) {
    var $target = $(event.target);
    if(!$target.closest('.Budget-Row').length && !$target.closest('#monthPicker').length && !$target.closest('.Budget-List-Item').length  && !$target.closest('.Transactions-List').length  && !$target.closest('.modal').length && !$target.closest('#PlaidTransactions').length && !$target.closest('#Accounts').length && !$target.closest('.Plaid-Transaction-Row').length && !$target.closest('#pills-tab').length) {
      $('.item--selected').removeClass('item--selected');
      $('.chart-container').css("display", "block");
      $('.Budget-List-Container').css("display", "none");
      $('.Transactions-List').css("display", "none");
      $('.Budget-List-Item').css("display", "none");
      $('.Plaid-Transaction-Container').css("display", "none");
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

  //*****************************************************Main Budget****************************************************************************

  $(document).on('click', '#monthPicker', function() {
    //console.log('postion ', $('.card-body').scrollLeft());

    indexOfCurrent = $('.btn--current').attr('data-index');
    //indexOfCurrent = 23;
    if (indexOfCurrent > 4) {
      // const calcScroll = (indexOfCurrent * 62) - 178;

      //const calcScroll = ((indexOfCurrent-4) * 62) + ((indexOfCurrent-4) + 30 - 20);
      //this one kinda works
      //const calcScroll = (indexOfCurrent * 62) - 50;
      //const calcScroll = (indexOfCurrent * 62) - 248 + 10;

      //const calcScroll = 52.44 * indexOfCurrent;

      var myScrollPos = $('.btn--current').offset().left + $('.btn--current').outerWidth(true)/2 - $('.card-body').width()/2 - 260;
      $('.card-body').scrollLeft(myScrollPos);
      // console.log('calc position ',calcScroll);
      // $('.card-body').scrollLeft(calcScroll);

    }

    // 92 to cover first month; 20px padding at from; plus an extra 30 px
    // about 76 with 5th index august in middle
    //4 to left and 4 to Right
    // 5 * 62 = 310
    //34.5 + 24 + 1
    // index * 62 - 248 + 14
    //62 width
    //20px padding in between
    //564ish
    //$('.card-body').scrollLeft(300);
  });

  $('.switchmonth').on('submit', function(e) {
    e.preventDefault();
    const el = $(this).find("button");
    var currentString = $(el).attr('data-name');
    var monthString = '';
    var monthNum = $(el).val()-1;
    var lastName = '';
    var year = $(el).attr('data-year');
    console.log(currentString);

    //console.log(e);
    if ($(el).hasClass("btn--month")) {
      $('.collapse').collapse('toggle');
      $('.Budget-Main').empty();

      const currentName = moment().month(monthNum).format("MMMM");

      //monthNum = 0;

      if (monthNum == 0) {
        lastName = moment().month(11).format("MMMM");
        monthString = lastName + " " + (year - 1);
      } else {
        lastName = moment().month(monthNum - 1).format("MMMM");
        monthString = lastName + " " + year;
      }


      // if (monthNum == 12) {
      //   --year;
      //   --monthNum;
      //   monthString = lastName + " " + year;
      // } else {
      //   monthString = lastName + " " + year;
      // }

      var html = "<div class='container Copy-Month-Container'>" +
                  "<span>You need a budget for " + currentName + "</span>" +
                  "<span>We'll copy your budget from " + lastName + " to get you started!</span>" +
                  "<p></p>" +
                  "<button id='switchMonthButton' class='btn btn-primary' type='button' value=" + (++monthNum) + " data-year=" + year + " data-current='" + currentString + "' data-last='" + monthString + "'>Start Planning for " + currentName + "</button>" +
                  "</div>";

      $('.Budget-Main').append(html);

      //console.log(monthString);
      //get last month's budget with ajax and monthstring


    } else {
      //switch to the budget with monthstring ajax switchmonth

      $.ajax({
        url: '/switchmonth',
        method: 'post',
        dataType: 'json',
        data: {
          'currentString': currentString,
          'year': year,
          'monthNum': monthNum + 1
        },
        success: function(res) {
          if (res.msg == 'success') {
            window.location.replace('/budget');

          } else {
            alert('data did not get retrieved');
          }
         },
        error: function(res) {
          alert('server error occurred');
        }
      });

    }

  });

  $(document).on('click', '#switchMonthButton', function() {
    console.log('click switch button');
    const lastString = $(this).attr('data-last');
    const currentString = $(this).attr('data-current');
    const year = $(this).attr('data-year');
    const monthNum = $(this).val();

    $.ajax({
      url: '/switchmonth',
      method: 'post',
      dataType: 'json',
      data: {
        'currentString': currentString,
        'lastString': lastString,
        'year': year,
        'monthNum': monthNum
      },
      success: function(res) {
        if (res.msg == 'success') {
          window.location.replace('/budget');

        } else {
          alert('data did not get retrieved');
        }
       },
      error: function(res) {
        alert('server error occurred');
      }
    });

  });


  $(document).on('click', '.Budget-Row', function(e) {

    if ($('.fund').attr('aria-expanded') == 'true') {

      $('.fundCollapse').collapse('toggle');
    }

    const index = $(this).parent().attr('data-cat');
    const itemIndex = $(this).attr('data-item');

    const categoryName = $(this).parent().attr('data-cat-name');
    const itemName = $(this).children('.Input-Name').val();
    const remaining = $(this).children('.Budget-Row-Remaining').text();
    const planned = $(this).children('.Input-Planned').attr('data-value');
    const spent = $(this).children('.Input-Planned').attr('data-value') - $(this).children('.Budget-Row-Remaining').attr('data-value');
    var html = '';

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
    $('#spent').attr('data-value', spent);
    $('#spent').toNumber().formatCurrency();
    $('#budgetSideBarProgress').css('width', progressAmt + '%');
    $('#budgetSideBarProgress').attr('aria-valuenow', progressAmt);

    if ($(this).attr('data-fund') == 'true') {
      const startingBalance = $('.item--selected').attr('data-balance');
      const balance = startingBalance + planned - spent;
      $('#makeFund span').text('Fund Details');
      $('.fundCollapse span').css('display', 'none');
      $('.fundCollapse button').css('display', 'none');

      $('.fundCollapse').children().remove();

      html = '<div class="Budget-List-Item-Row">' +
          '<span id="startBalSpan">Starting Balance</span>' +
          '<input type="text" placeholder="$0.00" value="' + startingBalance + '" data-value="' + startingBalance + '" id="startBalInput" onclick="this.select()">' +
        '</div>' +
        '<div class="Budget-List-Item-Row">' +
          '<span id="fundPlanned">Planned This Month</span>' +
          '<span id="fundPlannedAmt" data-value="' + planned + '">' + planned + '</span>' +
        '</div>' +
        '<div class="Budget-List-Item-Row">' +
          '<span id="fundSpent">Spent This Month</span>' +
          '<span id="fundSpentAmt" data-value="' + spent + '">' + spent + '</span>' +
        '</div>' +
        '<hr>' +
        '<div class="Budget-List-Item-Row" style="justify-content: flex-end;">' +
          '<span id="fundBalance" data-value="' + balance + '">' + balance + '</span>' +
        '</div>' +
        '<hr>' +
        '<div class="Budget-List-Item-Row">' +
          '<span id="fundGoal">Savings Goal</span>' +
          '<input type="text" placeholder="$0.00" data-value="" id="fundGoalInput" onclick="this.select()">' +
        '</div>';

        $('.fundCollapse').append(html);

        $('#startBalInput').formatCurrency();
        $('#fundPlannedAmt').formatCurrency();
        $('#fundSpentAmt').formatCurrency();
        $('#fundBalance').formatCurrency();


    } else {
      $('#makeFund span').text('Make this a fund');
      $('.fundCollapse').children().remove();
      html = '<span>Funds carry balances month to month, letting you save toward a goal over time.</span>' +
              '<button id="makeThisAFund" class="btn btn-primary" style="margin-top: 10px">Make this a Fund</button>';
      $('.fundCollapse').append(html);
    }

    //remove all elements of the transaction container except the first one
    $('#Transaction-Container').children('.Transactions-List-Row').remove();

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

          if (res.sumLastYear == undefined) {
            $('#last-Year-Val').text('Not Found');
          } else {
            $('#last-Year-Val').text(res.sumLastYear);
            $('#last-Year-Val').toNumber().formatCurrency();
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

    $('.chart-container').css("display", "none");
  }).on('click', 'button.btndel', function(e) {
    e.stopPropagation();
  });


  $(document).on('click', '.dropdown-item', function() {

    if ($(this).hasClass('active')) {

      return false;
    } else {

      const dropdowntext = $(this).text();

      $('.dropdown-item').each(function() {

        if ($(this).text() == dropdowntext) {
          $(this).addClass('active');
        } else {
          $(this).removeClass('active');
        }
      });

      if ($(this).text() == 'Spent') {
          $('.Category-Header div:nth-child(4)').children('span').text('Spent ');

      } else {

        $('.Category-Header div:nth-child(4)').children('span').text('Remaining ');
      }

    }

  });




  $(document).on('click', '.Header-Left', function() {
    const el = $(this);
    const name = $(this).text();

    if (name !== "Income") {
      $(this).parent().children('.btndelHidden').css("visibility", "visible");
      convertCatToInput(el, name);
    }






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

  $(document).on('click', '#deleteBudget', function() {
    $.ajax({
      url: '/deleteBudget',
      method: 'delete',
      success: function(res) {
        window.location.replace('/budget');
      },
      error: function(res) {

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
          updateProgressBar(el);
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

  ////*****************************************************Sidebar Header - Plaid Accounts and Transactions***********************************************

  $(document).on('click', '#Accounts', function() {

    // load accounts from database
    // ajax load from database

      $.ajax({
        url: '/api/accounts',
        method: 'get',
        success: function(res) {

          if (res.error) {
            //reauthenticate
            //updatePlaidLink(res.token);

            // $.ajax({
            //   url: '/api/updateLink',
            //   method: 'post',
            //   dataType: 'json',
            //   data: {token: res.token},
            //   success: function(res) {
            //     updatePlaidLink(res.token);
            //   },
            //   error: function(res) {
            //
            //   }
            // });






          } else {
          loadAccounts(res.item);
        }
        },
        error: function(res) {

        }
      });
  });

  $(document).on('click', '#PlaidTransactions', () => {

    $.ajax({
      url: '/api/getTransactions',
      method: 'get',
      dataType: 'json',
      data: {},
      success: function(res) {

        if (res.error) {

        } else {
          loadPlaidTransactions(res.result);

          $('.Budget-List-Container').css("display", "none");
          $('.Transactions-List').css("display", "none");
          $('.Budget-List-Item').css("display", "none");

          $('.Plaid-Transaction-Container').css("display", "block");
          $('.Plaid-Transactions').css("display", "flex");
          $('.chart-container').css("display", "none");
        }

      },
      error: function(res) {
        alert('server error occurred');
      }
    });

  });

  $(document).on('click', '#addPlaidAccount', function() {
    $.ajax({
      url: '/api/create_link_token',
      method: 'post',
      dataType: 'json',
      data: {},
      success: function(res) {
        if (res.error) {

        } else {
            loadPlaidLink(res);
        }

      },
      error: function(res) {
        alert('server error occurred');
      }
    });
  });

  function loadPlaidLink(res) {

    var handler = Plaid.create({
      token: res.link_token,
      onSuccess: (public_token, metadata) => {
        $.ajax({
          url: '/api/get_public_token',
          method: 'post',
          dataType: 'json',
          data: {'public_token': public_token},
          success: function(res) {
            console.log('Plaid public token res');
            console.log('access token ', res.access_token);
            console.log('item_id ', res.item_id);
            console.log('res object ', res);

            //make another ajax call to get the accounts;
          },
          error: function(res) {
            console.log(res);

          }

        });
      },
      onLoad: () => {},
      onExit: () => {console.log('Link on Exit');},
      onEvent: (eventName, metadata) => {},
      receivedRedirectUri: null
    });

    handler.open();
  }

  function updatePlaidLink(token) {
    const updateLink = Plaid.create({
      token: token,
      onSuccess: (public_token, metadata) => {
        console.log('successfully relinked cap 1');
        console.log(public_token, metadata);
      },
      onExit: (err, metadata) => {
        console.log('exiting plaid ', err);

      },
    });

    updateLink.open();
  }

  function loadAccounts(item) {
    el = $('#addPlaidAccount').parent();
    el = $('#PlaidAccountModalBody').children('hr');
    var html = '';
    if ($('#PlaidAccountModalBody').children('.PlaidAccountRow').length == 1) {

      const itemName = item.institution_name;
      console.log(itemName);

      html += '<div class="PlaidAccountRow">' +
              '<span class="PlaidBankName">' + itemName + '<i class="fas fa-angle-down"></i></span>' +
              '</div>';

      item.accounts.forEach((account, index) => {
        var name = account.name;
        var balance = account.balances.available;

        if (account.sync == true) {
          html += '<div class="PlaidAccountRow">' +
                  //'<div class="col-12 my-2">' +
                  '<button type="button" data-bs-toggle="collapse" data-bs-target="#PlaidAccountCollapse' + index + '" aria-expanded="false" aria-controls="PlaidAccountCollapse"><span class="PlaidAccountName">' + name + '<i class="fas fa-angle-down"></i></span></button>' +
                  //'<span class="PlaidAccountName">' + name +'</span>' +
                  '<span class="PlaidAccountBalance">' + balance + '</span>' +
                  '</div>' +
                  '<div class="collapse PlaidAccountCollapse" id="PlaidAccountCollapse' + index + '">' +
                    '<div>' +
                    '<input type="checkbox" id="sync' + index + '" name="sync" checked>' +
                    '<label for="sync">Sync transactions</label>' +
                    '</div>' +
                    '<button type="button">Delete this account</button>' +
                  '</div>';
        } else {
          html += '<div class="PlaidAccountRow">' +
                  //'<div class="col-12 my-2">' +
                  '<button type="button" data-bs-toggle="collapse" data-bs-target="#PlaidAccountCollapse' + index + '" aria-expanded="false" aria-controls="PlaidAccountCollapse"><span class="PlaidAccountName">' + name + '<i class="fas fa-angle-down"></i></span></button>' +
                  //'<span class="PlaidAccountName">' + name +'</span>' +
                  '<span class="PlaidAccountBalance">' + balance + '</span>' +
                  '</div>' +
                  '<div class="collapse PlaidAccountCollapse" id="PlaidAccountCollapse' + index + '">' +
                    '<div>' +
                    '<input type="checkbox" id="sync' + index + '" name="sync">' +
                    '<label for="sync">Sync transactions</label>' +
                    '</div>' +
                    '<button type="button">Delete this account</button>' +
                  '</div>';
        }

      });
    el.before(html);
    }

    $('.PlaidAccountBalance').formatCurrency();
  }




//  $(document).on('click', '#PlaidTransactions', function() {

    // $('.Plaid-Transaction-Row').draggable({
    //   helper: 'clone',
    //   zIndex: 10000,
    // });
    // //$( ".Plaid-Transaction-Row" ).draggable( "option", "stack", ".Budget-Main" );
    //
    // $('.Budget-Row').droppable({
    //   accept: '.Plaid-Transaction-Row',
    //   drop: function (event, ui) {
    //     var droppedItem = $(ui.draggable).clone();
    //     console.log(droppedItem);
    //   }
    // });



    //$('.Budget-List-Container').css("display", "block");


    //$('#myChart').css("display", "none");

  //});

  function getNewPlaidTransactions() {

    // ajax call to query for plaid transactions. return just a count of new transactions to update notification


    $.ajax({
      url: '/api/getNewTransactions',
      method: 'get',
      dataType: 'json',
      data: {},
      success: function(res) {
        if (res.msg == 'success') {
          updateTransactionNotification(res.countNewTransactions);

        } else {
          //alert('data did not get retrieved');
        }
      },
      error: function(res) {
        alert('server error occurred');
      }
    });


  }

  function updateTransactionNotification(count) {
    console.log('updating notification ', count);
    if (count > 0) {
      $('.countTransactions').text(count);
      $('.countTransactions').css('display', 'flex');
    }
  }

  function loadPlaidTransactions(result) {
    const el = $('#pills-new');
    var html = '';

    if ($(el).children().length == 0) {

    result.forEach((transaction) => {
      var theDate = new Date(transaction.date);
      //console.log('date from Plaid ', transaction.date);
      // var month = theDate.toLocaleDateString("en-US", {month: "short"});
      // var day = theDate.toLocaleDateString("en-US", {day: "numeric"});
      var month = moment(transaction.date).format('MMM');
      var day = moment(transaction.date).date();
      var amt = transaction.amount;
      var merchant = transaction.name;
      var accountName = transaction.account_name;

      if (merchant.substring(0,3) === 'ACH') {
        merchant = merchant.slice(4);
        if (merchant.substring(0,7) === 'Deposit') {
          merchant = merchant.slice(8);
        } else if (merchant.substring(0,10) === 'Withdrawal') {
          merchant = merchant.slice(11);
        }
      }

      var origMerchant = merchant;

      if (merchant.length > 18) {
        merchant = merchant.substring(0,18) + "...";
      }
      var category = transaction.category[1];
      var type = transaction.category[0];
      // console.log(month);
      // console.log(day);
      // console.log(merchant);
      // console.log(type);
      // console.log(category);
      // console.log(amt);

      html += '<div draggable="true" class="Plaid-Transaction-Row" data-id="' + transaction._id + '">' +
                '<div class="monthDay-container" data-date=' + transaction.date + ' style="margin-left: 5px">' +
                  '<span class="transaction-month">' + month + '</span><span class="transaction-day">' + day + '</span>' +
                '</div>' +
                '<div class="Plaid-Merchant-Box">' +
                '<span class="Plaid-Merchant-Span" data-value="' + origMerchant + '">' + merchant + '</span>' +
                '<span class="Plaid-Account-Span">' + accountName + '</span>' +
                '</div>' +
                '<span class="PlaidTransactionAmt" data-value='+ amt + '>'+ amt + '</span>' +
              '</div>';


    });

    el.append(html);

  }

    $('.PlaidTransactionAmt').formatCurrency();

    let dragSources = document.querySelectorAll('[draggable="true"]');
      dragSources.forEach(dragSource => {
      dragSource.addEventListener("dragstart", dragStart);
      dragSource.addEventListener("dragend", dragEnd);
    });

    let dragDropRows = $('.Budget-Row');

    //$('.Budget-Row').on('dragenter', dragEnter);
    $('.Budget-Row').on('dragleave', dragLeave);
    $('.Budget-Row').on('dragover', dragOver);
    $('.Budget-Row').on('drop', dragDrop);

    $('.Input-Planned').on('drop', dragDrop);
    $('.Input-Name').on('drop', dragDrop);
    $('.Budget-Row-Remaining').on('drop', dragDrop);

  //  $('.Input-Planned').on('dragenter', dragEnter);
    // $('.Input-Planned').on('dragleave', dragLeave);
    // $('.Input-Planned').on('dragover', dragOver);
    // $('.Input-Planned').on('drop', dragDrop);

    // $('.Budget-Row').on('dragenter', dragEnter);
    // $('.Budget-Row').on('dragleave', dragLeave);
    // //$('.Budget-Row').on('dragover', dragOver);
    // $('.Budget-Row').on('drop', dragDrop);
    //
    // $('.Budget-Row').on('dragenter', dragEnter);
    // $('.Budget-Row').on('dragleave', dragLeave);
    // //$('.Budget-Row').on('dragover', dragOver);
    // $('.Budget-Row').on('drop', dragDrop);

    function dragStart(e) {
      //this.style.opacity = '0.4';
         this.classList.add("dragging");
        //  e.dataTransfer.setData("text/plain", e.target.id);
        //  sourceContainerId = this.parentElement.id;
    }

    function dragEnd(e) {
        this.classList.remove("dragging");
    }

    // function dragEnter() {
    //
    //   console.log($(this));
    //   $(this).addClass('hover');
    //
    // }

    function dragOver(e) {
      e.preventDefault();
      $(this).addClass('hover');
      $(this).children('.Input-Planned').addClass('hover');
      $(this).children('.Input-Name').addClass('hover');

    }

    function dragLeave() {
      $(this).removeClass('hover');
      $(this).children('.Input-Planned').removeClass('hover');
      $(this).children('.Input-Name').removeClass('hover');
    }

    function dragDrop() {
      if ($(this).attr('class') === 'Budget-Row hover') {
        //console.log($(this).attr('class'));

        const el = $(this);
        const draggedEl = $('.dragging');
        console.log(el);
        console.log(draggedEl);

        const index = $(this).parent().attr('data-cat');
        const itemIndex = $(this).attr('data-item');
        const date = $('.dragging').children('.monthDay-container').attr('data-date');
        const amtDB = $('.dragging').children('.PlaidTransactionAmt').attr('data-value');
        const merchant = $('.dragging').children('.Plaid-Merchant-Box').children('.Plaid-Merchant-Span').attr('data-value');
        const plaidTransactionId = $('.dragging').attr('data-id');
        console.log(index);
        console.log(itemIndex);
        console.log(date);
        console.log(amtDB);
        console.log(merchant);
        console.log(plaidTransactionId);

        $.ajax({
          url: '/addTransaction',
          method: 'post',
          dataType: 'json',
          data: {
            'type': 'Expense',
            'amt': amtDB,
            'date': date,
            'merchant': merchant,
            'index': index,
            'itemIndex': itemIndex
          },
          success: function(res) {
            if (res.msg == 'success') {
              console.log('Success');
              updateRemaining(el, res.sum);
              updateProgressBar(el);

              //update the Plaid transaction as tracked
              trackPlaidTransaction(plaidTransactionId);
              //remove the Plaid transaction element
              draggedEl.remove();

            } else {
              alert('data did not get added');
            }
          },
          error: function(res) {
            alert('server error occurred');
          }
        });



      }

      $(this).removeClass('hover');
      $(this).children('.Input-Planned').removeClass('hover');
      $(this).children('.Input-Name').removeClass('hover');
    }

  }

  function trackPlaidTransaction(id) {
    $.ajax({
      url: '/trackPlaidTransaction',
      method: 'post',
      dataType: 'json',
      data: {
        id
      },
      success: function(res) {
        if (res.msg == 'success') {
          console.log('plaid transaction to tracked');
          //update transaction notification
          var count = $('.countTransactions').text();
          $('.countTransactions').text(--count);
        } else {
          alert('data did not get added');
        }
      },
      error: function(res) {

      }
    });
  }

  ////*****************************************************Budget Item Sidebar****************************************************************************




  $(document).on('click', '#closeBudgetListItem', function() {
    $('.Transactions-List').css("display", "none");
    $('.Budget-List-Item').css("display", "none");

    //$('#myChart').css("display", "block");
    $('.chart-container').css("display", "block");
  });

  $(document).on('click', '#makeThisAFund', function() {
    const el = $('.item--selected');
    const index = $(el).parent().attr('data-cat');
    const itemIndex = $(el).attr('data-item');
    const inputName = $('.item--selected').children('.Input-Name');
    const planned = $('.item--selected').children('.Input-Planned').attr('data-value');
    const spent = $('.item--selected').children('.Input-Planned').attr('data-value') - $('.item--selected').children('.Budget-Row-Remaining').attr('data-value');
    const balance = planned - spent;
    var html = '<i class="fas fa-piggy-bank" style="font-size: 1.4rem; color: #0091d9; width: 5%; align-self: center;" aria-hidden="true"></i>';
    inputName.css('width', '45%');

    inputName.before(html);

    $('#makeFund').children('span').text('Fund Details');

    $(this).siblings('span').remove();
    $(this).css("display", "none");

    html = '<div class="Budget-List-Item-Row">' +
        '<span id="startBalSpan">Starting Balance</span>' +
        '<input type="text" placeholder="$0.00" value="" data-value="" id="startBalInput" onclick="this.select()">' +
      '</div>' +
      '<div class="Budget-List-Item-Row">' +
        '<span id="fundPlanned">Planned This Month</span>' +
        '<span id="fundPlannedAmt" data-value="' + planned + '">' + planned + '</span>' +
      '</div>' +
      '<div class="Budget-List-Item-Row">' +
        '<span id="fundSpent">Spent This Month</span>' +
        '<span id="fundSpentAmt" data-value="' + spent + '">' + spent + '</span>' +
      '</div>' +
      '<hr>' +
      '<div class="Budget-List-Item-Row" style="justify-content: flex-end;">' +
        '<span id="fundBalance" data-value="' + balance + '">' + balance + '</span>' +
      '</div>' +
      '<hr>' +
      '<div class="Budget-List-Item-Row">' +
        '<span id="fundGoal">Savings Goal</span>' +
        '<input type="text" placeholder="$0.00" data-value="" id="fundGoalInput" onclick="this.select()">' +
      '</div>';

      $('#fund').append(html);

      $('#fundPlannedAmt').formatCurrency();
      $('#fundSpentAmt').formatCurrency();
      $('#fundBalance').formatCurrency();
    // add the fund details html

    // ajax call to add fund=true to item
    // add starting balance field
    // add ending balance; starting balance + planned - spent

    $.ajax({
      url: '/createFund',
      method: 'post',
      dataType: 'json',
      data: {
        index,
        itemIndex
      },
      success: function(res) {

      },
      error: function(res) {

      }
    });


  });

  $(document).on('change', '#startBalInput', function() {
    var el = $('item--selected');
    var index = $(el).parent().attr('data-cat');
    var itemIndex = $(el).attr('data-item');
    const amtDB = parseFloat($(this).val()).toFixed(2);   //change the value entered to two decimal places
    const plannedAmt = parseFloat($('#fundPlannedAmt').attr('data-value')).toFixed(2);
    const spent = parseFloat($('#fundSpentAmt').attr('data-value')).toFixed(2);


    $(this).toNumber().formatCurrency();    //format it as currency with dollar sign and commas, and not accept non-numbers

    var amt = $(this).val();

    //if it's blank, end the function
    if (amt == '') {
      console.log('not a number');
      return false;
    }

    $(this).attr('data-value', amtDB);
    const balance = parseFloat(amtDB) + parseFloat(plannedAmt) - parseFloat(spent);

    $('#fundBalance').text(balance);

    $('#fundBalance').attr('data-value', balance);
    $('#fundBalance').formatCurrency();



    //ajax to save the change
  });

  $(document).on('change', '#fundGoalInput', function() {
    var el = $('item--selected');
    var index = $(el).parent().attr('data-cat');
    var itemIndex = $(el).attr('data-item');
    var amtDB = parseFloat($(this).val()).toFixed(2);   //change the value entered to two decimal places

    $(this).toNumber().formatCurrency();    //format it as currency with dollar sign and commas, and not accept non-numbers

    var amt = $(this).val();

    //if it's blank, end the function
    if (amt == '') {
      console.log('not a number');
      return false;
    }

    $(this).attr('data-value', amtDB);

    //ajax to save the change
  });

  $(document).on('click', '#setPlannedOnBudget', function() {
    const el = $('.item--selected');
    const plannedAmt = parseFloat(el.children('.Input-Planned').attr('data-value'));
    const leftToBudget = parseFloat($('#leftToBudget').attr('data-value'));
    const newPlanned = plannedAmt + leftToBudget;

    el.children('.Input-Planned').val(newPlanned);
    el.children('.Input-Planned').change();

  });

  $(document).on('click', '#setPlannedToSpent', function() {
    const el = $('.item--selected');
    const spent = $('#spent').attr('data-value');

    el.children('.Input-Planned').val(spent);
    el.children('.Input-Planned').change();

  });

  $(document).on('click', '.Transactions-List-Row', function() {
    const el = $(this);
    const itemIndex = $('.item--selected').attr('data-item');
    const index = $('.item--selected').parent().attr('data-cat');
    const transactionIndex = $(this).attr('data-index');
    const item = $('#itemName').text();
    const merchant = $(this).children('.transactionMerchant').text();
    const today = moment().format('YYYY-MM-DD');


    $.ajax({
      url: '/getTransaction',
      method: 'post',
      dataType: 'json',
      data: {
        'index': index,
        'itemIndex': itemIndex,
        'transactionIndex': transactionIndex
      },
      success: function(res) {
        if (res.msg == 'success') {
          //res.transaction

          const theDate = moment(res.transaction.date).format('YYYY-MM-DD');
          $('#transactionEditModalDate').val(theDate);
          $('#transactionEditModalAmt').val(res.transaction.amt);
          $('#transactionEditModalAmt').attr('data-value', res.transaction.amt);
          $('#transactionEditModalNote').text(res.transaction.notes);
          $('#transactionEditModal').attr('data-index', transactionIndex);

          $('#transactionEditModalAmt').formatCurrency();

        } else {
          alert('data did not get retrieved');
        }
      },
      error: function(res) {
        alert('server error occurred');
      }
    });

    //reset amt
    // $('#transactionEditModalAmt').val('');
    // $('#transactionEditModalAmt').attr('data-value', '');

    //set date picker to today
    //$('#transactionEditModalDate').val(today);

    //display item span and hide dropdown
    $('#modalEditRemoveItem').css("display", "block");
    $('#modalEditItemDropdown').css("display", "none");

    //set merchant and item
    $('#transactionEditModalMerchant').val(merchant);
    $('#modalEditItem').text(item);

    $('#transactionEditModal').modal('show');

  });

  ////*****************************************************Modal Popup****************************************************************************

  $(document).on('click', '#testTransaction', function() {

    const today = moment().format('YYYY-MM-DD');
    const itemIndex = $('.item--selected').attr('data-item');
    const index = $('.item--selected').parent().attr('data-cat');
    const item = $('#itemName').text();

    //reset amt
    $('#transactionModalAmt').val('');
    $('#transactionModalAmt').attr('data-value', '');
    $('#transactionModalAmt').focus();

    //set date picker to today
    $('#transactionModalDate').val(today);

    //display item span and hide dropdown
    $('#modalRemoveItem').css("display", "block");
    $('#modalItemDropdown').css("display", "none");

    //set merchant and item
    $('#transactionModalMerchant').val(item);
    $('#modalItem').text(item);






  });

  $('#transactionForm').on('submit', function(e) {
    e.preventDefault();
    const dropdown = $('#modalItemSelect');
    var el = $('.item--selected');

    var index;
    var itemIndex;
    var budgetItem;
    var budgetContainer;
    const amtDB = $('#transactionModalAmt').attr('data-value');
    const merchant = $('#transactionModalMerchant').val();
    const notes = $('#transactionModalNote').val();
    const date = $('#transactionModalDate').val();

    if ($('#modalRemoveItem').is(":visible")) {
      // console.log('modal remove is visible');
      index = $('.item--selected').parent().attr('data-cat');
      itemIndex = $('.item--selected').attr('data-item');
      budgetItem = $('#modalItem').text();

    } else {
      // console.log('dropdown is visible');
      index = dropdown.find('option:selected').attr('data-cat');
      itemIndex = dropdown.find('option:selected').attr('data-item');
      budgetItem = dropdown.find('option:selected').val();

      budgetContainer = $(document).find("div.Budget-Container[data-cat='" + index + "']");
      el = budgetContainer.find("div.Budget-Row[data-item='"+ itemIndex + "']");

    }

    $.ajax({
      url: '/addTransaction',
      method: 'post',
      dataType: 'json',
      data: {
        'type': 'Expense',
        'amt': amtDB,
        'date': date,
        'merchant': merchant,
        'notes': notes,
        'index': index,
        'itemIndex': itemIndex
      },
      success: function(res) {
        if (res.msg == 'success') {
          console.log('Success');
          updateRemaining(el, res.sum);
          updateProgressBar(el);
          if ($('#modalRemoveItem').is(":visible")) {
            updateBudgetListItem(el);
            addTransactionList(merchant, amtDB, date, res.transactionIndex);
          }
          $('#transactionModal').modal('hide');
        } else {
          alert('data did not get added');
        }
      },
      error: function(res) {
        alert('server error occurred');
      }
    });
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
          html += "<option value='" + name + "' data-cat=" + index + " data-item=" + itemIndex + ">" + name + "</option>";
        });
      });
    });

    //append the options html
    $(el).append(html);
  });

  $(document).on('change', '#transactionModalAmt', function() {
    var amtDB = parseFloat($('#transactionModalAmt').val()).toFixed(2);   //change the value entered to two decimal places
    $('#transactionModalAmt').attr('data-value', amtDB);
    $('#transactionModalAmt').toNumber().formatCurrency();
  });

  $(document).on('change', '#modalItemSelect', function() {

    const item = $(this).find('option:selected').val();
    $('#transactionModalMerchant').val(item);
  });



  $('#transactionEditForm').on('submit', function(e) {
    e.preventDefault();
    const dropdown = $('#modalEditItemSelect');
    var el = $('.item--selected');

    var index;
    var itemIndex;
    var budgetItem;
    var budgetContainer;
    const amtDB = $('#transactionEditModalAmt').attr('data-value');
    const merchant = $('#transactionEditModalMerchant').val();
    const notes = $('#transactionEditModalNote').val();
    const date = $('#transactionEditModalDate').val();
    const transactionIndex = $('#transactionEditModal').attr('data-index');
    console.log('date when editing trans ',date);

    if ($('#modalEditRemoveItem').is(":visible")) {
      // console.log('modal remove is visible');
      index = $('.item--selected').parent().attr('data-cat');
      itemIndex = $('.item--selected').attr('data-item');
      budgetItem = $('#modalEditItem').text();

    } else {
      // console.log('dropdown is visible');
      index = dropdown.find('option:selected').attr('data-cat');
      itemIndex = dropdown.find('option:selected').attr('data-item');
      budgetItem = dropdown.find('option:selected').val();

      budgetContainer = $(document).find("div.Budget-Container[data-cat='" + index + "']");
      el = budgetContainer.find("div.Budget-Row[data-item='"+ itemIndex + "']");

    }

    $.ajax({
      url: '/editTransaction',
      method: 'post',
      dataType: 'json',
      data: {
        'type': 'Expense',
        'amt': amtDB,
        'date': date,
        'merchant': merchant,
        'notes': notes,
        'index': index,
        'itemIndex': itemIndex,
        'transactionIndex': transactionIndex
      },
      success: function(res) {
        if (res.msg == 'success') {
          console.log('Success');
          updateRemaining(el, res.sum);
          updateProgressBar(el);
          if ($('#modalEditRemoveItem').is(":visible")) {
            updateBudgetListItem(el);
            //addTransactionList(merchant, amtDB, date, res.transactionIndex);
            editTransactionList(merchant, amtDB, date, transactionIndex);
          }
          $('#transactionEditModal').modal('hide');
        } else {
          alert('data did not get added');
        }
      },
      error: function(res) {
        alert('server error occurred');
      }
    });
  });

  $(document).on('click', '#transactionModalDelete', () => {

    var el = $('.item--selected');
    const index = $('.item--selected').parent().attr('data-cat');
    const itemIndex = $('.item--selected').attr('data-item');
    const transactionIndex = $('#transactionEditModal').attr('data-index');
    const amtDB = $('#transactionEditModalAmt').attr('data-value');

    $.ajax({
      url: '/deleteTransaction',
      method: 'delete',
      dataType: 'json',
      data: {
        index,
        itemIndex,
        transactionIndex,
        amtDB
      },
      success: function(res) {
        if (res.msg == 'success') {
          updateRemaining(el, res.sum);
          updateProgressBar(el);
          updateBudgetListItem(el);

          $('#Transaction-Container').children('.Transactions-List-Row').eq(transactionIndex).remove();
          var numOfTransactions = $('#numTransactions').text();
          $('#numTransactions').text(--numOfTransactions);
          $('#transactionEditModal').modal('hide');

        } else {

        }
      },
      error: function(res) {

      }
    });
  });

  $(document).on('change', '#transactionEditModalAmt', function() {
    var amtDB = parseFloat($('#transactionEditModalAmt').val()).toFixed(2);   //change the value entered to two decimal places
    $('#transactionEditModalAmt').attr('data-value', amtDB);
    $('#transactionEditModalAmt').toNumber().formatCurrency();
  });

  $(document).on('change', '#modalEditItemSelect', function() {

    const item = $(this).find('option:selected').val();
    $('#transactionEditModalMerchant').val(item);
  });

  // Add transaction button click event. Sends post request to server, sending the transaction data.
  //
  // $(document).on('click', 'button.addTransaction', function() {
  //   // var index = $(this).parent().attr('data-cat');
  //   // var itemIndex = $(this).attr('data-item');
  //
  //   const itemIndex = $('.item--selected').attr('data-item');
  //   const index = $('.item--selected').parent().attr('data-cat');
  //   const el = $('.item--selected');
  //
  //   // index = 5;
  //   // itemIndex = 0;
  //
  //   $.ajax({
  //     url: '/addTransaction',
  //     method: 'post',
  //     dataType: 'json',
  //     data: {
  //       'type': 'Expense',
  //       'amt': 25,
  //       'date': new Date(),
  //       'merchant': 'test merchant',
  //       'notes': 'test',
  //       'index': index,
  //       'itemIndex': itemIndex
  //     },
  //     success: function(res) {
  //       if (res.msg == 'success') {
  //         console.log('Success');
  //         updateRemaining(el, res.sum);
  //       } else {
  //         alert('data did not get added');
  //       }
  //     },
  //     error: function(res) {
  //       alert('server error occurred');
  //     }
  //   });
  // });

  // $(document).on('click', '#addTransaction', function() {
  //   // var index = $(this).parent().attr('data-cat');
  //   // var itemIndex = $(this).attr('data-item');
  //
  //   const itemIndex = $('.item--selected').attr('data-item');
  //   const index = $('.item--selected').parent().attr('data-cat');
  //   const el = $('.item--selected');
  //   const amt = 25;
  //   const merchant = 'test';
  //
  //   $.ajax({
  //     url: '/addTransaction',
  //     method: 'post',
  //     dataType: 'json',
  //     data: {
  //       'type': 'Expense',
  //       'amt': amt,
  //       'date': new Date(),
  //       'merchant': merchant,
  //       'notes': 'test',
  //       'index': index,
  //       'itemIndex': itemIndex
  //     },
  //     success: function(res) {
  //       if (res.msg == 'success') {
  //         console.log('Success');
  //         updateRemaining(el, res.sum);
  //         updateBudgetListItem(el);
  //         addTransactionList(merchant, amt);
  //       } else {
  //         alert('data did not get added');
  //       }
  //     },
  //     error: function(res) {
  //       alert('server error occurred');
  //     }
  //   });
  // });

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
    const category = "<div class='container Budget-Container' data-cat-name='' data-cat='" + index + "'>" +
      "<header class='Category-Header'>" +
      "<button type='button' class='btndelHidden' name='button'><i class='far fa-trash-alt'></i></button>" +
      "<input class='cat-label' type='text' name='catName' value='' placeholder='Untitled'></input>" +
      "<span class='Header-Right'>Planned</span>" +
      "<span class='Header-Right'>Remaining <button class='fas fa-angle-down' type='button' id='dropdownMenuButton1' data-bs-toggle='dropdown' aria-expanded='false'></button>" +
        "<ul class='dropdown-menu' aria-labelledby='dropdownMenuButton1'>" +
          "<li><a class='dropdown-item'>Remaining</a></li>" +
          "<li><a class='dropdown-item'>Spent</a></li>" +
        "</ul></span>" +
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

  //converts the category back to input when clicking on it
  function convertCatToInput(el, name) {
    $(el).before("<input class='cat-label --selected--' type='text' name='catName' value='"+ name + "' placeholder=''></input>");
    $(el).remove();
  }

  //update the Remaining to spend span next to planned
  function updateRemaining(el, sum) {
    // console.log('data-value from label: ' + $(el).children('.Input-Planned').attr('data-value'));
    // console.log('value from label before edit: ' + $(el).children('.Input-Planned').val());

    // get the planned amt from the html data element
    plannedAmt = $(el).children('.Input-Planned').attr('data-value');
    // console.log('value from label: ' + plannedAmt);
    // console.log(sum);
    const value = plannedAmt - sum;
    if (value < 0) {
        $(el).children('span').addClass('remainingnegative');
    } else {
      $(el).children('span').removeClass('remainingnegative');
    }
    //eset the text of the remaining span; planned amount - all the transactions for the item
    $(el).children('span').text((plannedAmt - sum).toFixed(2));

    //set the data-value for remaining
    $(el).children('span').attr('data-value', (plannedAmt - sum).toFixed(2) );

    //format the span remaining as currency
    $(el).children('span').formatCurrency();
  }

  function loadProgressBar() {
    const el = $('.Budget-Row');
    var planned;
    var remaining;
    var progressAmt;
    var progressBar;

    $('.Budget-Row').each(function() {
      planned = $(this).children('.Input-Planned').attr('data-value');
      remaining = $(this).children('.Budget-Row-Remaining').attr('data-value');
      progressAmt = ((planned - remaining) / planned * 100).toFixed(1);
      if (isNaN(progressAmt)) {
        progressAmt = 0;
      }

      if (remaining < 0) {
        $(this).next().children('.progress-bar').removeClass('bg-success');
        $(this).next().children('.progress-bar').addClass('bg-danger');
      }
      $(this).next().children('.progress-bar').css('width', progressAmt + '%');
      $(this).next().children('.progress-bar').attr('aria-valuenow', progressAmt);
    });
  }

  function updateProgressBar(el) {
    const planned = $(el).children('.Input-Planned').attr('data-value');
    const remaining = $(el).children('.Budget-Row-Remaining').attr('data-value');
    const progressAmt = ((planned - remaining) / planned * 100).toFixed(1);

    $(el).next().children('.progress-bar').removeClass('bg-success');
    $(el).next().children('.progress-bar').removeClass('bg-danger');

    if (remaining < 0) {
      $(el).next().children('.progress-bar').addClass('bg-danger');
    } else {
      $(el).next().children('.progress-bar').addClass('bg-success');
    }

    $(el).next().children('.progress-bar').css('width', progressAmt + '%');
    $(el).next().children('.progress-bar').attr('aria-valuenow', progressAmt);

  }

  //after clicking on an item row, add in all the data to the budget sidebar
  function updateBudgetListItem(el) {
    const remaining = $(el).children('.Budget-Row-Remaining').text();
    const spent = $(el).children('.Input-Planned').attr('data-value') - $(el).children('.Budget-Row-Remaining').attr('data-value');
    const progressAmt = (spent / $(el).children('.Input-Planned').attr('data-value') * 100).toFixed(1);
    const name = $(el).children('.Input-Name').val();

    console.log(name);

    $('#itemName').text(name);
    $('#remaining').text(remaining);
    $('#spent').text(spent);
    $('#spent').attr('data-value', spent);

    $('#spent').toNumber().formatCurrency();
    $('#budgetSideBarProgress').css('width', progressAmt + '%');
    $('#budgetSideBarProgress').attr('aria-valuenow', progressAmt);
  }

  //load transactions for the item clicked
  function updateTransactions(transactions) {
    const numTransactions = transactions.length;
    const el = $('#Transaction-Container');
    var htmlRow = '';

    $('#numTransactions').text(numTransactions);

    transactions.forEach((transaction, index) => {

      const dateString = transaction.date.substring(0,10);
      const month = moment(dateString).format('MMM');
      const day = moment(dateString).date();

      htmlRow = "<div class='Transactions-List-Row' data-index=" + index + ">" +
                  "<div class='monthDay-container'>" +
                  "<span class='transaction-month'>" + month + "</span><span class='transaction-day'>" + day + "</span>" +
                  "</div>" +
                  "<span class='transactionMerchant'>" + transaction.merchant + "</span>" +
                  "<span class='transactionAmt'>" + transaction.amt + "</span>" +
                "</div>";

      $(el).append(htmlRow);

    });

    $('.transactionAmt').toNumber().formatCurrency();
  }

  //after adding a transaction, add it as html to the sidebar
  function addTransactionList(merchant, amt, date, index) {
    const el = $('#Transaction-Container');
    var htmlRow = '';
    var numOfTransactions = $('#numTransactions').text();
    var month = moment(date).format('MMM');
    var day = moment(date).date();
    console.log('date when adding to list ', date);
    console.log(month);
    console.log(day);
    // var theDate = new Date(date);
    // console.log(theDate);
    // console.log(date);
    // var month = Date.toLocaleDateString("en-US", {month: "short"});
    // var day = Date.toLocaleDateString("en-US", {day: "numeric"});

    htmlRow = "<div class='Transactions-List-Row' data-index=" + index + ">" +
                "<div class='monthDay-container'>" +
                "<span class='transaction-month'>" + month + "</span><span class='transaction-day'>" + day + "</span>" +
                "</div>" +
                "<span class='transactionMerchant'>" + merchant + "</span>" +
                "<span class='transactionAmt'>" + amt + "</span>" +
              "</div>";

    $(el).append(htmlRow);
    $('.transactionAmt').toNumber().formatCurrency();
    $('#numTransactions').text(++numOfTransactions);
  }

  function editTransactionList(merchant, amt, date, index) {
    const el = $('#Transaction-Container').children('.Transactions-List-Row').eq(index);
    var month = moment(date).format('MMM');
    var day = moment(date).date();
    console.log(month);
    console.log(day);

    $(el).children('.transactionMerchant').text(merchant);
    $(el).children('.transactionAmt').text(amt);
    $(el).children('.transaction-month').text(month);
    $(el).children('.transaction-day').text(day);

  }

  //load data from the db to populate the chart
  function getChartData() {
    $.ajax({
      url: '/testData',
      method: 'get',
      dataType: 'json',
      success: function(res) {
        if (res.msg == 'success') {
          console.log(res.labels);
          console.log(res.data);
          createChart(res.labels, res.data, res.income);
          budgetRemaining(res.data, res.income);
        } else {
          alert('data did not get added');
        }
      },
      error: function(res) {
        alert('server error occurred');
      }
    });
  }

  //create the chart
  function createChart(labels, data, income) {
    //const income = data[0];
    //data = data.slice(1);
    //labels = labels.slice(1);
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

    const options = {
      cutoutPercentage: 60
    };

    var ctx = document.getElementById('myChart').getContext('2d');
    myChart = new Chart(ctx, {
      type: 'doughnut',
      data: chartData,
      options: options
    });

    donutInner(income);
  }

  //update the chart when the planned amt changes for an item
  function updateChart(index, newCatSum) {
    //var ctx = document.getElementById('myChart');
    var income;

    if (index > 0) {
      index--;
      myChart.config.data.datasets[0].data[index] = newCatSum;
      myChart.update();
    } else {
      income = newCatSum;
      donutInner(income);
    }




    const data = myChart.config.data.datasets[0].data;
    budgetRemaining(data, income);



  }

  //update the chart labels when an item name changes
  function updateChartLabels(index, name) {
    if (myChart.data.labels[index]) {
      myChart.data.labels[index] = name;
      myChart.update();
    }
  }

  function donutInner(income) {
    $('.donut-inner h5').text(income);
    $('.donut-inner h5').formatCurrency();
  }

  // function to determine if the user is over budget, under budget or on budget
  function budgetRemaining(data, income){
    //const income = data[0];
    var sumofPlannedAmt = 0;
    if (income == undefined) {
      income = $('#leftToBudget').attr('data-income') || $('#leftToBudgetText').attr('data-income');
    }

    //console.log('income in budgetremaining ', income);
    //console.log('data in budgetremaining ', data);

    data.forEach(function(plannedAmt, index){
      //if(index>0){
        sumofPlannedAmt = sumofPlannedAmt + plannedAmt;
      //}
    });

    //console.log(sumofPlannedAmt);

    if(sumofPlannedAmt ==  income){
      //if on budget, remove the span with the value
      $('#leftToBudget').remove();
      $('#leftToBudgetText').text("You are on budget!");
      $('#leftToBudgetText').attr('data-income', income);
      //remove prior css class before adding new one
      $('#leftToBudgetText').removeClass();
      $('#leftToBudgetText').addClass("on-buget");
    }
    else if(sumofPlannedAmt < income){
      //if the leftToBudget value span is missing, add it
      if (!$('#leftToBudget').length) {
        $('#leftToBudgetText').before('<span id="leftToBudget" data-value="" data-income=""></span>');
      }

      $('#leftToBudget').text(income - sumofPlannedAmt);
      $('#leftToBudget').attr('data-value', income - sumofPlannedAmt);
      $('#leftToBudget').attr('data-income', income);
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
        $('#leftToBudgetText').before('<span id="leftToBudget" data-value="" data-income=""></span>');
      }

      $('#leftToBudget').text(sumofPlannedAmt - income);
      //if over budget, set data-value to negative number
      $('#leftToBudget').attr('data-value', (sumofPlannedAmt - income).toFixed(2) * -1);
      $('#leftToBudget').attr('data-income', income);
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

//jshint esversion: 8

$(document).ready(function() {

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
    var index = $(this).parent().attr('data-cat');
    var itemIndex = $(this).attr('data-item');

    index = 5;
    itemIndex = 0;

    $.ajax({
      url: '/addTransaction',
      method: 'post',
      dataType: 'json',
      data: {
        type: 'Expense',
        amt: 100,
        date: new Date(),
        merchant: 'Publix',
        notes: 'I was hungry so I went to Publix',
        index: index,
        itemIndex: itemIndex
      },
      success: function(res) {
        if (res.msg == 'success') {
          console.log('Success');
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
        } else {
          alert('data did not get deleted');
        }
      },
      error: function(res) {
        alert('server error occurred');
      }
    });
  });

  // Edit planned amount event. Sends put request to server with category index, itemIndex, and amount.
  // The server edits the item in the database and responds with success. When the server responds, do nothing since the input is already edited
  $(document).on('change', '.planned-label', function() {
    var index = $(this).parent().parent().attr('data-cat');
    var itemIndex = $(this).parent().attr('data-item');
    var amt = $(this).val();
    $(this).val('$' + amt);

    $.ajax({
      url: '/editItemAmt',
      method: 'put',
      dataType: 'json',
      data: {
        'index': index,
        'itemIndex': itemIndex,
        'amt': amt
      },
      success: function(res) {
        if (res.msg == 'success') {

        } else {
          alert('data did not get edited');
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
  function getData() {
    $.ajax({
      url: '/testload',
      method: 'get',
      dataType: 'json',
      success: (res) => {
        if (res.msg == 'success') {
          //remove all the budget containers - does it remove everything inside too?
          //loop through the budget object creating category containers and items
        }
      },
      error: (res) => {
        aler('server error occurred');
      }
    });
  }

  //function to add item html
  function addItem(el, data) {
    const item = "<div class='item' onmouseover='dosomething(this)' onmouseout='dothat(this)' onclick='clickItem(this)' data-item='" + data.itemIndex + "'>" +
      "<button type='button' class='btndel' name='button' value=''><i class='far fa-trash-alt'></i></button>" +
      "<input class='input-label' type='text' name='itemName' value='' placeholder='Enter a name'></input>" +
      "<input class='planned-label' name='planned' value='' placeholder='$0.00' oninput='setTwoNumberDecimal(this)' onclick='this.select()'></input>" +
      "<span class='span-rem'>$0.00</span>" +
      "</div>";
    $(el).before(item);
  }

  //function to add category html
  function addCat(el, index) {
    const category = "<div class='container mx-auto' data-cat='" + index + "'>" +
      "<div class='item'><input class='cat-label' type='text' name='catName' value='' placeholder='Untitled'></input>" +
      "<span class='header-column'>Planned</span><span class='header-column'>Remaining</span>" +
      "</div>" +
      "<div class='item' data-cat='" + index + "'>" +
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

});

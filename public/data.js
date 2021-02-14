//jshint esversion: 8

$(document).ready(function() {


  // $(document).on('click', '.card-body .btn', function() {
  //   const month = $(this).html();
  //
  //   //ajax to retrieve different month's budget
  //
  //   $.ajax({
  //     url: '/switchmonth',
  //     method: 'post',
  //     dataType: 'json',
  //     data: {'month': month},
  //     success: function(res) {
  //       if(res.msg == 'success') {
  //
  //       } else {
  //         alert('month not loaded');
  //       }
  //     },
  //     error: function(res) {
  //       alert('server error occurred');
  //     }
  //   });
  //
  // });

  $(document).on('click', 'button.addItem', function() {
    const index = $(this).parent().parent().attr('data-cat');
    const el = $(this).parent();

    $.ajax({
      url: '/addItem',
      method: 'post',
      dataType: 'json',
      data: {'index': index},
      success: function(res) {
        if(res.msg == 'success') {
          addItem(el, res.data);
        } else {
          alert('data did not get edited');
        }
      },
      error: function(res) {
        alert('server error occurred');
      }
    });
  });

  $(document).on('click', 'button.addCat', function() {

    const el = $(this).parent();

    $.ajax({
      url: '/addCat',
      method: 'post',
      dataType: 'json',
      data: {},
      success: function(res) {
        if(res.msg == 'success') {
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

  $(document).on('click', 'button.btndel', function() {
    const index = $(this).parent().parent().attr('data-cat');
    const itemIndex = $(this).parent().attr('data-item');
    const el = $(this).parent();

    $.ajax({
      url: '/deleteItem',
      method: 'delete',
      dataType: 'json',
      data: {'index': index, 'itemIndex': itemIndex},
      success: function(res) {
        if(res.msg == 'success') {
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



$(document).on('change', '.planned-label', function() {
  var index = $(this).parent().parent().attr('data-cat');
  var itemIndex = $(this).parent().attr('data-item');
  var amt = $(this).val();
  $(this).val('$' + amt);

  $.ajax({
    url: '/editItemAmt',
    method: 'put',
    dataType: 'json',
    data: {'index': index, 'itemIndex': itemIndex, 'amt': amt},
    success: function(res) {
      if(res.msg == 'success') {

      } else {
        alert('data did not get edited');
      }
    },
    error: function(res) {
      alert('server error occurred');
    }
  });
});

$(document).on('change', '.input-label', function() {
  var index = $(this).parent().parent().attr('data-cat');
  var itemIndex = $(this).parent().attr('data-item');
  var name = $(this).val();

  $.ajax({
    url: '/editItemName',
    method: 'put',
    dataType: 'json',
    data: {'index': index, 'itemIndex': itemIndex, 'name': name},
    success: function(res) {
      if(res.msg == 'success') {

      } else {
        alert('data did not get edited');
      }
    },
    error: function(res) {
      alert('server error occurred');
    }
  });
});

$(document).on('change', '.cat-label', function() {
  var index = $(this).parent().parent().attr('data-cat');
  var name = $(this).val();
  const el = $(this);

  $.ajax({
    url: '/editCat',
    method: 'put',
    dataType: 'json',
    data: {'index': index, 'name': name},
    success: function(res) {
      if(res.msg == 'success') {
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




function getData() {
  $.ajax({
    url:'/testload',
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

function addItem(el, data) {
  const item = "<div class='item' onmouseover='dosomething(this)' onmouseout='dothat(this)' onclick='clickItem(this)' data-item='" + data.itemIndex + "'>" +
      "<button type='button' class='btndel' name='button' value=''><i class='far fa-trash-alt'></i></button>" +
      "<input class='input-label' type='text' name='itemName' value='' placeholder='Enter a name'></input>" +
      "<input class='planned-label' name='planned' value='' placeholder='$0.00' oninput='setTwoNumberDecimal(this)' onclick='this.select()'></input>" +
      "<span class='span-rem'>$0.00</span>" +
  "</div>";
  $(el).before(item);
}

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

  function convertCat(el, name) {
    $(el).before("<span class='header-column'>" + name +"</div>");
    $(el).remove();
  }



});

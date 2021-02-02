var x = document.getElementsByClass("item");



for (var i = 0; i < x.length(); i++) {
  x[i].addEventListener("onmouseover", dothis);
}

function dothis() {
  alert("I am a box");
  document.getElementsByClass("btndel").style.display = "none";
}

function setTwoNumberDecimal(el) {
  el.value = parseFloat(el.value).toFixed(2);
}

var x = document.getElementsByClass("item-label");


for (var i = 0; i < x.length(); i++) {
  x[i].addEventListener("onfocus", dothis);
}

function dothis() {
  document.getElementsByClass("btndel").style.display = "inline";
}

const tx = document.getElementById("input")
tx.setAttribute("style", "height:" + (tx.scrollHeight) + "px;overflow-y:hidden;");

tx.addEventListener("input", OnInput, false);
tx.addEventListener("click", OnInput, false);

function OnInput() {
  this.style.height = 'auto';
  this.style.height = (this.scrollHeight) + "px";
}
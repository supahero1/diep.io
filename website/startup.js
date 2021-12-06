"use strict";
(function() {
  const version = "1.0.0";
  const tpac = "tpac-" + version;
  let acceptance = localStorage.getItem(tpac) ? +localStorage.getItem(tpac) : 0;
  const site = document.getElementById("site");
  const acceptance_overlay = document.getElementById("acceptance");
  const acceptance_button = document.getElementById("accept-btn");
  if(!acceptance) {
    acceptance_overlay.style.display = "block";
    site.style.display = "none";
    acceptance_button.onclick = function() {
      acceptance = 1;
      localStorage.setItem(tpac, acceptance ? 1 : 0);
      acceptance_overlay.setAttribute("style", "display:none !important");
      site.style.display = "block";
    };
  }
  window.onload = function() {
    document.body.removeChild(document.getElementById("startup-spinner"));
    site.setAttribute("style", "display:block !important");
  };
})();
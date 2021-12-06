"use strict";
(function() {
  const host = "https://shadam.xyz/diep/count";
  //const host = "http://localhost/diep/count";
  let socket;
  
  let player_counts = {};
  let end = new Date().getTime();
  let start = end - 1000 * 60 * 60 * 24;
  function get_date(time) {
    return (new Date(time)).toLocaleDateString("en-US", { hour: "numeric", minute: "numeric" });
  }
  end = get_date(end);
  start = get_date(start);
  
  const start_el = document.getElementById("timestamp-start");
  start_el.value = start;
  start_el.oninput = start_el.onchange = function() {
    start = new Date(this.value);
  };
  const end_el = document.getElementById("timestamp-end");
  end_el.value = end;
  end_el.oninput = end_el.onchange = function() {
    end = new Date(this.value);
  };
  
  document.getElementById("timestamp-search").onclick = search;
  
  let spinner;
  function get_spinner() {
    spinner = document.getElementById("spinner");
  };
  const new_spinner = document.createElement("div");
  new_spinner.className = "d-flex justify-content-center";
  new_spinner.id = "spinner";
  new_spinner.innerHTML = "<div class=\"spinner-border text-info m-5\"></div>";
  
  const no_results = document.getElementById("no_results");
  function maybe_show_warning() {
    if(!player_counts.a || player_counts.a.length == 0) {
      no_results.style.display = "block";
    } else {
      no_results.style.display = "none";
    }
  }
  
  const chart = document.getElementById("chart");
  function show_chart() {
    chart.style.display = "block";
  }
  function hide_chart() {
    chart.style.display = "none";
  }
  
  Chart.defaults.color = "#FFF";
  const chart_canvas = document.getElementById("chart_canvas");
  let chart_instance;
  function draw_chart() {
    if(!player_counts.a || player_counts.a.length == 0) return;
    let max = 0;
    player_counts.a.forEach(r => {
      if(r[1] > max) {
        max = r[1];
      }
    });
    chart_instance = new Chart(chart_canvas, {
      type: "line",
      data: {
        labels: player_counts.a.map(r => get_date(r[0])),
        datasets: [
          {
            label: "Player count",
            data: player_counts.a.map(r => r[1]),
            backgroundColor: "#FFF",
            borderColor: "rgb(255, 99, 132)",
            color: "#FFF",
            fill: false,
            cubicInterpolationMode: 'monotone',
            tension: 0.4
          }
        ]
      },
      options: {
        responsive: true,
        interaction: {
          intersect: false
        },
        scales: {
          x: {
            display: true,
            title: {
              display: true,
              text: "Date"
            },
            grid: {
              color: "#FFFFFF40"
            }
          },
          y: {
            display: true,
            title: {
              display: true,
              text: "Players"
            },
            min: 0,
            grid: {
              color: "#FFFFFF40"
            }
          }
        }
      }
    });
  }
  function clear_chart() {
    if(chart_instance) {
      chart_instance.destroy();
    }
  }
  
  function search() {
    clear_chart();
    chart.parentElement.insertBefore(new_spinner, chart);
    get_spinner();
    hide_chart();
    
    const xhr = new XMLHttpRequest();
    xhr.open("GET", host);
    xhr.setRequestHeader("X-start", start.toString());
    xhr.setRequestHeader("X-end", end.toString());
    xhr.send();
    xhr.onload = function() {
      player_counts = JSON.parse(this.responseText);
      show_chart();
      draw_chart();
      spinner.parentElement.removeChild(spinner);
      maybe_show_warning();
    };
  }
  search();
})();
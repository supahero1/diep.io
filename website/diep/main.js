"use strict";
(function() {
  let servers = {};
  const host = "wss://shadam.xyz/diep/lb";
  //const host = "ws://localhost/diep/lb";
  let socket;
  
  let settings;
  if(localStorage.settings) {
    try {
      settings = JSON.parse(localStorage.settings);
      if(!settings.colors) {
        settings.colors = {
          shard: "#6f42c1",
          text: "white"
        };
      }
      if(!settings.f_miami) {
        settings.f_miami = settings.f_use;
        delete settings.f_use;
      }
      if(!settings.f_la) {
        settings.f_la = settings.f_usw;
        delete settings.f_usw;
      }
      save();
    } catch(e) {
      localStorage.removeItem("settings");
    }
  }
  if(!settings) {
    settings = {
      sort_mask: [],
      
      colors: {
        shard: "#6f42c1",
        text: "white"
      },
      
      f_ffa: 1,
      f_2tdm: 1,
      f_4tdm: 1,
      f_sbx: 1,
      f_maze: 1,
      f_tag: 1,
      f_dom: 1,
      f_surv: 1,
      
      f_eu: 1,
      f_miami: 1,
      f_la: 1,
      f_sg: 1,
      f_syd: 1
    };
  }
  function save() {
    localStorage.setItem("settings", JSON.stringify(settings));
  }
  
  function minutes(ms) {
    return ms * 60000;
  }
  
  const color_set = {
    blue: "#0d6efd",
    indigo: "#6610f2",
    purple: "#6f42c1",
    pink: "#d63384",
    red: "#dc3545",
    orange: "#fd7e14",
    yellow: "#ffc107",
    green: "#198754",
    teal: "#20c997",
    cyan: "#0dcaf0",
    gray: "#adb5bd",
    light: "#f8f9fa",
    dark: "#212529"
  };
  
  let server_colors = settings.colors;
  Array.from(document.querySelectorAll("button[id^='shard-color-']")).forEach(r => {
    r.onclick = function() {
      server_colors.shard = color_set[r.id.match(/shard-color-(.*)/)[1]];
      settings.colors = server_colors;
      save();
      Array.from(document.querySelectorAll("div.container.shadow-lg.rounded.p-2.my-3")).forEach(g => g.style.background = server_colors.shard);
    };
  });
  Array.from(document.querySelectorAll("button[id^='text-color-']")).forEach(r => {
    r.onclick = function() {
      server_colors.text = color_set[r.id.match(/text-color-(.*)/)[1]];
      settings.colors = server_colors;
      save();
      Array.from(document.querySelectorAll("div.container.shadow-lg.rounded.p-2.my-3")).forEach(g => g.style.color = server_colors.text);
    };
  });
  
  let current_sort;
  let sort_mask = settings.sort_mask;
  function add_sort(id1, id2) {
    del_sort(id1, 1);
    sort_mask[sort_mask.length] = [id1, id2];
    settings.sort_mask = sort_mask;
    save();
    sort_servers();
  }
  function del_sort(id, sort_override=0) {
    let idx = -1;
    let i = 0;
    for(const mask of sort_mask) {
      if(mask[0] == id) {
        idx = i;
        break;
      }
      ++i;
    }
    if(idx != -1) {
      sort_mask.splice(idx, 1);
      if(sort_mask.length != 0 && !sort_override) {
        settings.sort_mask = sort_mask;
        save();
        sort_servers();
      }
    }
  }
  function pre_sort_servers() {
    let arr = Object.entries(servers);
    for(const [which, mask] of sort_mask) {
      switch(which) {
        case 0: {
          arr = arr.sort((a, b) => get_gamemode(a[1].gamemode).localeCompare(get_gamemode(b[1].gamemode)) * mask);
          break;
        }
        case 1: {
          arr = arr.sort((a, b) => get_region(a[1].region).localeCompare(get_region(b[1].region)) * mask);
          break;
        }
        case 2: {
          arr = arr.sort((a, b) => {
            if(!a[1].scoreboard) {
              if(b[1].scoreboard) {
                return 1;
              } else {
                return 0;
              }
            } else {
              if(b[1].scoreboard) {
                return (a[1].scoreboard.uptime - b[1].scoreboard.uptime) * mask;
              } else {
                return -1;
              }
            }
          });
          break;
        }
        case 3: {
          arr = arr.sort((a, b) => {
            if(!a[1].scoreboard || a[1].scoreboard.entries.length == 0) {
              if(b[1].scoreboard && b[1].scoreboard.entries.length > 0) {
                return 1;
              } else {
                return 0;
              }
            } else {
              if(b[1].scoreboard && b[1].scoreboard.entries.length > 0) {
                return (a[1].scoreboard.entries[0].score - b[1].scoreboard.entries[0].score) * mask;
              } else {
                return -1;
              }
            }
          });
          break;
        }
      }
    }
    return arr;
  }
  function sort_servers() {
    const arr = pre_sort_servers();
    current_sort = arr;
    for(const id in servers) {
      if(document.getElementById(`server-${id}`) != null) {
        delete_server(id);
      }
    }
    for(const server of arr) {
      if(fits_filters(server[0])) {
        create_server(server[0]);
      }
    }
  }
  
  let active_elements = {
    "gamemodes": document.getElementById("sort-gamemodes-none"),
    "regions": document.getElementById("sort-regions-none"),
    "uptime": document.getElementById("sort-uptime-none"),
    "score": document.getElementById("sort-score-none")
  };
  function toggle_active_element(name, el) {
    active_elements[name].classList.remove("active");
    el.classList.add("active");
    active_elements[name] = el;
  }
  for(const mask of sort_mask) {
    switch(mask[0]) {
      case 0: {
        toggle_active_element("gamemodes", document.getElementById("sort-gamemodes-" + ["z", "", "a"][mask[1] + 1]));
        break;
      }
      case 1: {
        toggle_active_element("regions", document.getElementById("sort-regions-" + ["z", "", "a"][mask[1] + 1]));
        break;
      }
      case 2: {
        toggle_active_element("uptime", document.getElementById("sort-uptime-" + ["a", "", "z"][mask[1] + 1]));
        break;
      }
      case 3: {
        toggle_active_element("score", document.getElementById("sort-score-" + ["a", "", "z"][mask[1] + 1]));
        break;
      }
    }
  }
  
  const wants_gamemodes = {
    "ffa": settings.f_ffa,
    "2tdm": settings.f_2tdm,
    "4tdm": settings.f_4tdm,
    "sbx": settings.f_sbx,
    "maze": settings.f_maze,
    "tag": settings.f_tag,
    "dom": settings.f_dom,
    "surv": settings.f_surv
  };
  for(const gamemode in wants_gamemodes) {
    const el = document.getElementById(`filter-${gamemode}`);
    el.checked = wants_gamemodes[gamemode];
    document.getElementById(`filter-${gamemode}-`).onclick = function() {
      if(wants_gamemodes[gamemode]) {
        el.checked = false;
      } else {
        el.checked = true;
      }
      wants_gamemodes[gamemode] = el.checked;
      settings["f_" + gamemode] = el.checked;
      save();
      filter();
    };
  }
  document.getElementById("filter-gamemode-no").onclick = function() {
    for(const gamemode in wants_gamemodes) {
      wants_gamemodes[gamemode] = 1;
      settings["f_" + gamemode] = 1;
      document.getElementById(`filter-${gamemode}`).checked = true;
    }
    save();
    filter();
  };
  document.getElementById("filter-gamemode-yes").onclick = function() {
    for(const gamemode in wants_gamemodes) {
      wants_gamemodes[gamemode] = 0;
      settings["f_" + gamemode] = 0;
      document.getElementById(`filter-${gamemode}`).checked = false;
    }
    save();
    filter();
  };
  
  document.getElementById("sort-gamemodes-a").onclick = function() {
    toggle_active_element("gamemodes", this);
    add_sort(0, 1);
  };
  document.getElementById("sort-gamemodes-z").onclick = function() {
    toggle_active_element("gamemodes", this);
    add_sort(0, -1);
  };
  document.getElementById("sort-gamemodes-none").onclick = function() {
    toggle_active_element("gamemodes", this);
    del_sort(0);
  };
  
  const wants_regions = {
    "eu": settings.f_eu,
    "miami": settings.f_miami,
    "la": settings.f_la,
    "sg": settings.f_sg,
    "syd": settings.f_syd
  };
  for(const region in wants_regions) {
    const el = document.getElementById(`filter-${region}`);
    el.checked = wants_regions[region];
    document.getElementById(`filter-${region}-`).onclick = function(e) {
      if(wants_regions[region]) {
        el.checked = false;
      } else {
        el.checked = true;
      }
      wants_regions[region] = el.checked;
      settings["f_" + region] = el.checked;
      save();
      filter();
    };
  }
  document.getElementById("filter-region-no").onclick = function() {
    for(const region in wants_regions) {
      wants_regions[region] = 1;
      settings["f_" + region] = 1;
      document.getElementById(`filter-${region}`).checked = true;
    }
    save();
    filter();
  };
  document.getElementById("filter-region-yes").onclick = function() {
    for(const region in wants_regions) {
      wants_regions[region] = 0;
      settings["f_" + region] = 0;
      document.getElementById(`filter-${region}`).checked = false;
    }
    save();
    filter();
  };
  
  document.getElementById("sort-regions-a").onclick = function() {
    toggle_active_element("regions", this);
    add_sort(1, 1);
  };
  document.getElementById("sort-regions-z").onclick = function() {
    toggle_active_element("regions", this);
    add_sort(1, -1);
  };
  document.getElementById("sort-regions-none").onclick = function() {
    toggle_active_element("regions", this);
    del_sort(1);
  };
  
  document.getElementById("sort-uptime-a").onclick = function() {
    toggle_active_element("uptime", this);
    add_sort(2, -1);
  };
  document.getElementById("sort-uptime-z").onclick = function() {
    toggle_active_element("uptime", this);
    add_sort(2, 1);
  };
  document.getElementById("sort-uptime-none").onclick = function() {
    toggle_active_element("uptime", this);
    del_sort(2);
  };
  
  document.getElementById("sort-score-a").onclick = function() {
    toggle_active_element("score", this);
    add_sort(3, -1);
  };
  document.getElementById("sort-score-z").onclick = function() {
    toggle_active_element("score", this);
    add_sort(3, 1);
  };
  document.getElementById("sort-score-none").onclick = function() {
    toggle_active_element("score", this);
    del_sort(3);
  };
  
  Array.from(document.getElementsByClassName("diep-sort-reset")).forEach(r => {
    r.onclick = function() {
      sort_mask = [];
      toggle_active_element("gamemodes", document.getElementById("sort-gamemodes-none"));
      toggle_active_element("regions", document.getElementById("sort-regions-none"));
      toggle_active_element("uptime", document.getElementById("sort-uptime-none"));
      toggle_active_element("score", document.getElementById("sort-score-none"));
      current_sort = pre_sort_servers();
      settings.sort_mask = sort_mask;
      save();
    };
  });
  
  let name_search = "";
  const name_search_input = document.getElementById("name-search");
  name_search_input.oninput = name_search_input.onchange = function() {
    name_search = this.value.toLowerCase();
    sort_servers();
    maybe_better_show_warning();
  };
  
  let spinner;
  function get_spinner() {
    spinner = document.getElementById("spinner");
  };
  get_spinner();
  const new_spinner = document.createElement("div");
  new_spinner.className = "d-flex justify-content-center";
  new_spinner.id = "spinner";
  new_spinner.innerHTML = "<div class=\"spinner-border text-info m-5\"></div>";
  
  const server_list = document.getElementById("server_list");
  function show_servers() {
    server_list.style.display = "block";
  }
  function hide_servers() {
    server_list.style.display = "none";
  }
  const server_error = document.getElementById("server_error");
  function maybe_show_error() {
    if(Object.keys(servers).length == 0) {
      server_error.style.display = "block";
    } else {
      server_error.style.display = "none";
    }
  }
  const server_warning = document.getElementById("server_warning");
  function maybe_show_warning(ok) {
    if(server_error.style.display != "none") {
      return;
    }
    if(!ok) {
      server_warning.style.display = "block";
    } else {
      server_warning.style.display = "none";
    }
  }
  
  function id_to_link(id) {
    return id.split("").map(r => r.charCodeAt().toString(16).padStart(2, "0").split("").reverse().join("")).join("");
  }
  
  function get_gamemode(id) {
    return ["FFA", "SBX", "Tag", "2TDM", "4TDM", "Maze", "DOM", "Survival"][id];
  }
  
  function get_filter_gamemode(id) {
    return ["ffa", "sbx", "tag", "2tdm", "4tdm", "maze", "dom", "surv"][id];
  }
  
  function get_long_gamemode(id) {
    return ["FFA", "Sandbox", "Tag", "2Teams", "4Teams", "Maze", "Domination", "Survival"][id];
  }
  
  function get_region(id) {
    return ["EU", "Miami", "LA", "SG", "SYD"][id];
  }
  
  function get_long_region(id) {
    return ["Amsterdam", "Miami", "Los Angeles", "Singapore", "Sydney"][id];
  }
  
  function get_time(time) {
    const times = [];
    if(time >= 6048e5) {
      times[times.length] = `${(time / 6048e5) | 0}w`;
      time -= ((time / 6048e5) | 0) * 6048e5;
    }
    if(times.length != 1 && time >= 864e5) {
      times[times.length] = `${(time / 864e5) | 0}d`;
      time -= ((time / 864e5) | 0) * 864e5;
    }
    if(times.length != 1 && time >= 36e5) {
      times[times.length] = `${(time / 36e5) | 0}h`;
      time -= ((time / 36e5) | 0) * 36e5;
    }
    if(times.length != 1 && time >= 6e4) {
      times[times.length] = `${(time / 6e4) | 0}min`;
      time -= ((time / 6e4) | 0) * 6e4;
    }
    if(times.length != 1 && time >= 1e3) {
      times[times.length] = `${(time / 1e3) | 0}s`;
      time -= ((time / 1e3) | 0) * 1e3;
    } else if(times.length != 1 && time > 0) {
      times[times.length] = `${time}ms`;
    }
    if(times.length > 1) {
      return times.slice(0, times.length - 1).join(", ") + ` & ${times[times.length - 1]}`;
    } else if(times.length == 1) {
      return times[0];
    } else {
      return "0s";
    }
  }
  
  function get_long_time(time) {
    const times = [];
    if(time >= 6048e5) {
      times[times.length] = `${(time / 6048e5) | 0} week${((time / 6048e5) | 0) === 1 ? "" : "s"}`;
      time -= ((time / 6048e5) | 0) * 6048e5;
    }
    if(time >= 864e5) {
      times[times.length] = `${(time / 864e5) | 0} day${((time / 864e5) | 0) === 1 ? "" : "s"}`;
      time -= ((time / 864e5) | 0) * 864e5;
    }
    if(time >= 36e5) {
      times[times.length] = `${(time / 36e5) | 0} hour${((time / 36e5) | 0) === 1 ? "" : "s"}`;
      time -= ((time / 36e5) | 0) * 36e5;
    }
    if(time >= 6e4) {
      times[times.length] = `${(time / 6e4) | 0} minute${((time / 6e4) | 0) === 1 ? "" : "s"}`;
      time -= ((time / 6e4) | 0) * 6e4;
    }
    if(time >= 1e3) {
      times[times.length] = `${(time / 1e3) | 0} second${((time / 1e3) | 0) === 1 ? "" : "s"}`;
      time -= ((time / 1e3) | 0) * 1e3;
    } else if(times.length == 0 && time > 0) {
      times[times.length] = `${time} millisecond${time === 1 ? "" : "s"}`;
    }
    if(times.length > 1) {
      return times.slice(0, times.length - 1).join(", ") + ` and ${times[times.length - 1]}`;
    } else if(times.length == 1) {
      return times[0];
    } else {
      return "0 seconds";
    }
  }
  
  function get_score(n) {
    if(n >= 1e6) {
      return `${(n / 1e6).toFixed(2)}m`;
    } else if(n >= 1e3) {
      return `${(n / 1e3).toFixed(2)}k`;
    } else {
      return n;
    }
  }
  
  function get_color_name(id) {
    return ["", "", "", "Blue", "Red", "Purple", "Green", "", "", "", "", "", "", ""][id];
  }
  
  function get_color_circle(id) {
    return ["⚪", "⚪", "⚪", "🔵", "🔴", "🟣", "🟢", "⚪", "⚪", "⚪", "⚪", "⚪", "⚪", "⚪"][id];
  }
  
  function get_tank(id) {
    if(id == -1) {
      return "-";
    }
    return [
      "Tank",
      "Twin",
      "Triplet",
      "Triple Shot",
      "Quad Tank",
      "Octo Tank",
      "Sniper",
      "Machine Gun",
      "Flank Guard",
      "Tri-Angle",
      "Destroyer",
      "Overseer",
      "Overlord",
      "Twin-Flank",
      "Penta Shot",
      "Assassin",
      "Arena Closer",
      "Necromancer",
      "Triple Twin",
      "Hunter",
      "Gunner",
      "Stalker",
      "Ranger",
      "Booster",
      "Fighter",
      "Hybrid",
      "Manager",
      "Mothership",
      "Predator",
      "Sprayer",
      "",
      "Trapper",
      "Gunner Trapper",
      "Overtrapper",
      "Mega Trapper",
      "Tri-Trapper",
      "Smasher",
      "",
      "Landmine",
      "Auto Gunner",
      "Auto 5",
      "Auto 3",
      "Spread Shot",
      "Streamliner",
      "Auto Trapper",
      "",
      "",
      "",
      "Battleship",
      "Annihilator",
      "Auto Smasher",
      "Spike",
      "Factory",
      "Ball",
      "Skimmer",
      "Rocketeer"
    ][id];
  }
  
  function escapeHTML(a) {
    return a.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
  }
  
  function fits_filters(id) {
    if(!wants_gamemodes[get_filter_gamemode(servers[id].gamemode)]) return 0;
    if(!wants_regions[get_region(servers[id].region).toLowerCase()]) return 0;
    if(name_search != "" && !servers[id].scoreboard) return 0;
    if(name_search != "" && servers[id].scoreboard.entries.findIndex(r => r.name.toLowerCase().includes(name_search)) == -1) return 0;
    return 1;
  }
  
  function filter() {
    let ok = false;
    for(const id in servers) {
      if(fits_filters(id)) {
        ok = true;
        if(document.getElementById(`server-${id}`) == null) {
          create_server(id);
        }
      } else if(document.getElementById(`server-${id}`) != null) {
        delete_server(id);
      }
    }
    maybe_show_warning(ok);
  }
  
  function maybe_better_show_warning() {
    let ok = false;
    for(const id in servers) {
      if(fits_filters(id)) {
        ok = true;
      }
    }
    maybe_show_warning(ok);
  }
  
  function generate_scoreboard_html_raw(id) {
    let str = `
    <thead>
      <tr>
        <th scope="col">#</th>
        <th scope="col">Color</th>
        <th scope="col">Score</th>
        <th scope="col">Name</th>
        <th scope="col">Tank</th>
      </tr>
    </thread>
    <tbody>
    `;
    let i = 1;
    for(const entry of servers[id].scoreboard.entries) {
      str += `
      <tr>
        <th scope="row">${i++}</th>
        <td>${get_color_circle(entry.color)} ${get_color_name(entry.color)}</td>
        <td>${get_score(entry.score)}</td>
        <td>${escapeHTML(entry.name)}</td>
        <td>${get_tank(entry.tank)}</td>
      </tr>
      `;
    }
    str += "</tbody>";
    return str;
  }
  
  function generate_scoreboard_html(id) {
    if(!servers[id].scoreboard || servers[id].scoreboard.entries.length == 0) {
      return "";
    }
    return `<table class="table table-dark table-hover" id="server-${id}-6">${generate_scoreboard_html_raw(id)}</table>`;
  }
  
  function server_closing_state(id) {
    const time = new Date().getTime();
    if(time - servers[id].api_at >= minutes(5)) {
      if(servers[id].conn_at != -1 && time - servers[id].conn_at >= minutes(4)) {
        return 2;
      } else {
        return 1;
      }
    } else {
      return 0;
    }
  }
  
  function generate_join_button_raw(id) {
    let badge = "";
    switch(servers[id].closing_state) {
      case 0: {
        badge = "Join";
        break;
      }
      case 1: {
        badge = `<span class="badge bg-warning">CLOSING</span>`;
        break;
      }
      case 2: {
        return `<a class="btn btn-dark disabled"><span class="badge bg-danger">CLOSED</span></a>`
      }
    }
    if(!servers[id].parties || Object.keys(servers[id].parties).length == 0) {
      return `<a class="btn btn-dark" href="https://diep.io/#${id_to_link(id)}" target="_blank" rel="noopener noreferrer">${badge}</a>`;
    }
    let i = 1;
    return `
    <div class="btn-group">
      <a class="btn btn-dark" href="https://diep.io/#${id_to_link(id)}" target="_blank" rel="noopener noreferrer">${badge}</a>
      <button type="button" class="btn btn-dark text-light dropdown-toggle dropdown-toggle-split" data-bs-toggle="dropdown" data-bs-auto-close="outside"></button>
      <ul class="dropdown-menu dropdown-menu-dark">
        <li><h6 class="dropdown-header">Parties</h6></li>
        <li>
          ${Object.entries(servers[id].parties).map(r => `<a class="dropdown-item" href="https://diep.io/#${id_to_link(id)}00${r[0]}" target="_blank" rel="noopener noreferrer">Link ${i++}</a>`).join("")}
        </li>
      </ul>
    </div>
    `;
  }
  
  function generate_join_button(id) {
    return `<div class="col" id="server-${id}-join">${generate_join_button_raw(id)}</div>`;
  }
  
  function create_server_innerhtml(id) {
    let uptime;
    let long_uptime;
    const time = new Date().getTime();
    if(!servers[id].scoreboard) {
      uptime = "-";
      long_uptime = "-";
    } else if(servers[id].conn_at != -1) {
      uptime = get_time(servers[id].scoreboard.uptime * 40 + time - servers[id].conn_at);
      long_uptime = get_long_time(servers[id].scoreboard.uptime * 40 + time - servers[id].conn_at);
    } else {
      uptime = get_time(servers[id].scoreboard.uptime * 40);
      long_uptime = get_long_time(servers[id].scoreboard.uptime * 40);
    }
    return `
    <div class="row">
      ${generate_join_button(id)}
      <div class="col d-flex justify-content-center align-items-end">
        <h4>${get_gamemode(servers[id].gamemode)}</h4>
      </div>
      <div class="col d-flex justify-content-center align-items-end">
        <h4>${get_region(servers[id].region)}</h4>
      </div>
      <div class="col d-flex justify-content-center align-items-end">
        <h4 id="server-${id}-0">${uptime}</h4>
      </div>
      <div class="col d-flex justify-content-center align-items-end">
        <h4 id="server-${id}-1">${servers[id].scoreboard ? servers[id].scoreboard.entries.length > 0 ? get_score(servers[id].scoreboard.entries[0].score) : "-" : "-"}</h4>
      </div>
      <div class="col d-flex justify-content-end">
        <a class="btn btn-dark" data-bs-toggle="collapse" href="#collapse-server-${id}" aria-expanded="false" aria-controls="#collapse-server-${id}">Show more</a>
      </div>
    </div>
    <div class="collapse" id="collapse-server-${id}">
      <div class="table-responsive p-3 pt-4 mt-2 rounded bg-dark text-light">
        <div class="d-flex flex-wrap" id="server-${id}-scoreboard-parent">
          <table class="table table-dark">
            <thead>
              <tr>
                <th scope="col">Gamemode</th>
                <th scope="col">Region</th>
                <th scope="col">Uptime</th>
                <th scope="col">Player count (game-wide)</th>
                <th scope="col">Last seen</th>
                <th scope="col">Last connected</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>${get_long_gamemode(servers[id].gamemode)}</td>
                <td>${get_long_region(servers[id].region)}</td>
                <td id="server-${id}-2">${long_uptime}</td>
                <td id="server-${id}-3">${servers[id].player_count && servers[id].player_count != -1 ? servers[id].player_count : "-"}</td>
                <td id="server-${id}-4">${get_long_time(time - servers[id].api_at) + " ago"}</td>
                <td id="server-${id}-5">${servers[id].conn_at != -1 ? get_long_time(time - servers[id].conn_at) + " ago" : "-"}</td>
              </tr>
            </tbody>
          </table>
          ${generate_scoreboard_html(id)}
        </div>
      </div>
    </div>
    `;
  }
  
  function create_server_container(id) {
    servers[id].closing_state = server_closing_state(id);
    const server = document.createElement("div");
    server.className = "container shadow-lg rounded p-2 my-3";
    server.style.background = server_colors.shard;
    server.style.color = server_colors.text;
    server.id = `server-${id}`;
    server.innerHTML = create_server_innerhtml(id);
    return server;
  }
  
  function update_server_container(id) {
    let uptime;
    let long_uptime;
    if(!servers[id].scoreboard) {
      uptime = "-";
      long_uptime = "-";
    } else if(servers[id].conn_at != -1) {
      uptime = get_time(servers[id].scoreboard.uptime * 40 + new Date().getTime() - servers[id].conn_at);
      long_uptime = get_long_time(servers[id].scoreboard.uptime * 40 + new Date().getTime() - servers[id].conn_at);
    } else {
      uptime = get_time(servers[id].scoreboard.uptime * 40);
      long_uptime = get_long_time(servers[id].scoreboard.uptime * 40);
    }
    servers[id]._0.innerHTML = uptime;
    servers[id]._1.innerHTML = servers[id].scoreboard ? servers[id].scoreboard.entries.length > 0 ? get_score(servers[id].scoreboard.entries[0].score) : "-" : "-";
    servers[id]._2.innerHTML = long_uptime;
    servers[id]._3.innerHTML = servers[id].player_count ? servers[id].player_count : "-";
    servers[id]._4.innerHTML = get_long_time(new Date().getTime() - servers[id].api_at) + " ago";
    servers[id]._5.innerHTML = servers[id].conn_at != -1 ? get_long_time(new Date().getTime() - servers[id].conn_at) + " ago" : "-";
    if(servers[id].scoreboard && servers[id].scoreboard.entries.length != 0) {
      let el = document.getElementById(`server-${id}-6`);
      if(el != null) {
        el.innerHTML = generate_scoreboard_html_raw(id);
      } else {
        el = document.createElement("table");
        el.id = `server-${id}-6`;
        el.className = "table table-dark table-hover";
        el.innerHTML = generate_scoreboard_html_raw(id);
        document.getElementById(`server-${id}-scoreboard-parent`).appendChild(el);
      }
    }
    const closing_state = server_closing_state(id);
    if(servers[id].closing_state != closing_state) {
      servers[id].closing_state = closing_state;
      document.getElementById(`server-${id}-join`).innerHTML = generate_join_button_raw(id);
    }
  }
  
  function update_server_container_light(id) {
    let uptime;
    let long_uptime;
    const time = new Date().getTime();
    if(!servers[id].scoreboard) {
      uptime = "-";
      long_uptime = "-";
    } else if(servers[id].conn_at != -1) {
      uptime = get_time(servers[id].scoreboard.uptime * 40 + time - servers[id].conn_at);
      long_uptime = get_long_time(servers[id].scoreboard.uptime * 40 + time - servers[id].conn_at);
    } else {
      uptime = get_time(servers[id].scoreboard.uptime * 40);
      long_uptime = get_long_time(servers[id].scoreboard.uptime * 40);
    }
    servers[id]._0.innerHTML = uptime;
    servers[id]._2.innerHTML = long_uptime;
    servers[id]._4.innerHTML = get_long_time(time - servers[id].api_at) + " ago";
    servers[id]._5.innerHTML = servers[id].conn_at != -1 ? get_long_time(time - servers[id].conn_at) + " ago" : "-";
    const closing_state = server_closing_state(id);
    if(servers[id].closing_state != closing_state) {
      servers[id].closing_state = closing_state;
      document.getElementById(`server-${id}-join`).innerHTML = generate_join_button_raw(id);
    }
  }
  
  let once = false;
  
  function connect() {
    socket = new WebSocket(host);
    socket.binaryType = "blob";
    socket.onopen = function() {
      once = true;
      spinner.parentElement.removeChild(spinner);
      show_servers();
    };
    socket.onclose = function() {
      if(once) {
        once = false;
        hide_servers();
        server_list.parentElement.insertBefore(new_spinner, server_list);
        get_spinner();
        connect();
      } else {
        setTimeout(connect, 1000);
      }
    };
    socket.onmessage = function({ data }) {
      data = JSON.parse(data);
      if(data.a == "") {
        for(const id in servers) {
          delete_server_full(id);
        }
        const arr = Object.entries(data.b);
        while(arr.length > 0) {
          const idx = Math.floor(Math.random() * arr.length);
          const e = arr[idx];
          servers[e[0]] = e[1];
          create_server(e[0]);
          arr.splice(idx, 1);
        }
        sort_servers();
      } else {
        if(!data.b) {
          delete_server_full(data.a);
        } else {
          if(servers[data.a] == null) {
            servers[data.a] = data.b;
            create_server(data.a);
          } else {
            for(const i in data.b) {
              servers[data.a][i] = data.b[i];
            }
            update_server(data.a);
          }
        }
      }
      maybe_show_error();
      maybe_better_show_warning();
    };
  }
  connect();
  
  function pick_server_placement_raw(id) {
    let idx;
    for(let i = 0; i < current_sort.length; ++i) {
      if(current_sort[i][0] == id) {
        idx = i;
        break;
      }
    }
    for(let i = idx + 1; i < current_sort.length; ++i) {
      const el = document.getElementById(`server-${current_sort[i][0]}`);
      if(el != null) {
        server_list.insertBefore(create_server_container(id), el);
        cache_methods(id);
        return;
      }
    }
    server_list.insertBefore(create_server_container(id), server_error);
    cache_methods(id);
  }
  
  function pick_server_placement(id) {
    const arr = pre_sort_servers();
    current_sort = arr;
    pick_server_placement_raw(id);
  }
  
  function create_server(id) {
    const server = servers[id];
    
    if(fits_filters(id)) {
      if(sort_mask.length == 0) {
        server_list.insertBefore(create_server_container(id), server_error);
        cache_methods(id);
      } else {
        pick_server_placement(id);
      }
    }
  }
  
  function update_server(id) {
    const server = servers[id];
    
    const server_element = document.getElementById(`server-${id}`);
    if(fits_filters(id)) {
      if(server_element) {
        if(sort_mask.length != 0) {
          const arr = pre_sort_servers();
          for(let i = 0; i < arr.length; ++i) {
            if(arr[i][0] == id) {
              if(current_sort[i][0] == id) {
                update_server_container(id);
              } else {
                server_list.removeChild(server_element);
                current_sort = arr;
                pick_server_placement_raw(id);
              }
              break;
            }
          }
        } else {
          update_server_container(id);
        }
      } else {
        create_server(id);
      }
    } else if(server_element) {
      server_element.parentElement.removeChild(server_element);
    }
  }
  
  function delete_server(id) {
    const server = servers[id];
    const el = document.getElementById(`server-${id}`);
    if(el) {
      server_list.removeChild(el);
    }
  }
  
  function delete_server_full(id) {
    delete_server(id);
    delete servers[id];
  }
  
  function cache_methods(id) {
    servers[id]._0 = document.getElementById(`server-${id}-0`);
    servers[id]._1 = document.getElementById(`server-${id}-1`);
    servers[id]._2 = document.getElementById(`server-${id}-2`);
    servers[id]._3 = document.getElementById(`server-${id}-3`);
    servers[id]._4 = document.getElementById(`server-${id}-4`);
    servers[id]._5 = document.getElementById(`server-${id}-5`);
  }
  
  setInterval(function() {
    for(const id in servers) {
      if(fits_filters(id)) {
        update_server_container_light(id);
      }
    }
  }, 1000);
})();
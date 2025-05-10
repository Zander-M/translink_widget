const { loadConfig } = require('./config');
const { fetchNextBus, fetchStaticGTFS } = require('./gtfs');


const themes = {
  neon: {
    background: '#1a0033',        // Deep purple with vibrancy
    route: '#00ffe0',             // Electric cyan
    stop: '#ff66cc',              // Hot pink
    time: '#adff2f',              // Lime yellow-green
    fontFamily: 'Segoe UI, sans-serif',
    color: 'ivory',
    padding: '16px',
    borderRadius: '12px'
  },
  cyber: {
    background: '#121212',
    route: '#00d1ff',
    stop: '#999999',
    time: '#faff00',
    fontFamily: 'Segoe UI',
    color: 'ivory'
  },
  // add more...
};

async function init() {
  const config = loadConfig();
  applyTheme(config.theme)

  document.getElementById('bus-info').innerText = "Loading GTFS...";
  await fetchStaticGTFS();
  updateDisplay();
}

async function updateDisplay() {
  const info = await fetchNextBus();
  if (info.is_bus_coming){ 
  document.getElementById('bus-info').innerHTML =`
    <div class="route">🚌 ${info.route}</div>
    <div class="stop">📍 ${info.stop}</div>
    <div class="time">🕒 ${info.minutes}</div>
  `;
  } else {
    document.getElementById('bus-info').innerText = "No bus coming..." 
  }
}

function applyTheme(themeName){
  const theme = themes[themeName] || themes.neon;
  console.log(theme.background)
  document.body.style.backgroundColor = theme.background;
  document.body.style.fontFamily = theme.fontFamily;
  document.body.style.color = theme.color;
  const style = document.createElement('style');
  style.textContent = `
    .route { color: ${theme.route}; font-weight: bold; }
    .stop  { color: ${theme.stop}; }
    .time  { color: ${theme.time}; font-weight: bold;}
  `;
  document.head.appendChild(style);
}

init();
setInterval(updateDisplay, 60000);

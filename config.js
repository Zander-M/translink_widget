const fs = require('fs');
const path = require('path');

const CONFIG_PATH = path.join(__dirname, 'settings.json');

function loadConfig() {
  if (fs.existsSync(CONFIG_PATH)) {
    console.log("load config")
    return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
  } else {
    return { apiKey: '', routeId: '', stopId: '', theme: 'neon'};
  }
}

function saveConfig(config) {
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
}

module.exports = { loadConfig, saveConfig };

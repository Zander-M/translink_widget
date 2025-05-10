
// Config
const {loadConfig} = require("./config")
const config = loadConfig()
const API_KEY = config.apiKey;
const ROUTE_ID = config.routeId;
const STOP_ID = config.stopId;  

const fetch = require('node-fetch');
const GtfsRealtimeBindings = require('gtfs-realtime-bindings');
const { parse } = require('csv-parse/sync');
const fs = require('fs');
const path = require('path');
const unzipper = require('unzipper');

const GTFS_ZIP_URL = 'https://gtfs.translink.ca/static/latest.zip';
const DATA_DIR = path.join(__dirname, 'gtfs_static');
const ZIP_PATH = path.join(DATA_DIR, 'latest.zip');
const ROUTES_TXT = path.join(DATA_DIR, 'routes.txt');
const STOPS_TXT = path.join(DATA_DIR, 'stops.txt');

// USER-PROVIDED CONFIGURATION
let routeNames = {};
let stopNames = {};

function isCacheFresh(filePath, maxAgeMs = 2 * 24 * 60 * 60 * 1000) { // TODO: allow update
  if (!fs.existsSync(filePath)) return false;
  const stats = fs.statSync(filePath);
  return (Date.now() - stats.mtimeMs) < maxAgeMs;
}

async function fetchStaticGTFS() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);
  const shouldDownload = !isCacheFresh(ZIP_PATH);

  if (shouldDownload) {
    console.log("Downloading GTFS static data...");
    const res = await fetch(GTFS_ZIP_URL);
    const buffer = await res.buffer();
    fs.writeFileSync(ZIP_PATH, buffer);

    await unzipper.Open.buffer(buffer).then(async (d) => {
      for (const file of d.files) {
        if (file.path === 'routes.txt' || file.path === 'stops.txt') {
          const content = await file.buffer();
          fs.writeFileSync(path.join(DATA_DIR, file.path), content);
        }
      }
    });
    console.log("GTFS static data cached.");
  } else {
    console.log("Using cached GTFS static data.");
  }

  const routesCsv = fs.readFileSync(ROUTES_TXT, 'utf8');
  const routes = parse(routesCsv, { columns: true });
  routes.forEach(r => {
    routeNames[r.route_id] = `${r.route_short_name} – ${r.route_long_name}`;
  });

  const stopsCsv = fs.readFileSync(STOPS_TXT, 'utf8');
  const stops = parse(stopsCsv, { columns: true });
  stops.forEach(s => {
    stopNames[s.stop_id] = s.stop_name;
  });

  console.log("Route and stop names loaded.");
}

async function fetchNextBus() {
  const res = await fetch(`https://gtfsapi.translink.ca/v3/gtfsrealtime?apikey=${API_KEY}`);
  const buffer = await res.arrayBuffer();
  const feed = GtfsRealtimeBindings.transit_realtime.FeedMessage.decode(new Uint8Array(buffer));

  const now = Date.now() / 1000;
  const arrivals = [];

  for (const entity of feed.entity) {
    const trip = entity.tripUpdate?.trip;
    const updates = entity.tripUpdate?.stopTimeUpdate ?? [];

    if (trip?.routeId !== ROUTE_ID) continue;

    for (const stop of updates) {
      if (stop.stopId === STOP_ID && stop.arrival?.time?.low > now) {
        arrivals.push(stop.arrival.time.low);
      }
    }
  }

  if (arrivals.length === 0) return {is_bus_coming: false};

  const next = arrivals.sort((a, b) => a - b).slice(0, 2);
  const mins = next.map(t => `${Math.round((t - now) / 60)} min`).join(', ');

  const routeLabel = routeNames[ROUTE_ID] || `Route ${ROUTE_ID}`;
  const stopLabel = stopNames[STOP_ID] || `Stop ${STOP_ID}`;

  return {
    is_bus_coming: true,
    route: routeLabel,
    stop: stopLabel,
    minutes: mins
  }
}

module.exports = {
  fetchNextBus,
  fetchStaticGTFS
};

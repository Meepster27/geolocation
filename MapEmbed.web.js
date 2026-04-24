import React from "react";

// Web-only: Leaflet map with live nearby-restaurant data fetched from the
// Overpass API (free, no key required, queries live OpenStreetMap data).
export default function MapEmbed({ userLocation, restaurant }) {
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"><\/script>
  <style>
    html, body, #map { margin: 0; padding: 0; height: 100%; width: 100%; }
    .loading {
      position: absolute; top: 8px; right: 8px; z-index: 1000;
      background: #fff; padding: 6px 10px; border-radius: 8px;
      font: 13px/1.4 sans-serif; box-shadow: 0 2px 6px rgba(0,0,0,.2);
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <div class="loading" id="status">Loading nearby restaurants…</div>
  <script>
    var userLat = ${userLocation.latitude};
    var userLng = ${userLocation.longitude};
    var restLat = ${restaurant.latitude};
    var restLng = ${restaurant.longitude};

    var map = L.map('map').setView([userLat, userLng], 15);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19
    }).addTo(map);

    // ── Icon helpers ────────────────────────────────────────────────────────
    function makeIcon(color) {
      return L.icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-' + color + '.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34]
      });
    }

    // ── User marker (blue) ──────────────────────────────────────────────────
    L.marker([userLat, userLng], { icon: makeIcon('blue') })
      .addTo(map)
      .bindPopup('<b>You are here</b>');

    // ── Annotated POI marker (red) ──────────────────────────────────────────
    L.marker([restLat, restLng], { icon: makeIcon('red') })
      .addTo(map)
      .bindPopup('<b>Bob Evans</b><br>American Home-Style<br>8900 Bell Oaks Dr, Newburgh, IN')
      .openPopup();

    // ── Fetch nearby restaurants from Overpass API ──────────────────────────
    var radius = 800; // metres
    var query = '[out:json][timeout:15];' +
      'node["amenity"="restaurant"](around:' + radius + ',' + userLat + ',' + userLng + ');' +
      'out body;';

    fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      body: query
    })
    .then(function(r) { return r.json(); })
    .then(function(data) {
      var count = 0;
      (data.elements || []).forEach(function(el) {
        if (!el.lat || !el.lon) return;
        var name    = (el.tags && el.tags.name)    || 'Restaurant';
        var cuisine = (el.tags && el.tags.cuisine) || '';
        var popup   = '<b>' + name + '</b>' + (cuisine ? '<br>' + cuisine : '');
        L.marker([el.lat, el.lon], { icon: makeIcon('orange') })
          .addTo(map)
          .bindPopup(popup);
        count++;
      });
      document.getElementById('status').textContent =
        count + ' restaurant' + (count !== 1 ? 's' : '') + ' found nearby';
      setTimeout(function() {
        var el = document.getElementById('status');
        if (el) el.style.display = 'none';
      }, 3000);
    })
    .catch(function() {
      document.getElementById('status').textContent = 'Could not load nearby restaurants';
    });
  <\/script>
</body>
</html>`;

  return (
    <div style={{ flex: 1, display: "flex", minHeight: 0 }}>
      <iframe
        title="Map"
        srcDoc={html}
        style={{ flex: 1, border: "none", minHeight: 0 }}
        allowFullScreen
      />
    </div>
  );
}

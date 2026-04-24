import React, { useEffect, useState } from "react";

// Web-only: Leaflet map. Nearby restaurants are fetched here in React
// (not inside the iframe) to avoid the opaque-origin fetch block that
// srcDoc iframes hit in all modern browsers.
export default function MapEmbed({ userLocation, restaurant }) {
  const [nearbyRestaurants, setNearbyRestaurants] = useState([]);
  const [fetchStatus, setFetchStatus] = useState("Loading nearby restaurants…");

  useEffect(() => {
    const radius = 800;
    const query =
      `[out:json][timeout:15];` +
      `node["amenity"="restaurant"](around:${radius},${userLocation.latitude},${userLocation.longitude});` +
      `out body;`;

    fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      body: query,
    })
      .then((r) => r.json())
      .then((data) => {
        const results = (data.elements || [])
          .filter((el) => el.lat && el.lon)
          .map((el) => ({
            lat: el.lat,
            lon: el.lon,
            name: (el.tags && el.tags.name) || "Restaurant",
            cuisine: (el.tags && el.tags.cuisine) || "",
          }));
        setNearbyRestaurants(results);
        setFetchStatus(`${results.length} restaurant${results.length !== 1 ? "s" : ""} found nearby`);
      })
      .catch(() => setFetchStatus("Could not load nearby restaurants"));
  }, [userLocation.latitude, userLocation.longitude]);

  const nearbyJson = JSON.stringify(nearbyRestaurants);

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"><\/script>
  <style>
    html, body, #map { margin: 0; padding: 0; height: 100%; width: 100%; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    var map = L.map('map').setView([${userLocation.latitude}, ${userLocation.longitude}], 15);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19
    }).addTo(map);

    function makeIcon(color) {
      return L.icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-' + color + '.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34]
      });
    }

    // Blue — user location
    L.marker([${userLocation.latitude}, ${userLocation.longitude}], { icon: makeIcon('blue') })
      .addTo(map).bindPopup('<b>You are here</b>');

    // Red — annotated POI restaurant
    L.marker([${restaurant.latitude}, ${restaurant.longitude}], { icon: makeIcon('red') })
      .addTo(map)
      .bindPopup('<b>Bob Evans</b><br>American Home-Style<br>8900 Bell Oaks Dr, Newburgh, IN')
      .openPopup();

    // Orange — other nearby restaurants pre-fetched by React
    var nearby = ${nearbyJson};
    nearby.forEach(function(r) {
      var popup = '<b>' + r.name + '</b>' + (r.cuisine ? '<br>' + r.cuisine : '');
      L.marker([r.lat, r.lon], { icon: makeIcon('orange') })
        .addTo(map).bindPopup(popup);
    });
  <\/script>
</body>
</html>`;

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
      <div style={{
        padding: "6px 12px", background: "#f3f4f6",
        fontSize: 13, color: "#6b7280", fontFamily: "sans-serif",
        borderBottom: "1px solid #e5e7eb"
      }}>
        {fetchStatus}
      </div>
      <iframe
        title="Map"
        srcDoc={html}
        style={{ flex: 1, border: "none", minHeight: 0 }}
        allowFullScreen
      />
    </div>
  );
}

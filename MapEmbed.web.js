import React from "react";

// Web-only component: renders an inline Leaflet map loaded via srcDoc so we
// get full OSM tile data (including restaurant POI icons) plus custom markers
// for the user position and the annotated restaurant — matching what
// showsPointsOfInterest does on the native side.
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
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    var map = L.map('map').setView(
      [${userLocation.latitude}, ${userLocation.longitude}], 15
    );

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19
    }).addTo(map);

    // Blue marker — user location
    var blueIcon = L.icon({
      iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34]
    });
    L.marker([${userLocation.latitude}, ${userLocation.longitude}], { icon: blueIcon })
      .addTo(map)
      .bindPopup('<b>You are here</b><br>Your current location');

    // Red marker — nearby restaurant (point of interest)
    var redIcon = L.icon({
      iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34]
    });
    L.marker([${restaurant.latitude}, ${restaurant.longitude}], { icon: redIcon })
      .addTo(map)
      .bindPopup('<b>Bob Evans</b><br>American Home-Style<br>8900 Bell Oaks Dr, Newburgh, IN')
      .openPopup();
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

import React from "react";

// Web-only component: renders an OpenStreetMap iframe centered on the user's
// location with the restaurant marker nearby — matching what react-native-maps
// shows on Android/iOS.
// Metro/webpack picks this file on web; MapEmbed.js is used on native.
export default function MapEmbed({ userLocation, restaurant }) {
  const west  = Math.min(userLocation.longitude, restaurant.longitude) - 0.012;
  const east  = Math.max(userLocation.longitude, restaurant.longitude) + 0.012;
  const south = Math.min(userLocation.latitude,  restaurant.latitude)  - 0.006;
  const north = Math.max(userLocation.latitude,  restaurant.latitude)  + 0.006;

  // OSM embed — marker placed on the restaurant (the POI being annotated)
  const src =
    `https://www.openstreetmap.org/export/embed.html` +
    `?bbox=${west},${south},${east},${north}` +
    `&layer=mapnik` +
    `&marker=${restaurant.latitude},${restaurant.longitude}`;

  return (
    <div style={{ flex: 1, display: "flex", minHeight: 0 }}>
      <iframe
        title="OpenStreetMap"
        src={src}
        style={{ flex: 1, border: "none", minHeight: 0 }}
        allowFullScreen
      />
    </div>
  );
}

import React, { useState } from "react";
import { Platform, StatusBar, Text, View } from "react-native";
import styles from "./styles";

StatusBar.setBarStyle("dark-content");

let MapViewComponent = null;
let PolygonComponent = null;

if (Platform.OS !== "web") {
  try {
    const maps = require("react-native-maps");
    MapViewComponent = maps.default ?? maps;
    PolygonComponent = maps.Polygon ?? maps.default?.Polygon ?? null;
  } catch {
    MapViewComponent = null;
    PolygonComponent = null;
  }
}

const REGIONS = {
  ipa: {
    coordinates: [
      { latitude: 43.8486744, longitude: -79.0695283 },
      { latitude: 43.8537168, longitude: -79.0700046 },
      { latitude: 43.8518394, longitude: -79.0725697 },
      { latitude: 43.8481651, longitude: -79.0716377 },
      { latitude: 43.8486744, longitude: -79.0695283 },
    ],
    strokeColor: "coral",
    strokeWidth: 4,
  },
  stout: {
    coordinates: [
      { latitude: 43.8486744, longitude: -79.0693283 },
      { latitude: 43.8517168, longitude: -79.0710046 },
      { latitude: 43.8518394, longitude: -79.0715697 },
      { latitude: 43.8491651, longitude: -79.0716377 },
      { latitude: 43.8486744, longitude: -79.0693283 },
    ],
    strokeColor: "firebrick",
    strokeWidth: 4,
  },
};

const INITIAL_REGION = {
  latitude: 43.8486744,
  longitude: -79.0695283,
  latitudeDelta: 0.002,
  longitudeDelta: 0.04,
};

export default function PlottingOverlays() {
  const [selectedOverlay, setSelectedOverlay] = useState("ipa");
  const activeOverlay = REGIONS[selectedOverlay];
  const mapIsAvailable = Boolean(MapViewComponent && PolygonComponent);

  return (
    <View style={styles.container}>
      <View style={styles.legend}>
        <Text
          style={[
            styles.ipaText,
            selectedOverlay === "ipa" && styles.boldText,
          ]}
          onPress={() => setSelectedOverlay("ipa")}
        >
          IPA Fans
        </Text>
        <Text
          style={[
            styles.stoutText,
            selectedOverlay === "stout" && styles.boldText,
          ]}
          onPress={() => setSelectedOverlay("stout")}
        >
          Stout Fans
        </Text>
      </View>
      {mapIsAvailable ? (
        <MapViewComponent
          style={styles.mapView}
          showsPointsOfInterest={false}
          initialRegion={INITIAL_REGION}
        >
          <PolygonComponent
            coordinates={activeOverlay.coordinates}
            strokeColor={activeOverlay.strokeColor}
            strokeWidth={activeOverlay.strokeWidth}
          />
        </MapViewComponent>
      ) : (
        <View style={styles.fallbackPanel}>
          <Text style={styles.fallbackTitle}>Map preview unavailable in this runtime.</Text>
          <Text style={styles.fallbackBody}>
            Open the Snack on iOS or Android to render the native map overlay.
          </Text>
          <View style={styles.coordinateList}>
            {activeOverlay.coordinates.map((coordinate, index) => (
              <Text key={`${selectedOverlay}-${index}`} style={styles.coordinateItem}>
                {index + 1}. {coordinate.latitude.toFixed(6)}, {coordinate.longitude.toFixed(6)}
              </Text>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}
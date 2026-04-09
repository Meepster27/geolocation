import React, { useState } from "react";
import { StatusBar, Text, View } from "react-native";
import MapView from "react-native-maps";
import styles from "./styles";

StatusBar.setBarStyle("dark-content");

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
      <MapView
        style={styles.mapView}
        showsPointsOfInterest={false}
        initialRegion={INITIAL_REGION}
      >
        <MapView.Polygon
          coordinates={activeOverlay.coordinates}
          strokeColor={activeOverlay.strokeColor}
          strokeWidth={activeOverlay.strokeWidth}
        />
      </MapView>
    </View>
  );
}
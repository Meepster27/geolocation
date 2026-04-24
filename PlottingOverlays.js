import React, { useEffect, useState } from "react";
import { ActivityIndicator, Platform, StyleSheet, Text, View } from "react-native";

// react-native-maps is unavailable in the Expo web preview — load lazily
let MapView = null;
let Marker = null;
let Callout = null;

if (Platform.OS !== "web") {
  try {
    const RNMaps = require("react-native-maps");
    MapView = RNMaps.default ?? RNMaps;
    Marker = RNMaps.Marker ?? RNMaps.default?.Marker ?? null;
    Callout = RNMaps.Callout ?? RNMaps.default?.Callout ?? null;
  } catch {
    // Package not installed — falls through to text fallback
  }
}

// Fallback anchor used when GPS is unavailable (Newburgh, IN)
const FALLBACK_LOCATION = {
  latitude: 37.9457,
  longitude: -87.4047,
};

// Single nearby restaurant annotated as a point of interest
const NEARBY_RESTAURANT = {
  name: "Bob Evans",
  address: "8900 Bell Oaks Dr, Newburgh, IN 47630",
  cuisine: "American Home-Style",
  latitude: 37.9501,
  longitude: -87.4102,
};



export default function PlottingOverlays() {
  const [state, setState] = useState({
    status: "loading",
    userLocation: null,
    source: null,
    errorMessage: null,
  });

  useEffect(() => {
    let active = true;

    async function getLocation() {
      // Expo web cannot access native GPS — show fallback immediately
      if (Platform.OS === "web") {
        if (active) {
          setState({
            status: "ready",
            userLocation: FALLBACK_LOCATION,
            source: "fallback",
            errorMessage: null,
          });
        }
        return;
      }

      try {
        const Location = require("expo-location");
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          throw new Error("Location permission was denied.");
        }
        const fix = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        if (active) {
          setState({
            status: "ready",
            userLocation: {
              latitude: fix.coords.latitude,
              longitude: fix.coords.longitude,
            },
            source: "gps",
            errorMessage: null,
          });
        }
      } catch (err) {
        if (active) {
          setState({
            status: "ready",
            userLocation: FALLBACK_LOCATION,
            source: "fallback",
            errorMessage: err.message,
          });
        }
      }
    }

    getLocation();
    return () => {
      active = false;
    };
  }, []);

  const { status, userLocation, source, errorMessage } = state;

  const mapRegion = userLocation
    ? {
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      }
    : null;

  const mapReady =
    status === "ready" &&
    userLocation !== null &&
    MapView !== null &&
    Marker !== null;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Nearby Restaurant Finder</Text>
        {status === "loading" ? (
          <View style={styles.row}>
            <ActivityIndicator size="small" color="#2563eb" />
            <Text style={styles.subtitle}> Acquiring location…</Text>
          </View>
        ) : (
          <Text style={styles.subtitle}>
            {source === "gps"
              ? `Live GPS · ${userLocation.latitude.toFixed(5)}, ${userLocation.longitude.toFixed(5)}`
              : "Fallback location – Newburgh, IN (run in Expo Go for live GPS)"}
          </Text>
        )}
        {errorMessage ? (
          <Text style={styles.error}>{errorMessage}</Text>
        ) : null}
      </View>

      {/* Map with markers */}
      {mapReady ? (
        <MapView style={styles.map} region={mapRegion} showsUserLocation>
          {/* Current user position */}
          <Marker
            coordinate={userLocation}
            title="You are here"
            description="Your current location"
            pinColor="blue"
          />

          {/* Nearby restaurant — point of interest annotation */}
          <Marker
            coordinate={NEARBY_RESTAURANT}
            title={NEARBY_RESTAURANT.name}
            description={`${NEARBY_RESTAURANT.cuisine} · ${NEARBY_RESTAURANT.address}`}
            pinColor="red"
          >
            {Callout ? (
              <Callout>
                <View style={styles.callout}>
                  <Text style={styles.calloutTitle}>{NEARBY_RESTAURANT.name}</Text>
                  <Text style={styles.calloutBody}>{NEARBY_RESTAURANT.cuisine}</Text>
                  <Text style={styles.calloutBody}>{NEARBY_RESTAURANT.address}</Text>
                </View>
              </Callout>
            ) : null}
          </Marker>
        </MapView>
      ) : status === "ready" ? (
        /* Text fallback for web / missing maps package */
        <View style={styles.fallback}>
          <Text style={styles.fallbackTitle}>Interactive map unavailable</Text>
          <Text style={styles.fallbackBody}>
            Open this project in Expo Go on a physical device to see the live
            map with GPS tracking.
          </Text>
          <View style={styles.poiCard}>
            <Text style={styles.poiLabel}>📍 Your location</Text>
            <Text style={styles.poiValue}>
              {userLocation.latitude.toFixed(5)}, {userLocation.longitude.toFixed(5)}
            </Text>
          </View>
          <View style={styles.poiCard}>
            <Text style={styles.poiLabel}>🍽 Nearby restaurant</Text>
            <Text style={styles.poiName}>{NEARBY_RESTAURANT.name}</Text>
            <Text style={styles.poiValue}>{NEARBY_RESTAURANT.cuisine}</Text>
            <Text style={styles.poiValue}>{NEARBY_RESTAURANT.address}</Text>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    padding: 16,
    paddingTop: Platform.OS === "android" ? 40 : 16,
    backgroundColor: "#ffffff",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#d1d5db",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: "#6b7280",
  },
  error: {
    fontSize: 13,
    color: "#dc2626",
    marginTop: 4,
  },
  map: {
    flex: 1,
  },
  callout: {
    minWidth: 180,
    padding: 8,
  },
  calloutTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 2,
  },
  calloutBody: {
    fontSize: 13,
    color: "#6b7280",
  },
  fallback: {
    flex: 1,
    padding: 24,
    gap: 16,
  },
  fallbackTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
  },
  fallbackBody: {
    fontSize: 15,
    color: "#6b7280",
    lineHeight: 22,
  },
  poiCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  poiLabel: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    color: "#9ca3af",
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  poiName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 2,
  },
  poiValue: {
    fontSize: 14,
    color: "#6b7280",
  },
});
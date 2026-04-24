import React, { useEffect, useState } from "react";
import { ActivityIndicator, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import MapEmbed from "./MapEmbed";

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
  const [screen, setScreen] = useState("info"); // "info" | "map"

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

  // ─── Back button (used on every map / fallback map screen) ───────────────
  function BackButton() {
    return (
      <Pressable
        style={({ pressed }) => [styles.backBtn, pressed && styles.backBtnPressed]}
        onPress={() => setScreen("info")}
        accessibilityLabel="Back to info"
        accessibilityRole="button"
      >
        <Text style={styles.backBtnText}>← Back</Text>
      </Pressable>
    );
  }

  // ─── INFO SCREEN ─────────────────────────────────────────────────────────
  if (screen === "info") {
    return (
      <View style={styles.container}>
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

        <ScrollView contentContainerStyle={styles.infoContent}>
          {/* User location card — mirrors Chapter 21 Figure 21.1 */}
          <View style={styles.poiCard}>
            <Text style={styles.poiLabel}>📍 Your location</Text>
            {userLocation ? (
              <View style={styles.coordTable}>
                <View style={styles.coordRow}>
                  <Text style={styles.coordKey}>Latitude</Text>
                  <Text style={styles.coordVal}>{userLocation.latitude.toFixed(6)}</Text>
                </View>
                <View style={styles.coordRow}>
                  <Text style={styles.coordKey}>Longitude</Text>
                  <Text style={styles.coordVal}>{userLocation.longitude.toFixed(6)}</Text>
                </View>
                <View style={styles.coordRow}>
                  <Text style={styles.coordKey}>Source</Text>
                  <Text style={styles.coordVal}>
                    {source === "gps" ? "Live GPS" : "Fallback (Newburgh, IN)"}
                  </Text>
                </View>
              </View>
            ) : (
              <Text style={styles.poiValue}>Acquiring…</Text>
            )}
          </View>

          {/* Restaurant POI card */}
          <View style={styles.poiCard}>
            <Text style={styles.poiLabel}>🍽 Nearby restaurant</Text>
            <Text style={styles.poiName}>{NEARBY_RESTAURANT.name}</Text>
            <Text style={styles.poiValue}>{NEARBY_RESTAURANT.cuisine}</Text>
            <Text style={styles.poiValue}>{NEARBY_RESTAURANT.address}</Text>
          </View>

          {/* Open map button */}
          <Pressable
            style={({ pressed }) => [
              styles.mapBtn,
              status !== "ready" && styles.mapBtnDisabled,
              pressed && status === "ready" && styles.mapBtnPressed,
            ]}
            onPress={() => setScreen("map")}
            disabled={status !== "ready"}
          >
            <Text style={styles.mapBtnText}>
              {status === "loading" ? "Loading map…" : "Open Map"}
            </Text>
          </Pressable>
        </ScrollView>
      </View>
    );
  }

  // ─── MAP SCREEN (native interactive map) ─────────────────────────────────
  if (mapReady) {
    return (
      <View style={styles.container}>
        <MapView style={styles.map} region={mapRegion} showsUserLocation followUserLocation>
          <Marker
            coordinate={userLocation}
            title="You are here"
            description="Your current location"
            pinColor="blue"
          />
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

        {/* Back button overlaid on the map */}
        <View style={styles.backOverlay}>
          <BackButton />
        </View>
      </View>
    );
  }

  // ─── MAP SCREEN FALLBACK (web → OSM iframe; native without maps → text) ────
  return (
    <View style={[styles.container, { position: "relative" }]}>
      {Platform.OS === "web" ? (
        // Web: real interactive map via OpenStreetMap embed
        <>
          <MapEmbed userLocation={userLocation} restaurant={NEARBY_RESTAURANT} />
          <View style={styles.backOverlay}>
            <BackButton />
          </View>
        </>
      ) : (
        // Native without react-native-maps: text fallback
        <>
          <View style={styles.header}>
            <BackButton />
            <Text style={[styles.title, { marginTop: 8 }]}>Map Preview</Text>
            <Text style={styles.subtitle}>
              Open in Expo Go on a device for an interactive map.
            </Text>
          </View>
          <ScrollView contentContainerStyle={styles.infoContent}>
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
          </ScrollView>
        </>
      )}
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
  // Info screen
  infoContent: {
    padding: 16,
    gap: 16,
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
  coordTable: {
    marginTop: 6,
    gap: 6,
  },
  coordRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  coordKey: {
    fontSize: 14,
    color: "#9ca3af",
    fontWeight: "600",
  },
  coordVal: {
    fontSize: 14,
    color: "#111827",
    fontWeight: "500",
  },
  mapBtn: {
    backgroundColor: "#2563eb",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 4,
  },
  mapBtnDisabled: {
    backgroundColor: "#93c5fd",
  },
  mapBtnPressed: {
    backgroundColor: "#1d4ed8",
  },
  mapBtnText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
  // Map screen
  map: {
    flex: 1,
  },
  backOverlay: {
    position: "absolute",
    top: Platform.OS === "android" ? 44 : 16,
    left: 16,
  },
  backBtn: {
    backgroundColor: "#ffffff",
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 14,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  backBtnPressed: {
    backgroundColor: "#f3f4f6",
  },
  backBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
  },
  // Callout
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
});
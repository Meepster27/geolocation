import React, { useEffect, useState } from "react";
import { ActivityIndicator, Platform, StatusBar, Text, View } from "react-native";
import styles from "./styles";

// Simple web map preview component
function WebMapPreview({ userLocation, nearestRestaurant, routeCoordinates }) {
  const canvasRef = React.useRef(null);

  useEffect(() => {
    if (!canvasRef.current || !userLocation || !nearestRestaurant) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.fillStyle = "#e8f4f8";
    ctx.fillRect(0, 0, width, height);

    // Grid
    ctx.strokeStyle = "#d0e8ed";
    ctx.lineWidth = 1;
    for (let i = 0; i <= width; i += 40) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, height);
      ctx.stroke();
    }
    for (let i = 0; i <= height; i += 40) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(width, i);
      ctx.stroke();
    }

    // Draw route line
    if (routeCoordinates.length === 2) {
      const startX = (width * 0.4);
      const startY = (height * 0.5);
      const endX = (width * 0.65);
      const endY = (height * 0.35);

      ctx.strokeStyle = "#c7512c";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
      ctx.stroke();
    }

    // Draw user location marker
    ctx.fillStyle = "#1b6b75";
    ctx.beginPath();
    ctx.arc(width * 0.4, height * 0.5, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw restaurant marker
    ctx.fillStyle = "#c7512c";
    ctx.beginPath();
    ctx.arc(width * 0.65, height * 0.35, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Labels
    ctx.fillStyle = "#2b211b";
    ctx.font = "12px sans-serif";
    ctx.fillText("You", width * 0.4 - 10, height * 0.5 - 20);
    ctx.fillText(nearestRestaurant.name, width * 0.65 - 30, height * 0.35 - 20);
  }, [userLocation, nearestRestaurant, routeCoordinates]);

  return (
    <canvas
      ref={canvasRef}
      width={300}
      height={250}
      style={{
        border: "1px solid #ddd",
        borderRadius: 12,
        backgroundColor: "#e8f4f8",
        marginVertical: 16,
        alignSelf: "center",
      }}
    />
  );
}

StatusBar.setBarStyle("dark-content");

let MapViewComponent = null;
let PolylineComponent = null;
let MarkerComponent = null;

if (Platform.OS !== "web") {
  try {
    const maps = require("react-native-maps");
    MapViewComponent = maps.default ?? maps;
    PolylineComponent = maps.Polyline ?? maps.default?.Polyline ?? null;
    MarkerComponent = maps.Marker ?? maps.default?.Marker ?? null;
  } catch {
    MapViewComponent = null;
    PolylineComponent = null;
    MarkerComponent = null;
  }
}

// 8855 Framewood Drive, Newburgh IN 47630 (town-center anchor for Newburgh)
const HOME_LOCATION = {
  latitude: 37.9457,
  longitude: -87.4047,
};

const INITIAL_REGION = {
  ...HOME_LOCATION,
  latitudeDelta: 0.02,
  longitudeDelta: 0.02,
};

const RESTAURANT_TEMPLATES = [
  {
    id: "north-bistro",
    name: "North Bistro",
    cuisine: "Contemporary Canadian",
    latitudeOffset: 0.0021,
    longitudeOffset: -0.0016,
  },
  {
    id: "market-grill",
    name: "Market Grill",
    cuisine: "Steakhouse",
    latitudeOffset: -0.0014,
    longitudeOffset: 0.0023,
  },
  {
    id: "harbor-bowl",
    name: "Harbor Bowl",
    cuisine: "Asian Fusion",
    latitudeOffset: 0.0011,
    longitudeOffset: 0.0012,
  },
  {
    id: "orchard-kitchen",
    name: "Orchard Kitchen",
    cuisine: "Brunch Cafe",
    latitudeOffset: -0.0024,
    longitudeOffset: -0.0019,
  },
];

function toRadians(value) {
  return (value * Math.PI) / 180;
}

function getDistanceKm(from, to) {
  const earthRadiusKm = 6371;
  const deltaLatitude = toRadians(to.latitude - from.latitude);
  const deltaLongitude = toRadians(to.longitude - from.longitude);
  const fromLatitude = toRadians(from.latitude);
  const toLatitude = toRadians(to.latitude);

  const a =
    Math.sin(deltaLatitude / 2) * Math.sin(deltaLatitude / 2) +
    Math.cos(fromLatitude) *
      Math.cos(toLatitude) *
      Math.sin(deltaLongitude / 2) *
      Math.sin(deltaLongitude / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusKm * c;
}

function buildNearbyRestaurants(userLocation) {
  return RESTAURANT_TEMPLATES.map((restaurant) => ({
    ...restaurant,
    latitude: userLocation.latitude + restaurant.latitudeOffset,
    longitude: userLocation.longitude + restaurant.longitudeOffset,
  }));
}

function findNearestRestaurant(userLocation, restaurants) {
  return restaurants.reduce((closest, restaurant) => {
    const distanceKm = getDistanceKm(userLocation, restaurant);

    if (!closest || distanceKm < closest.distanceKm) {
      return {
        ...restaurant,
        distanceKm,
      };
    }

    return closest;
  }, null);
}

function createRouteCoordinates(userLocation, restaurant) {
  return [
    {
      latitude: userLocation.latitude,
      longitude: userLocation.longitude,
    },
    {
      latitude: restaurant.latitude,
      longitude: restaurant.longitude,
    },
  ];
}

export default function PlottingOverlays() {
  const [locationState, setLocationState] = useState({
    status: "loading",
    message: "Requesting foreground location permission...",
    userLocation: null,
    restaurants: [],
    nearestRestaurant: null,
  });

  useEffect(() => {
    let isMounted = true;

    async function resolveUserLocation() {
      // Snack web preview cannot access real device GPS — use the hardcoded
      // home address so the map always shows the correct area on web.
      if (Platform.OS === "web") {
        return { ...HOME_LOCATION, _source: "home" };
      }

      // Native (iOS / Android via Expo Go): use expo-location for real GPS.
      const locationModule = require("expo-location");
      const permission = await locationModule.requestForegroundPermissionsAsync();
      if (permission.status !== "granted") {
        throw new Error("Location permission was denied.");
      }
      const fix = await locationModule.getCurrentPositionAsync({
        accuracy: locationModule.Accuracy.High,
      });
      return {
        latitude: fix.coords.latitude,
        longitude: fix.coords.longitude,
        _source: "gps",
      };
    }

    async function loadCurrentLocation() {
      let gpsFailed = false;
      let userLocation;

      try {
        userLocation = await resolveUserLocation();
      } catch {
        gpsFailed = true;
        userLocation = HOME_LOCATION;
      }

      try {
        if (!isMounted) {
          return;
        }

        const source = gpsFailed || userLocation._source === "home"
          ? "home address · 8855 Framewood Dr, Newburgh IN (open in Expo Go for live GPS)"
          : "live GPS";
        const restaurants = buildNearbyRestaurants(userLocation);

        setLocationState({
          status: "ready",
          message: `Nearest restaurant found · ${source}`,
          userLocation,
          restaurants,
          nearestRestaurant: findNearestRestaurant(userLocation, restaurants),
        });
      } catch (err) {
        if (!isMounted) {
          return;
        }

        setLocationState({
          status: "error",
          message:
            "Could not access your location. " +
            (err?.message ?? "Please allow location access and try again."),
          userLocation: null,
          restaurants: [],
          nearestRestaurant: null,
        });
      }
    }

    loadCurrentLocation();

    return () => {
      isMounted = false;
    };
  }, []);

  const { message, nearestRestaurant, status, userLocation } = locationState;
  const mapIsAvailable = Boolean(MapViewComponent && PolylineComponent && MarkerComponent) && Platform.OS !== "web";
  const routeCoordinates =
    userLocation && nearestRestaurant
      ? createRouteCoordinates(userLocation, nearestRestaurant)
      : [];
  const region = userLocation
    ? {
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }
    : INITIAL_REGION;

  return (
    <View style={[
      styles.container,
      Platform.OS === "web" && { paddingTop: 0 }
    ]}>
      <View style={styles.headerCard}>
        <Text style={styles.eyebrow}>Native Geolocation Demo</Text>
        <Text style={styles.title}>Nearest Restaurant Finder</Text>
        <Text style={styles.description}>{message}</Text>

        {nearestRestaurant ? (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Closest destination</Text>
            <Text style={styles.summaryName}>{nearestRestaurant.name}</Text>
            <Text style={styles.summaryMeta}>{nearestRestaurant.cuisine}</Text>
            <Text style={styles.summaryDistance}>
              {nearestRestaurant.distanceKm.toFixed(2)} km away
            </Text>
          </View>
        ) : null}

        {userLocation ? (
          <Text style={styles.coordinates}>
            Your position: {userLocation.latitude.toFixed(6)}, {userLocation.longitude.toFixed(6)}
          </Text>
        ) : null}

        {status === "loading" ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator color="#a3412b" />
            <Text style={styles.loadingText}>Locating device...</Text>
          </View>
        ) : null}
      </View>

      {mapIsAvailable && userLocation && nearestRestaurant ? (
        <MapViewComponent
          style={styles.mapView}
          showsPointsOfInterest={false}
          showsUserLocation
          region={region}
        >
          <MarkerComponent
            coordinate={userLocation}
            title="You are here"
            description="Current GPS position"
            pinColor="#1b6b75"
          />
          <MarkerComponent
            coordinate={{
              latitude: nearestRestaurant.latitude,
              longitude: nearestRestaurant.longitude,
            }}
            title={nearestRestaurant.name}
            description={nearestRestaurant.cuisine}
            pinColor="#c7512c"
          />
          <PolylineComponent
            coordinates={routeCoordinates}
            strokeColor="#c7512c"
            strokeWidth={5}
          />
        </MapViewComponent>
      ) : (
        <View style={styles.fallbackPanel}>
          <Text style={styles.fallbackTitle}>Map preview unavailable.</Text>
          <Text style={styles.fallbackBody}>{message}</Text>
          {Platform.OS === "web" && userLocation && nearestRestaurant ? (
            <WebMapPreview
              userLocation={userLocation}
              nearestRestaurant={nearestRestaurant}
              routeCoordinates={routeCoordinates}
            />
          ) : null}
          {nearestRestaurant ? (
            <View style={styles.coordinateList}>
              <Text style={styles.coordinateItem}>Restaurant: {nearestRestaurant.name}</Text>
              <Text style={styles.coordinateItem}>Cuisine: {nearestRestaurant.cuisine}</Text>
              <Text style={styles.coordinateItem}>
                Coordinates: {nearestRestaurant.latitude.toFixed(5)}, {nearestRestaurant.longitude.toFixed(5)}
              </Text>
              <Text style={styles.coordinateItem}>
                Distance: {nearestRestaurant.distanceKm.toFixed(2)} km
              </Text>
            </View>
          ) : null}
        </View>
      )}
    </View>
  );
}
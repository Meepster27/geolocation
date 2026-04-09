import React, { useEffect, useState } from "react";
import { ActivityIndicator, Platform, StatusBar, Text, View } from "react-native";
import styles from "./styles";

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

const INITIAL_REGION = {
  latitude: 43.65,
  longitude: -79.38,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
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

    async function loadCurrentLocation() {
      try {
        const locationModule = require("expo-location");
        const permission = await locationModule.requestForegroundPermissionsAsync();

        if (!isMounted) {
          return;
        }

        if (permission.status !== "granted") {
          setLocationState({
            status: "error",
            message: "Location permission was denied. Enable it to find the nearest restaurant.",
            userLocation: null,
            restaurants: [],
            nearestRestaurant: null,
          });
          return;
        }

        const currentPosition = await locationModule.getCurrentPositionAsync({
          accuracy: locationModule.Accuracy.Balanced,
        });

        if (!isMounted) {
          return;
        }

        const userLocation = {
          latitude: currentPosition.coords.latitude,
          longitude: currentPosition.coords.longitude,
        };
        const restaurants = buildNearbyRestaurants(userLocation);

        setLocationState({
          status: "ready",
          message: "Nearest restaurant found using your current GPS position.",
          userLocation,
          restaurants,
          nearestRestaurant: findNearestRestaurant(userLocation, restaurants),
        });
      } catch {
        if (!isMounted) {
          return;
        }

        setLocationState({
          status: "error",
          message: "Unable to read the device location in this runtime. Open the app on a phone or simulator with location services enabled.",
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
  const mapIsAvailable = Boolean(MapViewComponent && PolylineComponent && MarkerComponent);
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
    <View style={styles.container}>
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
            You: {userLocation.latitude.toFixed(5)}, {userLocation.longitude.toFixed(5)}
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
import React from "react";
import { SafeAreaView, StatusBar } from "react-native";
import PlottingOverlays from "./PlottingOverlays";

export default function App() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#ffffff" }}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <PlottingOverlays />
    </SafeAreaView>
  );
}
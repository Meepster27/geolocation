import React, { useEffect } from "react";
import { SafeAreaView, StatusBar, Platform, View } from "react-native";
import PlottingOverlays from "./PlottingOverlays";
import styles from "./styles";

export default function App() {
  useEffect(() => {
    // Configure status bar for Android
    if (Platform.OS === "android") {
      StatusBar.setBarStyle("dark-content");
      StatusBar.setBackgroundColor("#ffffff");
    }
  }, []);

  return (
    <SafeAreaView style={[styles.container, { flex: 1 }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <View style={{ flex: 1 }}>
        <PlottingOverlays />
      </View>
    </SafeAreaView>
  );
}
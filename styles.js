import { StyleSheet } from "react-native";

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff8f1",
    paddingTop: 48,
  },
  legend: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 20,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  mapView: {
    flex: 1,
  },
  ipaText: {
    color: "coral",
    fontSize: 18,
  },
  stoutText: {
    color: "firebrick",
    fontSize: 18,
  },
  boldText: {
    fontWeight: "700",
  },
});
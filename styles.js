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
  fallbackPanel: {
    flex: 1,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 20,
    backgroundColor: "#fff",
    padding: 20,
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    elevation: 3,
  },
  fallbackTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#3d2a1f",
    marginBottom: 8,
  },
  fallbackBody: {
    fontSize: 16,
    lineHeight: 22,
    color: "#6b5243",
    marginBottom: 20,
  },
  coordinateList: {
    gap: 10,
  },
  coordinateItem: {
    fontSize: 16,
    color: "#2b211b",
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
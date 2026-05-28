import React from "react";
import { View, StyleSheet, TouchableOpacity, Text, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function HomeScreen({ navigation }) {
  return (
    <View style={styles.container}>
      {/* Main empty area */}
      <View style={styles.content}>
        <Text style={styles.placeholderText}>For You! Screen Placeholder</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f0f4f7",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderText: {
    fontSize: 18,
    color: "#888",
    fontFamily: Platform.OS === "ios" ? "Helvetica" : "sans-serif",
  },
});

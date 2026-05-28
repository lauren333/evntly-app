import React from "react";
import { View, TextInput, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const BLUE = "#0492c2";

export default function SearchBar({ query, onChangeQuery, placeholder = "Search..." }) {
  return (
    <View style={styles.container}>
      <Ionicons name="search" size={20} color="#888" style={{ marginLeft: 12 }} />
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        value={query}
        onChangeText={onChangeQuery}
        returnKeyType="search"
        autoCapitalize="none"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    marginHorizontal: 16,
    paddingHorizontal: 8,
    paddingVertical: 9,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  input: {
    flex: 1,
    paddingHorizontal: 8,
    fontSize: 16,
    fontWeight: "300",
    color: "#000",
  },
});
import React from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet, Platform } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import alcFreeIcon from "../assets/alcfree.png";

const BLUE = "#0492c2";

export default function EventCard({
  event,
  isSaved,
  onToggleSave,
  onPress,
  showCity = true,
}) {

  const nonEmptyItems = (arr) =>
    Array.isArray(arr) ? arr.filter(i => i != null && i.trim() !== "") : [];

  const spanishCities = ["Madrid", "Barcelona", "Valencia"];
  const isSpanishCity = spanishCities.includes(event.venue?.city);
  const city = event?.venue?.city;
  const accessibility = nonEmptyItems(event.accessibility);

  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      
      {event.image && (
        <View style={styles.imageWrapper}>
          <Image
            source={{ uri: event.image }}
            style={styles.image}
            resizeMode="cover"
          />
        </View>
      )}

      <View style={styles.info}>

        {/* Heart Save */}
        <TouchableOpacity
          onPress={() => onToggleSave?.(event)}
          style={styles.heart}
        >
          <Ionicons
            name={isSaved ? "heart" : "heart-outline"}
            size={24}
            color={isSaved ? BLUE : "#ccc"}
          />
        </TouchableOpacity>

        <Text style={styles.name}>{event.title}</Text>
        {showCity && city && (
          <Text style={styles.city}>{city}</Text>
        )}
        {/* Date */}
        <Text style={styles.date}>
          {isSpanishCity ? "Duración: " : "Duration: "}
          {event.datetime_local}
          {event.end_date && event.end_date !== event.datetime_local
            ? ` → ${event.end_date}`
            : ""}
        </Text>

        {/* Time */}
        {event.time && (
          <Text style={styles.date}>
            {isSpanishCity ? "Hora:" : "Time:"} {event.time}
          </Text>
        )}

        {/* Venue */}
        {event.venue?.name && (
          <Text style={styles.venue}>
            {isSpanishCity ? "Lugar:" : "Venue:"} {event.venue.name}
          </Text>
        )}

        {/* Source */}
        <Text style={styles.source}>
          {isSpanishCity ? "Fuente:" : "Source:"} {event.source}
        </Text>

        {/* Accessibility */}
        {accessibility.length > 0 && (
          <View style={styles.accessibilityRow}>

            {(accessibility.includes("wheelchair_accessible") ||
              accessibility.includes("accesible_silla_ruedas")) && (
              <MaterialCommunityIcons
                name="wheelchair-accessibility"
                size={25}
                color={BLUE}
                style={{ marginRight: 6 }}
              />
            )}

            {(accessibility.includes("sober_friendly") ||
              accessibility.includes("ambiente_sobrio")) && (
              <Image
                source={alcFreeIcon}
                style={{ width: 25, height: 25, marginRight: 6 }}
                resizeMode="contain"
              />
            )}

            {(accessibility.includes("family_friendly") ||
              accessibility.includes("amigable_familia")) && (
              <MaterialCommunityIcons
                name="human-male-female-child"
                size={25}
                color="#f38affff"
              />
            )}

          </View>
        )}

      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({

  card: {
    flexDirection: "row",
    marginBottom: 13,
    backgroundColor: "#ffffffff",
    borderRadius: 20,
    overflow: "hidden",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    alignItems: "center"
  },

  imageWrapper: {
    width: 111,
    height: 111,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 10,
  },

  image: {
    width: 110,
    height: 110,
    borderRadius: 15,
  },

  info: {
    flex: 1,
    padding: 12,
    justifyContent: "center",
    paddingRight: 40,
  },

  heart: {
    position: "absolute",
    top: 10,
    right: 10,
    zIndex: 10,
  },

  name: {
    fontWeight: "500",
    fontSize: 17,
    color: "#000",
    fontFamily: Platform.OS === "ios" ? "Helvetica" : "sans-serif",
  },

  date: {
    color: "#555",
    marginTop: 6,
    fontSize: 14,
    fontWeight: "300",
  },

  venue: {
    color: "#777",
    marginTop: 4,
    fontSize: 14,
    fontWeight: "300",
  },

  source: {
    color: BLUE,
    marginTop: 6,
    fontStyle: "italic",
    fontSize: 13,
  },

  accessibilityRow: {
    flexDirection: "row",
    marginTop: 6,
  },
  city: {
    marginTop: 6,
    fontWeight: "400",  
    fontSize: 16,
    color: "#000",
    marginBottom: 2,
    fontStyle: "italic",
  },
});
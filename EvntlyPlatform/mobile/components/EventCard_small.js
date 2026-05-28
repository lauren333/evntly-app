import React from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import alcFreeIcon from '../assets/alcfree.png';
import AddToCalendarButton from './AddToCalendarButton';

const BLUE = "#0492c2";

export default function EventCardSmall({ event, onPress, selectedDate }) {
  if (!event) return null;

  const time = event.time || "";
  const city = event.venue?.city || "";
  const startDate = event.datetime_local;
  const endDate = event.end_date || startDate;

  const nonEmptyAccessibility = Array.isArray(event?.accessibility)
    ? event.accessibility.filter(i => i && i.trim() !== "")
    : [];

  return (
    <TouchableOpacity 
      onPress={onPress} 
      activeOpacity={0.8} 
      style={styles.card} 
    >
      <View style={styles.left}>
        {time ? <Text style={styles.time}>{time}</Text> : <Text style={styles.noTime}>All day</Text>}
      </View>

      <View style={styles.right}>
        <Text style={styles.title}>{event.title}</Text>
        <Text style={styles.meta}>{city}</Text>
          {startDate && (
            endDate && endDate !== startDate
              ? <Text style={styles.duration}>{startDate} → {endDate}</Text>
              : <Text style={styles.duration}>{startDate}</Text>
          )}


        <View style={styles.accessibilityIcons}>
          {nonEmptyAccessibility.includes('wheelchair_accessible') || nonEmptyAccessibility.includes('accesible_silla_ruedas') ? (
            <MaterialCommunityIcons name="wheelchair-accessibility" size={16} color={BLUE} style={{ marginRight: 5 }} />
          ) : null}
          {nonEmptyAccessibility.includes('sober_friendly') || nonEmptyAccessibility.includes('ambiente_sobrio') ? (
            <Image source={alcFreeIcon} style={{ width: 16, height: 16, marginRight: 5 }} resizeMode="contain" />
          ) : null}
          {nonEmptyAccessibility.includes('family_friendly') || nonEmptyAccessibility.includes('amigable_familia') ? (
            <MaterialCommunityIcons name="human-male-female-child" size={16} color="#f38affff" style={{ marginRight: 5 }} />
          ) : null}
        </View>
      </View>

      {/* Make sure this button does NOT trigger the card press */}
      <AddToCalendarButton 
        event={event} 
        selectedDate={selectedDate} 
        style={styles.calendarButton} 
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { 
    flexDirection: "row", 
    padding: 10, 
    marginVertical: 4, 
    borderRadius: 10, 
    backgroundColor: "#fff", 
    borderWidth: 1, 
    borderColor: "#eee", 
    alignItems: "flex-start", 
    position: "relative" 
  },
  left: { width: 70, justifyContent: "flex-start", alignItems: "flex-start" },
  time: { fontWeight: "600", color: "#333" },
  noTime: { fontSize: 12, color: "#999" },
  right: { flex: 1, paddingLeft: 10, paddingRight: 50 },
  title: { fontWeight: "600", fontSize: 15 },
  meta: { color: "#666", marginTop: 2, fontSize: 13 },
  duration: { color: BLUE, fontSize: 12, marginTop: 2 },
  accessibilityIcons: { flexDirection: "row", marginTop: 4 },
  calendarButton: { position: "absolute", top: 10, right: 10, padding: 2 },
});
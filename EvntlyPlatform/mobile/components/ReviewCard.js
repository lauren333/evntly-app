import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

export default function ReviewCard({ review, canEdit = false, onEdit, onDelete, isEditing, isGeneric = false }) {
  const spanishCities = ["Madrid", "Barcelona", "Valencia"];
  const isSpanishCity = spanishCities.includes(review.city);
  const navigation = useNavigation();
  const API_URL = "http://127.0.0.1:5000/api";
  // console.log("Review city:", review.city);
  // console.log("Review event title:", review.event_name);
  
  return (
    <View style={styles.card}>
      {/* Edit text (top-right) - only for user-specific reviews */}
      {canEdit && !isEditing && (
        <TouchableOpacity style={styles.editButton} onPress={() => onEdit(review)}>
          <Text style={styles.editText}>Edit</Text>
        </TouchableOpacity>
      )}
    
      {!isGeneric && (
        <View style={styles.profileBadgeRow}>
          {review.event_name && (
            <View style={[styles.profileBadge, { backgroundColor: "#e7e7e7ff" }]}>
              <Ionicons name="star-outline" size={14} color="#555" />
              <Text style={styles.profileBadgeText}>{review.event_name}</Text>
            </View>
          )}
          {/* {review.event_name && (
            <TouchableOpacity
              style={[styles.profileBadge, { backgroundColor: "#e7e7e7ff" }]}
              onPress={async () => {
                if (!review.event_id) return;

                try {
                  const res = await fetch(`${API_URL}/events/${review.event_id}`);
                  const data = await res.json();

                  // Gracefully handle missing/deleted event
                  if (!data || !data.event) {
                    // Event was deleted or doesn't exist, just do nothing
                    return;
                  }

                  navigation.navigate("EventDetails", {
                    event: data.event,
                    city: data.event.city,
                  });
                } catch (err) {
                  // Fetch failed, ignore so it doesn't break
                  console.log("Error fetching event:", err);
                  return;
                }
              }}
            >
              <Ionicons name="star-outline" size={14} color="#555" />
              <Text style={styles.profileBadgeText}>{review.event_name}</Text>
            </TouchableOpacity>
          )} */}
        </View>
      )}

      {/* Title + Stars inline */}
      <View style={styles.titleRow}>
        <Text style={styles.title}>{review.title}</Text>
        <View style={styles.starsRow}>
          {Array.from({ length: 5 }, (_, i) => (
            <Ionicons
              key={i}
              name={i < review.rating ? "star" : "star-outline"}
              size={16}
              color="black"
              style={{ marginRight: 2 }}
            />
          ))}
        </View>
      </View>

      {/* Comment */}
      <Text style={styles.comment}>{review.comment}</Text>

      {/* Username + City + Date */}
      <View style={styles.userDateRow}>
        <Text style={styles.date}>{new Date(review.created_at).toLocaleDateString()}</Text>
          {!isGeneric ? (
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              {review.city && (
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Ionicons name="location-outline" size={14} color="#555" />
                  <Text style={[styles.username, { backgroundColor: "transparent", marginLeft: 3, }]}>
                    {review.city}
                  </Text>
                </View>
              )}
            </View>
          ) : (
            <Text style={styles.username}>
              {review.username || (isSpanishCity ? "Anónimo" : "Anonymous")}
            </Text>
          )}
      </View>
      {/* Delete button when editing - only for user-specific reviews */}
      {!isGeneric && isEditing && canEdit && (
        <TouchableOpacity onPress={() => onDelete(review)} style={{ marginTop: 4 }}>
          <Text style={styles.deleteText}>Delete Review</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    padding: 5,
    borderRadius: 8,
    marginBottom: 0,
  },
  editButton: {
    alignSelf: "flex-end",
    marginBottom: 4,
  },
  editText: {
    fontSize: 12,
    color: "#0492c2",
    fontWeight: "300",
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  title: {
    fontSize: 15,
    fontWeight: "450",
    color: "#222",
    flex: 1,
  },
  starsRow: {
    flexDirection: "row",
    marginLeft: 8,
  },
  comment: {
    fontSize: 14,
    fontWeight: "300",
    color: "#333",
    marginTop: 4,
  },
  userDateRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  username: { fontWeight: "300", fontSize: 12, color: "#555"},
  date: { fontWeight: "300", fontSize: 12, color: "#666" },
  deleteText: { fontSize: 13, color: "red", fontWeight: "300" },
  badgeRow: {
  flexDirection: "row",
  flexWrap: "wrap",
  marginBottom: 4,
},
profileInfoRow: {
  flexDirection: "row",
  alignItems: "center",
  flexWrap: "wrap",
  marginBottom: 4,
},
profileInfoText: {
  fontSize: 13,
  fontWeight: "500",
  color: "#555",
  marginRight: 6,
},
profileBadgeRow: {
  flexDirection: "row",
  flexWrap: "wrap",
  marginBottom: 4,
},
profileBadge: {
  flexDirection: "row",
  alignItems: "center",
  paddingHorizontal: 8,
  paddingVertical: 4,
  borderRadius: 16, // pill-shaped
  marginRight: 6,
  marginBottom: 4,
},
profileBadgeText: {
  fontSize: 12,
  fontWeight: "500",
  color: "#333",
  marginLeft: 4, // spacing after icon
},
userDateRow: {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center", // <- center vertically
  marginTop: 0,
},
});
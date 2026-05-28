import React, { useState, useEffect } from "react";
import { View, ScrollView, TextInput, Text, TouchableOpacity, Modal } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const BLUE = "#0492c2";
const API_URL = "http://127.0.0.1:5000/api";

export default function EditReviewModal({ visible, onClose, review, user, onUpdate, onDelete, eventId, city, eventName }) {
  const [nameInput, setNameInput] = useState(review?.username || user?.displayName || "");
  const [commentInput, setCommentInput] = useState(review?.comment || "");
  const [rating, setRating] = useState(review?.rating || 0);
  const [reviewTitle, setReviewTitle] = useState(review?.title || "");

  // Sync state whenever review changes or modal opens
  useEffect(() => {
    if (!visible) return;
    setNameInput(review?.username || user?.displayName || "");
    setCommentInput(review?.comment || "");
    setRating(review?.rating || 0);
    setReviewTitle(review?.title || "");
  }, [review, user, visible]);

  const handleSubmit = async () => {
    if (!user || !commentInput.trim()) {
      alert("Please write a review");
      return;
    }

    try {
      const idToken = await user.getIdToken();
      let res, data;

      if (review) {
        res = await fetch(`${API_URL}/reviews/${review._id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
          body: JSON.stringify({
            comment: commentInput,
            rating,
            username: nameInput,
            title: reviewTitle,
          }),
        });
        data = await res.json();
        
        if (data.review && onUpdate) {
          onUpdate(data.review);
        }
      } else {
        res = await fetch(`${API_URL}/reviews`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
          body: JSON.stringify({
            event_id: eventId,
            comment: commentInput,
            rating,
            username: nameInput,
            title: reviewTitle,
            city,
            event_name: eventName, 
          }),
        });
        data = await res.json();

        if (data.review && onUpdate) {
          onUpdate({
            ...data.review,
            _id: data.review._id || data.review.id,
            created_at: data.review.created_at || new Date().toISOString(),
          });
        }
      }

      onClose();
    } catch (err) {
      console.error("Error submitting review:", err);
    }
  };

  const handleDelete = async () => {
    if (!user || !review) return;
    try {
      const idToken = await user.getIdToken();
      const res = await fetch(`${API_URL}/reviews/${review._id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${idToken}` },
      });
      const data = await res.json();
      if (data.message && onDelete) onDelete(review);
      onClose();
    } catch (err) {
      console.error("Error deleting review:", err);
    }
  };

  return (
    <Modal visible={visible} animationType="slide">
      <View style={{ flex: 1, backgroundColor: "#fff", padding: 20, paddingTop: 50 }}>
        <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 20 }}>
            <Text style={{ fontSize: 20, fontWeight: "300" }}>{review ? "Edit Review" : "Add Review"}</Text>
            <TouchableOpacity onPress={onClose}><Ionicons name="close" size={28} color="#777" /></TouchableOpacity>
          </View>

          <TextInput
            placeholder="Review Title"
            value={reviewTitle}
            onChangeText={setReviewTitle}
            style={styles.input}
          />

          <TextInput
            placeholder="Your Name"
            value={nameInput}
            onChangeText={setNameInput}
            style={styles.input}
          />

          <View style={{ flexDirection: "row", marginVertical: 12 }}>
            {Array.from({ length: 5 }, (_, i) => (
              <TouchableOpacity key={i} onPress={() => setRating(i + 1)}>
                <Ionicons name={i < rating ? "star" : "star-outline"} size={28} color="#000" style={{ marginRight: 6 }} />
              </TouchableOpacity>
            ))}
          </View>

          <TextInput
            placeholder="Write your review..."
            value={commentInput}
            onChangeText={setCommentInput}
            multiline
            style={[styles.input, { height: 120 }]}
          />

          <TouchableOpacity onPress={handleSubmit} style={styles.addButton}>
            <Text style={styles.addButtonText}>Submit</Text>
          </TouchableOpacity>

          {review && (
            <TouchableOpacity onPress={handleDelete} style={styles.deleteButton}>
              <Ionicons name="trash-outline" size={24} color="#fff" />
              <Text style={styles.deleteButtonText}>Delete Review</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = {
  input: { borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 10, marginBottom: 10, fontWeight: "300" },
  addButton: { backgroundColor: "#eee", padding: 12, borderRadius: 8, alignItems: "center", marginTop: 10 },
  addButtonText: { color: BLUE, fontWeight: "500" },
  deleteButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: BLUE, padding: 12, borderRadius: 8, marginTop: 12 },
  deleteButtonText: { color: "#fff", fontWeight: "500", marginLeft: 8 },
};
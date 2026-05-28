import React, { useState, useEffect } from "react";
import { View, ScrollView, Text, TouchableOpacity, StyleSheet, Modal, TextInput } from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import ReviewCard from "../components/ReviewCard";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';
import EditReviewModal from "../components/EditReviewModal";
import ReviewSearchBar from "../components/ReviewSearchBar";

const BLUE = "#0492c2";
const API_URL = "http://127.0.0.1:5000/api";

export default function ReviewsScreen({ route, navigation }) {
  const { reviews, currentUserId, user, city, genericMode } = route.params;
  // const [localReviews, setLocalReviews] = useState(reviews || []);
  const [localReviews, setLocalReviews] = useState(
    (reviews || []).slice().sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  );
  const [sortOption, setSortOption] = useState("newest");
  const [showModal, setShowModal] = useState(false);
  const [editingReview, setEditingReview] = useState(null);
  const [nameInput, setNameInput] = useState(user?.displayName || "");
  const [anonymous, setAnonymous] = useState(false);
  const [commentInput, setCommentInput] = useState("");
  const [rating, setRating] = useState(0);
  const [reviewTitle, setReviewTitle] = useState("");
  const [filteredReviews, setFilteredReviews] = useState(reviews || []);

  const isSpanishCity = ["Madrid", "Barcelona", "Valencia"].includes(city);
  useFocusEffect(
    useCallback(() => {
      const fetchReviews = async () => {
        try {
          if (genericMode) {
            // Fetch all reviews for this event
            if (!route.params.eventId) return;
            const res = await fetch(`${API_URL}/reviews/event/${route.params.eventId}`);
            const data = await res.json();
            if (data.reviews) setLocalReviews(data.reviews);
          } else {
            // Profile page: fetch only the user's reviews (existing logic)
            if (!user) return;
            const idToken = await user.getIdToken();
            const res = await fetch(`${API_URL}/reviews/user`, {
              headers: { Authorization: `Bearer ${idToken}` },
            });
            const data = await res.json();
            if (data.reviews) {
              const sorted = data.reviews
                .slice()
                .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
              setLocalReviews(sorted);
            }
          }
        } catch (err) {
          console.error("Error refreshing reviews:", err);
        }
      };

      fetchReviews();
    }, [user, genericMode, route.params.eventId])
  );

  const avgRating = localReviews.length
    ? localReviews.reduce((sum, r) => sum + r.rating, 0) / localReviews.length
    : 0;

  useEffect(() => {
    setFilteredReviews(localReviews);
  }, [localReviews]);

  useEffect(() => {
    const sorted = [...localReviews].sort((a, b) => {
      switch (sortOption) {
        case "newest": return new Date(b.created_at) - new Date(a.created_at);
        case "oldest": return new Date(a.created_at) - new Date(b.created_at);
        case "highest": return b.rating - a.rating;
        case "lowest": return a.rating - b.rating;
        default: return 0;
      }
    });
    setFilteredReviews(sorted);
  }, [localReviews, sortOption]);
  // Sort reviews
  // const sortedReviews = [...localReviews].sort((a, b) => {
  //   switch (sortOption) {
  //     case "newest": return new Date(b.created_at) - new Date(a.created_at);
  //     case "oldest": return new Date(a.created_at) - new Date(b.created_at);
  //     case "highest": return b.rating - a.rating;
  //     case "lowest": return a.rating - b.rating;
  //     default: return 0;
  //   }
  // });

  const filterOptions = [
    { key: "newest", label: isSpanishCity ? "Recientes" : "Newest" },
    { key: "oldest", label: isSpanishCity ? "Antiguas" : "Oldest" },
    { key: "highest", label: isSpanishCity ? "Mejor valoradas" : "Highest" },
    { key: "lowest", label: isSpanishCity ? "Peor valoradas" : "Lowest" },
  ];

  const renderStars = (avg) => (
    <View style={{ flexDirection: "row", marginLeft: 4 }}>
      {Array.from({ length: 5 }, (_, i) => (
        <Ionicons key={i} name={i < Math.round(avg) ? "star" : "star-outline"} size={16} color="#000" style={{ marginRight: 2 }} />
      ))}
    </View>
  );

  // Open edit modal
  const openEditModal = (review) => {
    setEditingReview(review);
    setNameInput(review.username || "");
    setAnonymous(!review.username);
    setCommentInput(review.comment);
    setRating(review.rating);
    setReviewTitle(review.title || "");
    setShowModal(true);
  };

  // Submit edit
  const handleSubmit = async () => {
    if (!user) return;
    try {
      const idToken = await user.getIdToken();
      if (editingReview) {
        const res = await fetch(`${API_URL}/reviews/${editingReview._id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
          body: JSON.stringify({ comment: commentInput, rating, username: anonymous ? null : nameInput, title: reviewTitle }),
        });
        const data = await res.json();
        if (data.message) {
          setLocalReviews(prev => prev.map(r =>
            r._id === editingReview._id
              ? { ...r, comment: commentInput, rating, username: anonymous ? null : nameInput, title: reviewTitle }
              : r
          ));
        }
      }
      setShowModal(false);
    } catch (err) {
      console.error("Error editing review:", err);
    }
  };

  // Delete review
  const handleDelete = async () => {
    if (!editingReview || !user) return;
    try {
      const idToken = await user.getIdToken();
      const res = await fetch(`${API_URL}/reviews/${editingReview._id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${idToken}` },
      });
      const data = await res.json();
      if (data.message) {
        setLocalReviews(prev => prev.filter(r => r._id !== editingReview._id));
        setShowModal(false);
      }
    } catch (err) {
      console.error("Error deleting review:", err);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>

      {/* HEADER */}
      <View style={styles.headerContainer}>
        <View style={styles.header}>
          <Text style={styles.headerText}>
            {isSpanishCity ? "Todas las Reseñas" : "All Reviews"}
          </Text>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="close" size={28} color="#777" />
          </TouchableOpacity>
        </View>

        {genericMode && (
          <View style={{ marginBottom: 0 }}>
            <Text style={styles.overviewLabel}>
              {isSpanishCity ? "Resumen" : "Overview"}
            </Text>
            <View style={styles.overviewBox}>
              <Text style={styles.overviewText}>
                {avgRating.toFixed(1)} {isSpanishCity ? "estrellas" : "stars"} |{" "}
                {localReviews.length} {isSpanishCity ? "opiniones" : "reviews"}
              </Text>
              {renderStars(avgRating)}
            </View>
          </View>
        )}

        {!genericMode && (
          <Text style={{ fontSize: 14, fontWeight: "300", color: "#555", marginBottom: 10, marginTop: 0 }}>
            {localReviews.length} {isSpanishCity ? "opiniones" : "reviews"}
          </Text>
        )}

        {/* Sort-by bubbles */}
        <View style={styles.filtersRow}>
          {filterOptions.map(opt => (
            <TouchableOpacity
              key={opt.key}
              onPress={() => setSortOption(opt.key)}
              style={[styles.filterBubble, sortOption === opt.key && styles.filterActive]}
            >
              <Text style={[styles.filterText, sortOption === opt.key && { color: "#fff" }]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* SEARCH BAR */}
      <View style={styles.searchBarFull}>
        <ReviewSearchBar
          reviews={localReviews}
          sortOption={sortOption}
          onResults={setFilteredReviews}
          isSpanish={isSpanishCity}
          genericMode={genericMode} 
        />
      </View>

      {/* BODY (padded) */}
      <View style={styles.bodyContainer}>
        <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
          {filteredReviews.map(r => (
            <View key={r._id} style={styles.reviewCardWrapper}>
              <ReviewCard
                review={r}
                canEdit={r.user_id === currentUserId}
                onEdit={(rev) => { setEditingReview(rev); setShowModal(true); }}
                onDelete={(rev) => { setEditingReview(rev); setShowModal(true); }}
                isGeneric={genericMode}   
              />
            </View>
          ))}
        </ScrollView>
      </View>

      <EditReviewModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        review={editingReview}
        user={user}
        onUpdate={(updatedReview) => {
          setLocalReviews(prev => prev.map(r => r._id === updatedReview._id ? updatedReview : r));
        }}
        onDelete={(deletedReview) => {
          setLocalReviews(prev => prev.filter(r => r._id !== deletedReview._id));
        }}
      />

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f5f5f5", paddingTop: 20 },
  container: { flex: 1, paddingHorizontal: 16 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  headerText: { fontSize: 21, fontWeight: "300" },
  overviewLabel: { fontSize: 12, fontWeight: "300", color: "#555", marginBottom: 6 },
  overviewBox: { backgroundColor: "#fff", padding: 12, borderRadius: 5, flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12, borderWidth: 1, borderColor: "#000" },
  overviewText: { fontWeight: "350", fontSize: 16 },
  filtersRow: { flexDirection: "row", flexWrap: "wrap", marginBottom: 0 },
  filterBubble: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16, backgroundColor: "#eee", marginRight: 6, marginBottom: 6 },
  filterActive: { backgroundColor: "#777" },
  filterText: { fontSize: 12, color: "#333", fontWeight: "300" },
  reviewCardWrapper: { borderWidth: 1, borderColor: "#000", padding: 8, marginBottom: 8, backgroundColor: "#fff", borderRadius: 5 },
  input: { borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 8, marginBottom: 10, fontWeight: "300" },
  addButton: { backgroundColor: "#eee", padding: 10, borderRadius: 8, alignItems: "center", marginTop: 10 },
  addButtonText: { color: BLUE, fontWeight: "500" },
  deleteButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: BLUE, padding: 10, borderRadius: 8, marginTop: 12 },
  deleteButtonText: { color: "#fff", fontWeight: "500", marginLeft: 8 },
  headerContainer: {
    paddingHorizontal: 16,
  },
  searchBarFull: {
    width: '100%',
    alignSelf: 'center',
  },
  bodyContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
});
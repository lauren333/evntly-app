import React, { useState, useEffect } from "react";
import { View, ScrollView, TouchableOpacity, Text, StyleSheet } from "react-native";
import ReviewCard from "./ReviewCard";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import EditReviewModal from "./EditReviewModal";

const BLUE = "#0492c2";

export default function ReviewSection({
  reviews = [],
  currentUserId,
  showAddButton,
  user,
  event,
  genericMode,
  onAddReview,
  onUpdateReview,
  onDeleteReview
}) {
  const [localReviews, setLocalReviews] = useState(reviews || []);
  const [sortOption, setSortOption] = useState("newest");
  const [showModal, setShowModal] = useState(false);
  const [editingReview, setEditingReview] = useState(null);

  const navigation = useNavigation();
  const REVIEWS_PREVIEW_COUNT = 3;
  const spanishCities = ["Madrid", "Barcelona", "Valencia"];
  const isSpanishCity = spanishCities.includes(event.city);
  const [selectedCity, setSelectedCity] = useState(null);
  
  // // Sync localReviews whenever parent reviews change
  useEffect(() => {
    setLocalReviews(reviews);
  }, [reviews]);
  

  const openAddModal = () => { setEditingReview(null); setShowModal(true); };
  const openEditModal = (review) => { setEditingReview(review); setShowModal(true); };

  // const handleEditUpdate = (updatedReview) => {
  // // If it already exists, replace it; else add new
  //   setLocalReviews(prev => {
  //     const exists = prev.some(r => r._id === updatedReview._id);
  //     if (exists) return prev.map(r => r._id === updatedReview._id ? updatedReview : r);
  //     return [updatedReview, ...prev]; // add new review at top
  //   });
  //   onUpdateReview && onUpdateReview(updatedReview);
  //   setShowModal(false);
  // };
  const handleAddOrUpdateReview = (review) => {
    const exists = localReviews.some(r => r._id === review._id); // check before setState

    setLocalReviews(prev => {
      if (exists) return prev.map(r => r._id === review._id ? review : r);
      return [review, ...prev]; // new review goes at the top
    });

    // Call parent callbacks
    if (exists) {
      onUpdateReview && onUpdateReview(review);
    } else {
      onAddReview && onAddReview(review);
    }
    setShowModal(false);
  };

  const handleEditDelete = (deletedReview) => {
    setLocalReviews(prev => prev.filter(r => r._id !== deletedReview._id));
    onDeleteReview && onDeleteReview(deletedReview);
    setShowModal(false);
  };

  const sortedReviews = [...localReviews].sort((a, b) => {
    switch (sortOption) {
      case "newest": return new Date(b.created_at) - new Date(a.created_at);
      case "oldest": return new Date(a.created_at) - new Date(b.created_at);
      case "highest": return Number(b.rating) - Number(a.rating);
      case "lowest": return Number(a.rating) - Number(b.rating);
      default: return 0;
    }
  });

  const avgRating = localReviews.length ? localReviews.reduce((sum, r) => sum + r.rating, 0) / localReviews.length : 0;

  const filterOptions = [
    { key: "newest", label: isSpanishCity ? "Recientes" : "Newest" },
    { key: "oldest", label: isSpanishCity ? "Antiguas" : "Oldest" },
    { key: "highest", label: isSpanishCity ? "Mejor valoradas" : "Highest" },
    { key: "lowest", label: isSpanishCity ? "Peor valoradas" : "Lowest" },
  ];

  const renderStars = (avg) => (
    <View style={{ flexDirection: "row", marginLeft: 4 }}>
      {Array.from({ length: 5 }, (_, i) => (
        <Ionicons
          key={i}
          name={i < Math.round(avg) ? "star" : "star-outline"}
          size={16}
          color="#000"
          style={{ marginRight: 2 }}
        />
      ))}
    </View>
  );

  return (
    <View style={styles.outerBox}>
      {/* Header */}
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 9 }}>
        <Text style={styles.titleText}>
          {!genericMode ? isSpanishCity ? "Tus reseñas" : "Your Reviews" : isSpanishCity ? "Reseñas" : "Reviews"}
        </Text>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          {localReviews.length > REVIEWS_PREVIEW_COUNT && (
            // <TouchableOpacity
            //   onPress={() => navigation.navigate("ReviewsScreen", { reviews: localReviews, currentUserId, user, city: event.city, genericMode, eventId: event.id })}
            //   style={{ flexDirection: "row", alignItems: "center", marginRight: 8 }}
            // >
            //   <Text style={{ fontSize: 12, color: BLUE, fontWeight: "500" }}>{isSpanishCity ? "Ver todas" : "View All"}</Text>
            // </TouchableOpacity>
            <TouchableOpacity
            onPress={() =>
              navigation.navigate("ReviewsScreen", {
                reviews: localReviews,
                currentUserId,
                user,
                city: event.city,
                genericMode,
                eventId: event.id,
              })
            }
            style={{ flexDirection: "row", alignItems: "center", marginRight: 8,  }}
          >
            <Text style={{ fontSize: 12, color: BLUE, fontWeight: "500", textDecorationLine: "underline"}}>
              {isSpanishCity
                ? genericMode
                  ? `Ver todas`
                  : `Ver todas ${localReviews.length} reseñas`
                : genericMode
                ? `View all`
                : `View all ${localReviews.length} reviews`}
            </Text>
          </TouchableOpacity>
          )}
          {showAddButton && genericMode && (
            <TouchableOpacity onPress={openAddModal}>
              <Ionicons name="create-outline" size={24} color={BLUE} style={{ marginBottom: 4 }} />
            </TouchableOpacity>
          )}
        </View>
      </View>
      {/* For profile, render number of reviews
      {!genericMode && (
        <Text style={{ fontSize: 14, fontWeight: "300", color: "#555", marginBottom: 10 }}> {localReviews.length} {isSpanishCity ? "opiniones" : "reviews"}</Text>
      )} */}
      {/* Overview */}
      {genericMode && (
        <>
          <View style={{ alignItems: "flex-start", marginBottom: 6 }}>
            <Text style={{ fontSize: 12, fontWeight: "300", color: "#555" }}>{isSpanishCity ? "Resumen" : "Overview"}</Text>
          </View>
          <View style={styles.summaryBox}>
            <Text style={{ fontWeight: "350", fontSize: 16 }}>
              {avgRating.toFixed(1)} {isSpanishCity ? "estrellas" : "stars"} | {localReviews.length} {isSpanishCity ? "opiniones" : "reviews"}
            </Text>
            {renderStars(avgRating)}
          </View>
        </>
      )}

      {/* Filters */}
      <View style={styles.filtersRow}>
        {filterOptions.map(opt => (
          <TouchableOpacity
            key={opt.key}
            onPress={() => setSortOption(opt.key)}
            style={[styles.filterBubble, sortOption === opt.key && styles.filterActive]}
          >
            <Text style={[styles.filterText, sortOption === opt.key && { color: "#fff" }]}>{opt.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Reviews */}
      {sortedReviews.slice(0, REVIEWS_PREVIEW_COUNT).map((r, index) => (
        <View key={r._id ? String(r._id) : `review-${index}`} style={styles.reviewCardWrapper}>
          <ReviewCard
            review={r}
            canEdit={r.user_id === currentUserId}
            onEdit={() => openEditModal(r)}
            onDelete={() => handleEditDelete(r)}
            isGeneric={genericMode}
          />
        </View>
      ))}

      {/* Edit/Add Modal */}
      <EditReviewModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        review={editingReview}
        user={user}
        eventId={event.id}
        city={event.city}
        eventName={event.title}
        // onUpdate={handleEditUpdate}
        onUpdate={handleAddOrUpdateReview} 
        onDelete={handleEditDelete}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  outerBox: { backgroundColor: "#f5f5f5", padding: 16, marginTop: 15, marginBottom: 15 },
  titleText: { fontSize: 21, fontWeight: "300" },
  summaryBox: { backgroundColor: "#fff", padding: 12, borderWidth: 1, borderColor: "#000", marginBottom: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderRadius: 5 },
  filtersRow: { flexDirection: "row", flexWrap: "wrap", marginBottom: 8 },
  filterBubble: { paddingHorizontal: 10 , paddingVertical: 6, borderRadius: 16, backgroundColor: "#eee", marginRight: 6, marginBottom: 6 },
  filterActive: { backgroundColor: "#777" },
  filterText: { fontSize: 12, color: "#333", fontWeight: "300" },
  reviewCardWrapper: { borderWidth: 1, borderColor: "#000", padding: 8, marginBottom: 8, backgroundColor: "#fff", borderRadius: 5 },
});
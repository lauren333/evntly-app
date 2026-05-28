import React, { useState, useEffect } from "react";
import { View, Text } from "react-native";
import SearchBar from "./SearchBar";

export default function ReviewSearchBar({
  reviews = [],
  sortOption = "newest",
  onResults,
  isSpanish = false,
  genericMode, 
}) {
  const [query, setQuery] = useState("");

  useEffect(() => {
    const q = query.toLowerCase();

    // 1. FILTER by comment, title, city, event_name, username
    let filtered = reviews.filter(r => {
      return (
        r.comment?.toLowerCase().includes(q) ||
        r.title?.toLowerCase().includes(q) ||
        r.city?.toLowerCase().includes(q) ||
        r.event_name?.toLowerCase().includes(q) ||
        r.username?.toLowerCase().includes(q)
      );
    });

    // 2. SORT
    filtered = filtered.sort((a, b) => {
      switch (sortOption) {
        case "newest": return new Date(b.created_at) - new Date(a.created_at);
        case "oldest": return new Date(a.created_at) - new Date(b.created_at);
        case "highest": return b.rating - a.rating;
        case "lowest": return a.rating - b.rating;
        default: return 0;
      }
    });

    // 3. SEND BACK FINAL RESULTS
    onResults(filtered);

  }, [query, reviews, sortOption]);

// I had it only showing if on the profile but i like it like this better (on both pages)
//   if (genericMode) return null;

  return (
    <View>
      <SearchBar
        query={query}
        onChangeQuery={setQuery}
        placeholder={
            genericMode
            ? isSpanish 
                ? "Buscar por nombre, evento o palabra clave..." 
                : "Search by name, event, or key word..."
            : isSpanish 
                ? "Buscar por ciudad, evento o palabra clave..." 
                : "Search by city, event, or key word..."
        }
      />
    </View>
  );
}
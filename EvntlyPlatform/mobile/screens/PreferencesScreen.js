import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
} from "react-native";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { useNavigation, useRoute } from "@react-navigation/native";

import CATEGORIES from "../utils/categories";

const API_URL = "http://127.0.0.1:5000/api";

export default function PreferencesScreen() {
  const [user, setUser] = useState(null);
  const [preferences, setPreferences] = useState([]);
  const [search, setSearch] = useState("");
  const [filteredCategories, setFilteredCategories] = useState(CATEGORIES);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const navigation = useNavigation();
  const route = useRoute();  
  const firstTime = route.params?.firstTime; 


  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (u) => { 
      if (u) {
        setUser(u);
        // fetchPreferences(u);
        if (!firstTime) {
          // Only fetch existing preferences if not first-time user
          setLoading(true);
          await fetchPreferences(u); // now await works
          setLoading(false);
        } else {
          setLoading(false); // Show the screen without fetching
        }
      } else {
        setUser(null);
        setLoading(false);
      }
    });
    return unsubscribe;
  }, [firstTime]);

  const safeJsonParse = async (res) => {
    try {
      const text = await res.text();
      return text ? JSON.parse(text) : {};
    } catch (e) {
      console.warn("⚠️ JSON parse failed:", e);
      return {};
    }
  };

  const fetchPreferences = async (firebaseUser) => {
    try {
      const token = await firebaseUser.getIdToken();
      const res = await fetch(`${API_URL}/user/preferences`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await safeJsonParse(res);
      if (res.ok) {
        setPreferences(data.preferences || []);
      } else if (data.error === "User not found") {
        // New user, ignore
        setPreferences([]);
      } else {
        console.error("Failed to fetch prefs:", data.error);
      }
    } catch (err) {
      console.error("Fetch error:", err);
      Alert.alert("Error", "Failed to load preferences.");
    } finally {
      setLoading(false);
    }
  };

  const togglePreference = (item) => {
    setPreferences((prev) =>
      prev.includes(item) ? prev.filter((p) => p !== item) : [...prev, item]
    );
  };

  const savePreferences = async () => {
    if (!user) {
      Alert.alert("Error", "User not logged in.");
      return;
    }
    try {
      setSaving(true);
      const token = await user.getIdToken();

      const res = await fetch(`${API_URL}/user/preferences`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ preferences }),
      });

      const data = await safeJsonParse(res);
      if (res.ok) {
        if (firstTime) {
          // if first time, go to Location screen
          navigation.replace("AccessibilityFilters", { firstTime: true });
        } else {
          navigation.replace("MainTabs", { screen: "Profile" });
        }
      } else {
        Alert.alert("Error", data.error || "Failed to save preferences.");
      }
    } catch (err) {
      console.error("Save error:", err);
      Alert.alert("Network Error", err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleExit = () => {
    navigation.navigate("MainTabs", { screen: "Profile" });
  };

  const handleSearch = (text) => {
    setSearch(text);
    const filtered = CATEGORIES.filter((cat) =>
      cat.toLowerCase().includes(text.toLowerCase())
    );
    setFilteredCategories(filtered);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0492c2" />
        <Text>Loading your preferences...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Select Your Preferences</Text>

      <TextInput
        style={styles.searchInput}
        placeholder="Search preferences..."
        value={search}
        onChangeText={handleSearch}
      />

      <View style={styles.preferencesGrid}>
        {filteredCategories.map((item) => (
          <TouchableOpacity
            key={item}
            style={[
              styles.preferenceItem,
              preferences.includes(item) && styles.preferenceSelected,
            ]}
            onPress={() => togglePreference(item)}
          >
            <Text
              style={[
                styles.preferenceText,
                preferences.includes(item) && styles.preferenceTextSelected,
              ]}
            >
              {item}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={styles.saveButton}
        onPress={savePreferences}
        disabled={saving}
      >
        <Text style={styles.saveButtonText}>
          {saving ? "Saving..." : "Save Preferences"}
        </Text>
      </TouchableOpacity>

      {/* Exit Button (same size as Save but gray) */}
      <TouchableOpacity
        style={styles.exitButton}
        onPress={handleExit}
      >
        <Text style={styles.exitButtonText}>Exit</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    paddingTop: 80,
    paddingBottom: 60,
    alignItems: "center",
    backgroundColor: "#f9f9f9",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 20,
  },
  searchInput: {
    width: "80%",
    padding: 10,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    marginBottom: 20,
    backgroundColor: "#fff",
  },
  preferencesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
  },
  preferenceItem: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    margin: 6,
    borderRadius: 20,
    backgroundColor: "#ddd",
  },
  preferenceSelected: {
    backgroundColor: "#0492c2",
  },
  preferenceText: {
    color: "#000",
  },
  preferenceTextSelected: {
    color: "#fff",
    fontWeight: "600",
  },
  saveButton: {
    backgroundColor: "#0492c2",
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 30,
    marginTop: 30,
    width: "70%",
    alignItems: "center",
  },
  saveButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  exitButton: {
    backgroundColor: "#b0b0b0",
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 30,
    marginTop: 15,
    width: "70%",
    alignItems: "center",
  },
  exitButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
});

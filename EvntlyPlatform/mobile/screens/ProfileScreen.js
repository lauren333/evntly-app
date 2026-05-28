import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
  Alert,
  Modal,
  Linking,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { auth, db } from "../firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { Ionicons } from "@expo/vector-icons";
import ReviewSection from "../components/ReviewSection";
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';
import * as Clipboard from "expo-clipboard";

const API_URL = "http://127.0.0.1:5000/api";  

export default function ProfileScreen({ navigation }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [username, setUsername] = useState("");
  const [preferences, setPreferences] = useState([]);
  const [accessibilityFilters, setAccessibilityFilters] = useState([]);
  const [location, setLocations] = useState([]);
  const [joinedDate, setJoinedDate] = useState("");
  const [photoUri, setPhotoUri] = useState(null);
  const [newPhotoUri, setNewPhotoUri] = useState(null);
  const [editingPhoto, setEditingPhoto] = useState(false);
  const [savingPhoto, setSavingPhoto] = useState(false);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const DEFAULT_PHOTO = require("../assets/DefaultPhoto.png");
  const [userReviews, setUserReviews] = useState([]);

  // ---------------- FETCH USER DATA ----------------
  // useEffect(() => {
  //   const fetchUserData = async () => {
  //     const user = auth.currentUser;
  //     if (!user) {
  //       navigation.replace("Login");
  //       return;
  //     }

  //     setCurrentUser(user);
  //     setUsername(user.displayName || user.email || "");
  //     setJoinedDate(new Date(user.metadata.creationTime).toLocaleDateString());

  //     // --- Load photo from Firestore ---
  //     try {
  //       const userDoc = await getDoc(doc(db, "users", user.uid));
  //       if (userDoc.exists()) {
  //         const data = userDoc.data();
  //         if (data.photoBase64) setPhotoUri(data.photoBase64);
  //       } else {
  //         setPhotoUri(user.photoURL || null);
  //       }
  //     } catch (err) {
  //       console.warn("Error fetching Firestore photo:", err);
  //     }

  //     // --- Fetch preferences from Flask backend ---
  //     try {
  //       const token = await user.getIdToken();
  //       const res = await fetch(`${API_URL}/user/preferences`, {
  //         method: "GET",
  //         headers: { Authorization: `Bearer ${token}` },
  //       });

  //       const text = await res.text();
  //       if (!text) return setPreferences([]);

  //       const data = JSON.parse(text);
  //       if (res.ok && data.preferences) {
  //         setPreferences(data.preferences);
  //       } else {
  //         setPreferences([]);
  //       }
  //     } catch (err) {
  //       console.error("Failed to fetch preferences:", err);
  //       setPreferences([]);
  //     }
  //     // --- Fetch accessibility filters from Flask backend ---
  //     try {
  //       const token = await user.getIdToken();
  //       const res = await fetch(`${API_URL}/user/accessibility-filters`, {
  //         method: "GET",
  //         headers: { Authorization: `Bearer ${token}` },
  //       });

  //       const text = await res.text();
  //       if (!text) return setAccessibilityFilters([]);

  //       const data = JSON.parse(text);
  //       if (res.ok && data.filters) {
  //         setAccessibilityFilters(data.filters);
  //       } else {
  //         setAccessibilityFilters([]);
  //       }
  //     } catch (err) {
  //       console.error("Failed to fetch accessibility filters:", err);
  //       setAccessibilityFilters([]);
  //     }
  //     // --- Fetch locations from Flask backend ---
  //     try {
  //       const token = await user.getIdToken();
  //       const res = await fetch(`${API_URL}/user/location`, {
  //         method: "GET",
  //         headers: { Authorization: `Bearer ${token}` },
  //       });

  //       const text = await res.text();
  //       if (!text) return setLocations([]);

  //       const data = JSON.parse(text);
  //       if (res.ok && data.location) {
  //         setLocations(data.location);
  //       } else {
  //         setLocations([]);
  //       }
  //     } catch (err) {
  //       console.error("Failed to fetch locations:", err);
  //       setLocations([]);
  //     }
  //   };
    

  //   fetchUserData();
  // }, [navigation]);
  useEffect(() => {
    const fetchUserData = async () => {
      const user = auth.currentUser;
      if (!user) {
        navigation.replace("Login");
        return;
      }

      setCurrentUser(user);
      setUsername(user.displayName || user.email || "");
      setJoinedDate(new Date(user.metadata.creationTime).toLocaleDateString());

      // --- Load photo from Firestore ---
      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          if (data.photoBase64) setPhotoUri(data.photoBase64);
          else setPhotoUri(user.photoURL || null);
        } else {
          setPhotoUri(user.photoURL || null);
        }
      } catch (err) {
        console.warn("Error fetching Firestore photo:", err);
      }

      // --- Fetch preferences, filters, and location in parallel ---
      try {
        const token = await user.getIdToken();

        const [prefRes, filterRes, locRes] = await Promise.all([
          fetch(`${API_URL}/user/preferences`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API_URL}/user/accessibility-filters`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API_URL}/user/location`, { headers: { Authorization: `Bearer ${token}` } }),
        ]);

        // Parse responses safely
        const prefData = prefRes.ok ? await prefRes.json() : {};
        const filterData = filterRes.ok ? await filterRes.json() : {};
        const locData = locRes.ok ? await locRes.json() : {};

        // Set state with fallbacks to empty arrays
        setPreferences(prefData.preferences || []);
        setAccessibilityFilters(filterData.filters || []);
        setLocations(locData.location || []);
      } catch (err) {
        console.error("Failed to fetch user data:", err);
        // fallback to empty arrays so UI won't break
        setPreferences([]);
        setAccessibilityFilters([]);
        setLocations([]);
      }
    };

    fetchUserData();
  }, [navigation]);

  useFocusEffect(
    useCallback(() => {
      if (userReviews.length > 0) return;
      const fetchUserReviews = async () => {
        if (!currentUser) return;

        try {
          const idToken = await currentUser.getIdToken();
          const res = await fetch(`${API_URL}/reviews/user`, {
            headers: { Authorization: `Bearer ${idToken}` },
          });

          const data = await res.json();

          if (data.reviews) {
            setUserReviews(data.reviews);
          }
        } catch (err) {
          console.error("Error fetching user reviews:", err);
        }
      };

      fetchUserReviews();
    }, [currentUser])
  );

  // ---------------- IMAGE HANDLING ----------------
  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission required", "You need to allow photo library access.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled) {
      setNewPhotoUri(result.assets[0].uri);
    }
  };

  const savePhoto = async () => {
    if (!newPhotoUri || !currentUser) return;
    setSavingPhoto(true);
    try {
      await setDoc(
        doc(db, "users", currentUser.uid),
        { photoBase64: newPhotoUri },
        { merge: true }
      );
      setPhotoUri(newPhotoUri);
      setNewPhotoUri(null);
      setEditingPhoto(false);
      Alert.alert("Profile photo saved!");
    } catch (err) {
      console.error(err);
      Alert.alert("Failed to save photo");
    } finally {
      setSavingPhoto(false);
    }
  };

  // ---------------- ACCOUNT HANDLERS ----------------
  const handleLogout = async () => {
    try {
      await auth.signOut();
      navigation.replace("Login");
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  const handleDeleteAccount = async () => {
    if (!currentUser) return;

    Alert.alert(
      "Delete Account",
      "Are you sure you want to permanently delete your account? This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await setDoc(doc(db, "users", currentUser.uid), {}, { merge: false });
              await currentUser.delete();
              Alert.alert("Account deleted", "Your account has been permanently deleted.");
              navigation.replace("Login");
            } catch (err) {
              console.error("Account deletion failed:", err);
              Alert.alert("Failed to delete account", err.message);
            }
          },
        },
      ]
    );
  };

  const showContactInfo = () => {
    Alert.alert(
      "Contact Support",
      "For any questions or issues, email us at:\npopupproject333@gmail.com",
      [
        {
          text: "Copy Email",
          onPress: async () => {
            await Clipboard.setStringAsync("popupproject333@gmail.com");
            Alert.alert("Copied!", "Email copied to clipboard");
          },
        },
        { text: "OK", style: "cancel" },
      ]
    );
  };

  // ---------------- UI ----------------
  return (
    <View style={{ flex: 1, backgroundColor: "#f9f9f9ff" }}>
      <ScrollView contentContainerStyle={[styles.container, { paddingBottom: 60 }]}>
        <View style={styles.topRow}>
          <View>
            <Text style={styles.username}>{username}</Text>
            <Text style={styles.joinedDate}>Joined: {joinedDate}</Text>
          </View>
          <TouchableOpacity onPress={() => setSettingsVisible(true)}>
            <Ionicons name="settings-outline" size={30} color="#000" />
          </TouchableOpacity>
        </View>

        {/* Profile Image */}
        <TouchableOpacity onPress={() => setEditingPhoto(true)} activeOpacity={0.7}>
          <Image
            source={photoUri ? { uri: photoUri } : DEFAULT_PHOTO}
            style={styles.profileImage}
          />
        </TouchableOpacity>
        {/* Photo Modal */}
        <Modal
          visible={editingPhoto}
          transparent
          animationType="fade"
          onRequestClose={() => setEditingPhoto(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPressOut={() => setEditingPhoto(false)}
          >
            <View style={styles.photoModal}>
              <TouchableOpacity style={styles.modalButton} onPress={pickImage}>
                <Text style={styles.modalText}>Choose New Photo</Text>
              </TouchableOpacity>

              {newPhotoUri && (
                <TouchableOpacity
                  style={styles.modalButton}
                  onPress={savePhoto}
                  disabled={savingPhoto}
                >
                  <Text style={styles.modalText}>
                    {savingPhoto ? "Saving..." : "Save Photo"}
                  </Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={styles.deleteButton}
                onPress={async () => {
                  try {
                    await setDoc(
                      doc(db, "users", currentUser.uid),
                      { photoBase64: "" },
                      { merge: true }
                    );
                    setPhotoUri(null);
                    setEditingPhoto(false);
                    Alert.alert("Photo removed!");
                  } catch (err) {
                    console.error("Failed to remove photo:", err);
                    Alert.alert("Failed to remove photo");
                  }
                }}
              >
                <Text style={styles.modalText}>Remove Photo</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setEditingPhoto(false)}
                style={styles.cancelButton}
              >
                <Text style={styles.modalText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
        <View style={styles.locationWrapper}>
          {location && location.length > 0 ? (
            location.map((loc, i) => (
              <View key={i} style={styles.locationItem}>
                <Ionicons name="location-sharp" size={21} color="#0492c2" />
                <Text style={styles.locationText}>{loc}</Text>
              </View>
            ))
          ) : (
            <Text style={{ color: "#555" }}>No locations set.</Text>
          )}
        </View>
        <View style={styles.preferencesSection}>
          <Text style={styles.sectionHeader}>Your Preferences</Text>
          {preferences.length > 0 ? (
            preferences.map((pref, i) => (
              <Text key={i} style={styles.preferenceItem}>
                • {pref}
              </Text>
            ))
          ) : (
            <Text style={{ color: "#555" }}>No preferences set.</Text>
          )}
        </View>
        {accessibilityFilters.length > 0 && (
          <View style={styles.preferencesSection}>
            <Text style={styles.sectionHeader}>Accessibility Filters</Text>
            {accessibilityFilters.map((filter, i) => (
              <Text key={i} style={styles.preferenceItem}>• {filter}</Text>
            ))}
          </View>
        )}
        <TouchableOpacity
          style={styles.preferencesButton}
          onPress={() => setProfileModalVisible(true)}
        >
          <Text style={styles.preferencesText}>Edit Profile</Text>
        </TouchableOpacity>

        {/* Profile Edit Modal */}
        <Modal
          visible={profileModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setProfileModalVisible(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPressOut={() => setProfileModalVisible(false)}
          >
            <View style={styles.photoModal}>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => {
                  setProfileModalVisible(false);
                  navigation.navigate("Preferences"); // Open preferences screen
                }}
              >
                <Text style={styles.modalText}>Edit Event Preferences</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => {
                  setProfileModalVisible(false);
                  navigation.navigate("AccessibilityFilters");
                }}
              >
                <Text style={styles.modalText}>Edit Accessibility Filters</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => {
                  setProfileModalVisible(false);
                  navigation.navigate("Location"); // Open location/city screen
                }}
              >
                <Text style={styles.modalText}>Edit Default City</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setProfileModalVisible(false)}
              >
                <Text style={styles.modalText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
        {/* Settings Modal */}
        <Modal
          visible={settingsVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setSettingsVisible(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPressOut={() => setSettingsVisible(false)}
          >
            <View style={styles.photoModal}>
              <TouchableOpacity style={styles.modalButton} onPress={handleLogout}>
                <Text style={styles.modalText}>Logout</Text>
              </TouchableOpacity>

             <TouchableOpacity style={styles.modalButton} onPress={showContactInfo}>
                <Text style={styles.modalText}>Contact Support</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteAccount}>
                <Text style={styles.modalText}>Delete Account</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setSettingsVisible(false)}
              >
                <Text style={styles.modalText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal> 

        <View style={{ width: "100%", marginTop: 60, padding: 16}}>
          <ReviewSection
            reviews={userReviews}
            setReviews={setUserReviews} 
            currentUserId={currentUser?.uid}
            showAddButton={true}
            user={currentUser}
            genericMode={false} 
            event={{ city: location?.[0] || "" }} 
            onUpdateReview={(updatedReview) => {
              setUserReviews(prev => {
                const exists = prev.some(r => r._id === updatedReview._id);

                if (exists) {
                  return prev.map(r =>
                    r._id === updatedReview._id ? updatedReview : r
                  );
                }

                return [updatedReview, ...prev]; // fallback (important)
              });
            }}
          />
        </View>
      </ScrollView>
    </View>
  );
}

// ---------------- STYLES ----------------
const styles = StyleSheet.create({
  locationWrapper: {
    width: "87%",
    marginTop: 0,
  },
  locationItem: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 6, 
  },
  locationText: {
    fontWeight: "400",
    color: "#333",
    fontSize: 18, 
    fontWeight: "500",
  },
  container: {
    alignItems: "center",
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    width: "100%",
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "90%",
    alignItems: "center",
    marginBottom: 20,
  },
  username: { fontSize: 24, fontWeight: "500" },
  joinedDate: { fontSize: 14, color: "#555" },
  profileImage: { width: 150, height: 150, borderRadius: 75, marginBottom: 20 },
  preferencesSection: { width: "85%", marginTop: 10, marginBottom: 10 },
  sectionHeader: { fontSize: 18, fontWeight: "500", marginBottom: 8 },
  preferenceItem: { color: "#333", fontSize: 16, marginBottom: 4 },
  preferencesButton: {
    marginTop: 10,
    backgroundColor: "#0492c2",
    padding: 12,
    borderRadius: 25,
    width: "60%",
    alignItems: "center",
  },
  preferencesText: { color: "#fff", fontWeight: "500" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  photoModal: {
    backgroundColor: "#fff",
    width: "80%",
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
  },
  modalButton: {
    width: "90%",
    padding: 15,
    backgroundColor: "#0492c2",
    borderRadius: 15,
    marginVertical: 6,
    alignItems: "center",
  },
  deleteButton: {
    width: "90%",
    padding: 15,
    backgroundColor: "#d9534f",
    borderRadius: 15,
    marginVertical: 6,
    alignItems: "center",
  },
  cancelButton: {
    width: "90%",
    padding: 15,
    backgroundColor: "#b0b0b0",
    borderRadius: 15,
    marginVertical: 6,
    alignItems: "center",
  },
  modalText: { color: "#fff", fontWeight: "500", fontSize: 16 },
});

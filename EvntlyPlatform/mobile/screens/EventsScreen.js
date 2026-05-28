import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  StyleSheet,
  Platform,
  Modal,
  ScrollView,
  Dimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { onAuthStateChanged } from 'firebase/auth';
import { useFocusEffect } from '@react-navigation/native';
const BLUE = "#0492c2";
const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const API_URL = "http://127.0.0.1:5000/api";
import { regions } from '../utils/regions';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import alcFreeIcon from '../assets/alcfree.png'; 
import EventCard from "../components/EventCard";
import { auth } from '../firebase';
import SearchBar from "../components/SearchBar";
import FilterModal from "../components/FilterModal";

export default function EventsScreen({ navigation }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [city, setCity] = useState("");
  const [keyword, setKeyword] = useState("");
  const [filterVisible, setFilterVisible] = useState(false);
  const [savedEventIds, setSavedEventIds] = useState([]); // store saved event ids
  const [user, setUser] = useState(null);
  const [advancedFilterVisible, setAdvancedFilterVisible] = useState(false);
  // Filters
  const [filterWheelchair, setFilterWheelchair] = useState(false);
  const [filterSober, setFilterSober] = useState(false);
  const [filterFamily, setFilterFamily] = useState(false);  
  const [selectedCities, setSelectedCities] = useState([]); //we dont use it but the component needs it as a prop, so we keep track of it here
  const [selectedCategories, setSelectedCategories] = useState([]);

  const [selectedDateFilter, setSelectedDateFilter] = useState(null);
  // Track auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      if (u) setUser(u);
    });
    return unsubscribe;
  }, []);

  // Fetch user's saved events
  const fetchSavedEventsIds = async () => {
    if (!user) return;
    try {
      const token = await user.getIdToken();
      const res = await fetch(`${API_URL}/user/saved-events`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.saved_events) {
        setSavedEventIds(data.saved_events.map(e => e.id));
      }
    } catch (err) {
      console.error('Error fetching saved events:', err);
    }
  };

  // Fetch user's city
  const getCity = async () => {
    if (!user) return;
    try {
      const token = await user.getIdToken();
      const res = await fetch(`${API_URL}/user/location`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const text = await res.text();
      if (!text) {
        setCity('Madrid');
        return;
      }

      const data = JSON.parse(text);
      if (res.ok && data.location && data.location.length > 0) {
        setCity(data.location[0]);
      } else {
        setCity('Madrid');
      }
    } catch (err) {
      console.error('Failed to fetch city:', err);
      setCity('Madrid');
    }
  };

  // Run both when user is ready
  useEffect(() => {
    if (user) {
      fetchSavedEventsIds();
      getCity();
    }
  }, [user]);

  const fetchEvents = async () => {
    if (!city) return;
    setLoading(true);
    try {
      const res = await fetch(
        `http://127.0.0.1:5000/api/events?city=${city}`
      );
      const data = await res.json();
      const rawEvents = data.events || [];

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const filteredEvents = rawEvents.filter(event => {
        if (!event.datetime_local) return false;
        const start = new Date(event.datetime_local);
        start.setHours(0, 0, 0, 0);

        if (event.end_date) {
          const end = new Date(event.end_date);
          end.setHours(0, 0, 0, 0);
          return end >= today;
        } else {
          return start >= today;
        }
      });

      // Apply accessibility filters
      const finalEvents = filteredEvents.filter(event => {
        const accessibility = Array.isArray(event.accessibility) ? event.accessibility : [];

        // Wheelchair
        if (
          filterWheelchair &&
          !accessibility.some(a =>
            ["wheelchair_accessible", "accesible_silla_ruedas"].includes(a)
          )
        ) return false;

        // Sober friendly
        if (
          filterSober &&
          !accessibility.some(a =>
            ["sober_friendly", "ambiente_sobrio"].includes(a)
          )
        ) return false;

        // Family friendly
        if (
          filterFamily &&
          !accessibility.some(a =>
            ["family_friendly", "amigable_familia"].includes(a)
          )
        ) return false;

        return true;
      });

      setEvents(finalEvents); // only set once
    } catch (err) {
      console.error("Error fetching events:", err);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (city) {
      fetchEvents();
    }
  }, [city, filterWheelchair, filterSober, filterFamily]);

const lastFetchRef = useRef({ city: "", keyword: "" });

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      // Only fetch if city or keyword changed since last fetch
      if (!city) return;
      if (
        lastFetchRef.current.city !== city ||
        lastFetchRef.current.keyword !== keyword ||
        events.length === 0
      ) {
        fetchEvents();
        lastFetchRef.current = { city, keyword };
      }
    });
    return unsubscribe;
  }, [navigation, city, keyword, events]);

  
  const toggleSave = async (event) => {
    const isSaved = savedEventIds.includes(event.id);
    
    setSavedEventIds(prev => 
      isSaved 
        ? prev.filter(id => id !== event.id) 
        : [...prev, event.id]
    );

    try {
      const user = auth.currentUser;
      if (!user) return;

      const idToken = await user.getIdToken();
      await fetch('http://127.0.0.1:5000/api/user/saved-events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ id: event.id, source: event.source, action: isSaved ? 'remove' : 'add' }),
      });
      
      // No need to re-fetch the full saved events list
    } catch (err) {
      console.error('Error saving event:', err);
      // Optional: revert the optimistic update if request fails
      setSavedEventIds(prev =>
        isSaved 
          ? [...prev, event.id] 
          : prev.filter(id => id !== event.id)
      );
    }
  };

  // Compute available categories from current filtered events
  const availableCategories = Array.from(
    new Set(events.flatMap(e => e.categories || []).filter(Boolean))
  ).sort(); 

  // Accordion for regions
  const RegionItem = ({ region, onSelectCity }) => {
    const [expanded, setExpanded] = useState(false);

    return (
      <View style={{ width: "100%", marginBottom: 10 }}>
        <TouchableOpacity
          onPress={() => setExpanded(!expanded)}
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            paddingVertical: 8,
          }}
        >
          <Text style={{ fontSize: 16, fontWeight: "600" }}>{region.name}</Text>
          <MaterialIcons
            name={expanded ? "keyboard-arrow-up" : "keyboard-arrow-down"}
            size={20}
            color={BLUE}
          />
        </TouchableOpacity>

        {expanded &&
          region.cities.map((c) => (
            <TouchableOpacity
              key={c}
              onPress={() => onSelectCity(c)}
              style={{ paddingVertical: 6, paddingLeft: 16 }}
            >
              <Text style={{ fontSize: 15 }}>{c}</Text>
            </TouchableOpacity>
          ))}
      </View>
    );
  };


  useFocusEffect(
    React.useCallback(() => {
      const fetchSavedEventsIds = async () => {
        try {
          const user = auth.currentUser;
          if (!user) return;

          const token = await user.getIdToken();

          const res = await fetch('http://127.0.0.1:5000/api/user/saved-events', {
            headers: { Authorization: `Bearer ${token}` },
          });

          const data = await res.json();
          if (data.saved_events) {
            const ids = data.saved_events.map(e => e.id);
            setSavedEventIds(ids);
          }
        } catch (err) {
          console.error('Error fetching saved events:', err);
        }
      };

      fetchSavedEventsIds();
    }, [])
  );

    // const filteredEvents = events.filter((ev) => {
    //   const query = keyword.toLowerCase().trim();

    //   if (!query) return true;

    //   return (
    //     (
    //       (ev.title?.toLowerCase().includes(query) ?? false) ||
    //       (ev.venue?.name?.toLowerCase().includes(query) ?? false) ||
    //       (ev.venue?.city?.toLowerCase().includes(query) ?? false) ||
    //       (ev.venue?.street_address?.toLowerCase().includes(query) ?? false) ||
    //       (ev.location_name?.toLowerCase().includes(query) ?? false) ||
    //       (ev.time?.toLowerCase().includes(query) ?? false) ||
    //       (ev.description
    //         ?.replace(/\s+/g, " ")
    //         .toLowerCase()
    //         .includes(query) ?? false)
    //     )
    //     // Filters go inside the main return parentheses
    //     && (selectedCities.length === 0 || selectedCities.includes(ev.venue?.city))
    //     && (selectedCategories.length === 0 || (ev.categories || []).some(cat => selectedCategories.includes(cat)))
    //   );
    // });  
    const filteredEvents = events.filter((ev) => {
      const query = keyword.toLowerCase().trim();

      // Check keyword match (if any)
      const matchesKeyword =
        !query ||
        (ev.title?.toLowerCase().includes(query) ?? false) ||
        (ev.venue?.name?.toLowerCase().includes(query) ?? false) ||
        (ev.venue?.city?.toLowerCase().includes(query) ?? false) ||
        (ev.venue?.street_address?.toLowerCase().includes(query) ?? false) ||
        (ev.location_name?.toLowerCase().includes(query) ?? false) ||
        (ev.time?.toLowerCase().includes(query) ?? false) ||
        (ev.description?.replace(/\s+/g, " ").toLowerCase().includes(query) ?? false);

      // Check category selection (if any)
      const matchesCategory =
        selectedCategories.length === 0 ||
        (ev.categories || []).some((cat) => selectedCategories.includes(cat));

      const now = new Date();
      now.setHours(0,0,0,0);

      const eventStart = new Date(ev.datetime_local);
      eventStart.setHours(0,0,0,0);

      const eventEnd = ev.end_date
        ? new Date(ev.end_date)
        : eventStart;

      eventEnd.setHours(0,0,0,0);

      let matchesDate = true;

      if (selectedDateFilter === "Today") {
        matchesDate =
          eventStart <= now && eventEnd >= now;
      }

      else if (selectedDateFilter === "Tomorrow") {
        const tomorrow = new Date(now);
        tomorrow.setDate(now.getDate() + 1);

        matchesDate =
          eventStart <= tomorrow && eventEnd >= tomorrow;
      }

      else if (selectedDateFilter === "This Week") {
        const endOfWeek = new Date(now);
        endOfWeek.setDate(now.getDate() + 7);

        matchesDate =
          eventStart <= endOfWeek && eventEnd >= now;
      }

      else if (selectedDateFilter === "Next Week") {
        const startNextWeek = new Date(now);
        startNextWeek.setDate(now.getDate() + 7);

        const endNextWeek = new Date(now);
        endNextWeek.setDate(now.getDate() + 14);

        matchesDate =
          eventStart <= endNextWeek &&
          eventEnd >= startNextWeek;
      }

      else if (selectedDateFilter === "This Weekend") {
        const friday = new Date(now);
        friday.setDate(now.getDate() + ((5 - now.getDay() + 7) % 7));

        const sunday = new Date(friday);
        sunday.setDate(friday.getDate() + 2);

        matchesDate =
          eventStart <= sunday &&
          eventEnd >= friday;
      }
      return matchesKeyword && matchesCategory && matchesDate;
    });


    const renderEvent = ({ item }) => (
    <EventCard
      event={item}
      isSaved={savedEventIds.includes(item.id)}
      showCity={false}
      onToggleSave={toggleSave}
      onPress={() =>
        navigation.push("EventDetails", {
          event: item,
          city,
          isSaved: savedEventIds.includes(item.id),
        })
      }
    />
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.headerContainer}>
        <Text style={styles.header}>Discover Events</Text>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <TouchableOpacity
            style={[styles.filterButton, { marginRight: 0, padding: 2 }]} // filtering 
            onPress={() => setAdvancedFilterVisible(true)}
            activeOpacity={0.7}
          >
            <MaterialIcons name="tune" size={26} color={BLUE} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, { marginRight: 0, padding: 2 }]} // location
            onPress={() => setFilterVisible(true)}
            activeOpacity={0.7}
          >
            <MaterialIcons name="pin-drop" size={26} color={BLUE} />
          </TouchableOpacity>
        </View>
      </View>

      {city && (
        <Text style={styles.currentCity}>
          Showing events in <Text style={ styles.cityName }>{city}</Text>
        </Text>
      )}

      <SearchBar
        query={keyword}
        onChangeQuery={setKeyword}
        placeholder="Search events, venues, time..."
      />

      {loading ? (
        <ActivityIndicator
          size="large"
          color={BLUE}
          style={{ marginTop: 50 }}
        />
      ) : (
        <FlatList
          data={filteredEvents}
          keyExtractor={(item, index) => `${item.source}-${item.id}-${index}`}
          renderItem={renderEvent}
          contentContainerStyle={styles.list}
          ListEmptyComponent={(
            <Text style={styles.noEvents }>
              No events found in {city}. Try a different location.
            </Text>
          )}
        />
      )}

      <Modal
        animationType="slide"
        transparent={true}
        visible={filterVisible}
        onRequestClose={() => setFilterVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[styles.modalContent, { maxHeight: SCREEN_HEIGHT * 0.85 }]}
          >
            <Text style={styles.modalTitle}>Select Region & City</Text>

            {/* Scrollable region list */}
            <ScrollView
              style={{ width: "100%", marginBottom: 16 }}
              contentContainerStyle={{ paddingBottom: 20 }}
            >
              {regions.map((region) => (
                <RegionItem
                  key={region.name}
                  region={region}
                  onSelectCity={(cityName) => {
                    setCity(cityName);
                    setFilterVisible(false);
                    setKeyword("");        
                    setFilterWheelchair(false);
                    setFilterSober(false);
                    setFilterFamily(false);
                    setSelectedCategories([]);
                    setSelectedDateFilter(null);
                  }}
                />
              ))}
            </ScrollView>

            {/* Fixed Cancel button */}
            <TouchableOpacity
              onPress={() => setFilterVisible(false)}
              style={{
                alignSelf: "stretch",
                paddingVertical: 14,
                alignItems: "center",
                backgroundColor: "#f1f1f1",
                borderRadius: 12,
                marginTop: 0,
              }}
            >
              <Text style={{ color: BLUE, fontWeight: "500", fontSize: 16 }}>
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      <FilterModal
        visible={advancedFilterVisible}
        onClose={() => setAdvancedFilterVisible(false)}
        filterWheelchair={filterWheelchair}
        setFilterWheelchair={setFilterWheelchair}
        filterSober={filterSober}
        setFilterSober={setFilterSober}
        filterFamily={filterFamily}
        setFilterFamily={setFilterFamily}
        savedEvents={events}        // WE USE ALL EVENTS HERE BC THIS IS GENERAL SAVED EVENTS PAGE
        savedEventsPage={false}      
        showLocation={false}        // hides the location section
        selectedCategories={selectedCategories}        
        setSelectedCategories={setSelectedCategories}
        availableCategories={availableCategories}   
        availableCities={[]}   
        selectedDateFilter={selectedDateFilter}
        setSelectedDateFilter={setSelectedDateFilter}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f8f8f8",  
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "android" ? 30 : 0,
    marginBottom: 10,
  },
  header: {
    fontSize: 26,
    fontWeight: "500",
    color: "#000",
    fontFamily: Platform.OS === "ios" ? "Helvetica" : "sans-serif",
  },
  filterButton: {
    padding: 10,
    backgroundColor: "#f8f8f8", 
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    // shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  // filterIcon: {
  //   fontSize: 31,
  //   paddingBottom: 1,
  //   color: BLUE,
  // },
  input: {
    borderWidth: 0,
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: "#fff",
    fontSize: 16,
    fontWeight: "300",
    fontFamily: Platform.OS === "ios" ? "Helvetica" : "sans-serif",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  list: {
    paddingBottom: 120,
    paddingHorizontal: 16,
  },
  card: {
    flexDirection: "row",
    marginBottom: 16,
    backgroundColor: "#fff",
    borderRadius: 20,
    overflow: "hidden",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    alignItems: "center", // vertically center the children
  },
  imageWrapper: {
    width: 111,
    height: 111,
    justifyContent: "center", // vertical centering
    alignItems: "center", // horizontal centering inside wrapper
    marginLeft: 10, // optional spacing from the left edge
  },
  image: {
    width: 110,
    height: 110,
    borderRadius: 15,
    resizeMode: "cover",
  },
  info: { 
    flex: 1, 
    padding: 12, 
    justifyContent: 'center',
    paddingRight: 40,
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
    fontFamily: Platform.OS === "ios" ? "Helvetica" : "sans-serif",
  },
  venue: {
    color: "#777",
    marginTop: 4,
    fontSize: 14,
    fontWeight: "300",
    fontFamily: Platform.OS === "ios" ? "Helvetica" : "sans-serif",
  },
  source: {
    color: BLUE,
    marginTop: 6,
    fontStyle: "italic",
    fontSize: 13,
    fontWeight: "300",
    fontFamily: Platform.OS === "ios" ? "Helvetica" : "sans-serif",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "85%",
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 6,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "500",
    marginBottom: 16,
    color: "#000",
    fontFamily: Platform.OS === "ios" ? "Helvetica" : "sans-serif",
  },
  modalInput: {
    borderWidth: 0,
    borderRadius: 12,
    width: "100%",
    padding: 12,
    marginBottom: 20,
    backgroundColor: "#f1f1f1",
    fontSize: 16,
    fontWeight: "300",
    fontFamily: Platform.OS === "ios" ? "Helvetica" : "sans-serif",
  },
  button: {
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    width: "100%",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "500",
    fontSize: 16,
    fontFamily: Platform.OS === "ios" ? "Helvetica" : "sans-serif",
  },
  currentCity: {
    paddingHorizontal: 16,
    marginBottom: 8,
    fontSize: 14,
    color: "#666",
  },
  cityName: {
    fontWeight: "600",
    color: BLUE,
  },
  noEvents: {
    textAlign: "center",
    marginTop: 50,
    fontSize: 16,
    color: "#666",
    paddingHorizontal: 20,
  },
});

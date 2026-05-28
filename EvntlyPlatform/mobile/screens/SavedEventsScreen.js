import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, FlatList, ActivityIndicator, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { auth } from '../firebase';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import FilterModal from '../components/FilterModal';
import SearchBar from '../components/SearchBar';
import EventCard from '../components/EventCard';

const BLUE = "#0492c2";

export default function SavedEventsScreen({ navigation }) {
  const [savedEvents, setSavedEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savedEventIds, setSavedEventIds] = useState([]);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [user, setUser] = useState(null);
  const [filterWheelchair, setFilterWheelchair] = useState(false);
  const [filterSober, setFilterSober] = useState(false);
  const [filterFamily, setFilterFamily] = useState(false);
  const [advancedFilterVisible, setAdvancedFilterVisible] = useState(false);
  const [filterLocation, setFilterLocation] = useState('');
  const [selectedCities, setSelectedCities] = useState([]);
  const { height: SCREEN_HEIGHT } = Dimensions.get('window');
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedDateFilter, setSelectedDateFilter] = useState(null);
  // Listen to auth state
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(u => setUser(u));
    return unsubscribe;
  }, []);

  // Fetch saved events from backend
  const fetchSavedEvents = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch('http://127.0.0.1:5000/api/user/saved-events', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.saved_events) {
        const events = data.saved_events.map(ev => ({
          ...ev,
          saved: true,
          title: ev.title || ev.name || 'Untitled Event',
        }));
        setSavedEvents(events);
        setSavedEventIds(events.map(e => e.id));
        await AsyncStorage.setItem('savedEvents', JSON.stringify(events));
      }
    } catch (err) {
      console.error('Error fetching saved events:', err);
    }
    setLoading(false);
  };

  useFocusEffect(
    useCallback(() => {
      if (user) fetchSavedEvents();
        setSearchKeyword('');
        setFilterWheelchair(false);
        setFilterSober(false);
        setFilterFamily(false);
        setSelectedCities([]);
        setSelectedCategories([]);
        setSelectedDateFilter(null);
    }, [user])
  );

  // Toggle save/un-save event
  const toggleSave = async (event) => {
    const isSaved = savedEventIds.includes(event.id);
    const action = isSaved ? 'remove' : 'add';
    try {
      const user = auth.currentUser;
      if (!user) return;
      const token = await user.getIdToken();
      await fetch('http://127.0.0.1:5000/api/user/saved-events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id: event.id, source: event.source, action }),
      });
      const updatedEvents = isSaved
        ? savedEvents.filter(e => e.id !== event.id)
        : [...savedEvents, { ...event, saved: true }];
      setSavedEvents(updatedEvents);
      setSavedEventIds(updatedEvents.map(e => e.id));
      await AsyncStorage.setItem('savedEvents', JSON.stringify(updatedEvents));
    } catch (err) {
      console.error("Error toggling save:", err);
    }
  };

  // // Auto-generate distinct cities from saved events
  // const availableCities = Array.from(
  //   new Set(
  //     savedEvents
  //       .map(e => e.venue?.city)
  //       .filter(Boolean)
  //       .map(c => c.trim())
  //   )
  // ).sort();
  // Filtered events for computing available filter options
  const filteredForOptions = savedEvents.filter(event => {
      const accessibility = Array.isArray(event.accessibility) ? event.accessibility : [];
      return (
        (!filterWheelchair || accessibility.some(a => ["wheelchair_accessible", "accesible_silla_ruedas"].includes(a))) &&
        (!filterSober || accessibility.some(a => ["sober_friendly", "ambiente_sobrio"].includes(a))) &&
        (!filterFamily || accessibility.some(a => ["family_friendly", "amigable_familia"].includes(a)))
      );
    });
    // Step 1: Filter events based on current filters
  const filteredEvents = savedEvents.filter(event => {
    const query = searchKeyword.toLowerCase().trim();

    const keywordMatch =
      (event.title?.toLowerCase().includes(query) ?? false) ||
      (event.venue?.name?.toLowerCase().includes(query) ?? false) ||
      (event.venue?.city?.toLowerCase().includes(query) ?? false) ||
      (event.venue?.street_address?.toLowerCase().includes(query) ?? false) ||
      (event.location_name?.toLowerCase().includes(query) ?? false) ||
      (event.time?.toLowerCase().includes(query) ?? false) ||
      (event.description?.replace(/\s+/g, ' ').toLowerCase().includes(query) ?? false);

    const accessibility = Array.isArray(event.accessibility) ? event.accessibility : [];
    const wheelchairMatch = !filterWheelchair || accessibility.some(a => ["wheelchair_accessible", "accesible_silla_ruedas"].includes(a));
    const soberMatch = !filterSober || accessibility.some(a => ["sober_friendly", "ambiente_sobrio"].includes(a));
    const familyMatch = !filterFamily || accessibility.some(a => ["family_friendly", "amigable_familia"].includes(a));

    const eventCity = (event.venue?.city || '').toLowerCase();
    const selectedCitiesLower = selectedCities.map(c => c.toLowerCase());
    const locationMatch = selectedCities.length === 0 || selectedCitiesLower.includes(eventCity);

    const matchesCategory =
      selectedCategories.length === 0 ||
      (event.categories || []).some(cat => selectedCategories.includes(cat));

    // filtering date 
    const now = new Date();
    now.setHours(0,0,0,0);

    const eventStart = new Date(event.datetime_local);
    eventStart.setHours(0,0,0,0);

    const eventEnd = event.end_date
      ? new Date(event.end_date)
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
    return keywordMatch && wheelchairMatch && soberMatch && familyMatch && locationMatch && matchesCategory && matchesDate;
  });

  // Step 2: Compute available options based on filtered events
  const availableCities = Array.from(
    new Set(filteredEvents.map(e => e.venue?.city).filter(Boolean))
  ).sort();

  const availableCategories = Array.from(
    new Set(filteredEvents.flatMap(e => e.categories || []).filter(Boolean))
  ).sort();
  // // Available cities based on current filtered events
  // const availableCities = Array.from(
  //   new Set(filteredForOptions.map(e => e.venue?.city).filter(Boolean))
  // ).sort();

  // // Available categories based on current filtered events
  // const availableCategories = Array.from(
  //   new Set(filteredForOptions.flatMap(e => e.categories || []).filter(Boolean))
  // ).sort();

  // // Filter events by keyword, accessibility, and location
  // const filteredEvents = savedEvents.filter(event => {
  //   const query = searchKeyword.toLowerCase().trim();

  //   // Keyword search
  //   const keywordMatch =
  //     (event.title?.toLowerCase().includes(query) ?? false) ||
  //     (event.venue?.name?.toLowerCase().includes(query) ?? false) ||
  //     (event.venue?.city?.toLowerCase().includes(query) ?? false) ||
  //     (event.venue?.street_address?.toLowerCase().includes(query) ?? false) ||
  //     (event.location_name?.toLowerCase().includes(query) ?? false) ||
  //     (event.time?.toLowerCase().includes(query) ?? false) ||
  //     (event.description?.replace(/\s+/g, ' ').toLowerCase().includes(query) ?? false);

  //   // Accessibility filters
  //   const accessibility = Array.isArray(event.accessibility) ? event.accessibility : [];
  //   const wheelchairMatch = !filterWheelchair || accessibility.some(a => ["wheelchair_accessible", "accesible_silla_ruedas"].includes(a));
  //   const soberMatch = !filterSober || accessibility.some(a => ["sober_friendly", "ambiente_sobrio"].includes(a));
  //   const familyMatch = !filterFamily || accessibility.some(a => ["family_friendly", "amigable_familia"].includes(a));

  //   // Location filter (selected cities or free-text)
  //   const eventCity = (event.venue?.city || '').toLowerCase();
  //   const selectedCitiesLower = selectedCities.map(c => c.toLowerCase());
  //   const locationMatch =
  //     (selectedCities.length === 0 && !filterLocation) ||
  //     selectedCitiesLower.includes(eventCity) ||
  //     (filterLocation && eventCity.includes(filterLocation.toLowerCase()));

  //   const matchesCategory =
  //     selectedCategories.length === 0 ||
  //     (event.categories || []).some((cat) => selectedCategories.includes(cat));

  //   return keywordMatch && wheelchairMatch && soberMatch && familyMatch && locationMatch && matchesCategory;
  // });

  const renderEvent = ({ item }) => (
    <EventCard
      event={item}
      isSaved={savedEventIds.includes(item.id)}
      showCity={true}
      onToggleSave={toggleSave}
      onPress={() =>
        navigation.push("EventDetails", {
          event: item,
          city: item.venue?.city,
          isSaved: savedEventIds.includes(item.id),
        })
      }
    />
  );

  if (loading && savedEvents.length === 0) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={BLUE} />
        <Text>Loading saved events...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.headerContainer}>
        <Text style={styles.header}>Saved Events</Text>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <TouchableOpacity onPress={() => setAdvancedFilterVisible(true)} style={{ marginRight: 11 }}>
            <MaterialIcons name="tune" size={26} color={BLUE} />
          </TouchableOpacity>
          <FilterModal
            visible={advancedFilterVisible}
            onClose={() => setAdvancedFilterVisible(false)}
            filterWheelchair={filterWheelchair}
            setFilterWheelchair={setFilterWheelchair}
            filterSober={filterSober}
            setFilterSober={setFilterSober}
            filterFamily={filterFamily}
            setFilterFamily={setFilterFamily}
            filterLocation={filterLocation}
            setFilterLocation={setFilterLocation}
            savedEvents={savedEvents}
            selectedCities={selectedCities}
            setSelectedCities={setSelectedCities}
            availableCities={availableCities}
            selectedCategories={selectedCategories}  
            availableCategories={availableCategories}          
            setSelectedCategories={setSelectedCategories}   
            savedEventsPage={true}
            selectedDateFilter={selectedDateFilter}
            setSelectedDateFilter={setSelectedDateFilter}
          />
          <TouchableOpacity onPress={() => navigation.navigate("SavedEventsCalendar", { savedEvents, savedEventIds })}>
            <Ionicons name="calendar-outline" size={26} color={BLUE} />
          </TouchableOpacity>
        </View>
      </View>

      <SearchBar
        query={searchKeyword}
        onChangeQuery={setSearchKeyword}
        placeholder="Search by keyword, time, city..."
      />

      <FlatList
        contentContainerStyle={styles.list}
        data={filteredEvents}
        keyExtractor={(item, index) => `${item.source}-${item.id}-${index}`}
        renderItem={renderEvent}
        ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 20 }}>No saved events found.</Text>}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  headerContainer: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingTop: 8, marginBottom: 4 },
  header: { fontSize: 26, fontWeight: "500", color: "#000", fontFamily: "Helvetica" },
  safeArea: { flex: 1, backgroundColor: '#f8f8f8' },
  list: { paddingHorizontal: 16, paddingBottom: 120 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
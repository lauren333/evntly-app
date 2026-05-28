import React, { useState, useCallback } from "react";
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { auth } from "../firebase";
import EventCardSmall from "../components/EventCard_small";
import { Ionicons } from "@expo/vector-icons";
import SearchBar from "../components/SearchBar";
import FilterModal from "../components/FilterModal";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

const BLUE = "#0492c2";

export default function SavedEventsScreen({ navigation, route }) {
  const initialEvents = route?.params?.savedEvents || [];
  const initialEventIds = route?.params?.savedEventIds || [];

  const [savedEvents, setSavedEvents] = useState(initialEvents);
  const [savedEventIds, setSavedEventIds] = useState(initialEventIds);
  const [searchKeyword, setSearchKeyword] = useState('');

  const [filterWheelchair, setFilterWheelchair] = useState(false);
  const [filterSober, setFilterSober] = useState(false);
  const [filterFamily, setFilterFamily] = useState(false);
  const [selectedCities, setSelectedCities] = useState([]);
  const [advancedFilterVisible, setAdvancedFilterVisible] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedDateFilter, setSelectedDateFilter] = useState(null);

  const fetchSavedEvents = async () => {
    if (savedEvents.length > 0) return;
    try {
      const user = auth.currentUser;
      if (!user) return;

      const token = await user.getIdToken();
      const res = await fetch("http://127.0.0.1:5000/api/user/saved-events", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.saved_events) {
        const events = data.saved_events.map(ev => ({
          ...ev,
          saved: true,
          title: ev.title || ev.name || "Untitled Event",
        }));
        setSavedEvents(events);
        setSavedEventIds(events.map(e => e.id));
      }
    } catch (err) {
      console.error("Error fetching saved events:", err);
    }
  };

  useFocusEffect(
    useCallback(() => {
      // Fetch events
      fetchSavedEvents();
      // Reset filters
      setSearchKeyword('');
      setFilterWheelchair(false);
      setFilterSober(false);
      setFilterFamily(false);
      setSelectedCities([]);
      setSelectedCategories([]);
      setSelectedDateFilter(null); 
    }, [])
  );
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
      matchesDate = eventStart <= now && eventEnd >= now;
    }

    else if (selectedDateFilter === "Tomorrow") {
      const tomorrow = new Date(now);
      tomorrow.setDate(now.getDate() + 1);

      matchesDate = eventStart <= tomorrow && eventEnd >= tomorrow;
    }

    else if (selectedDateFilter === "This Week") {
      const endOfWeek = new Date(now);
      endOfWeek.setDate(now.getDate() + 7);

      matchesDate = eventStart <= endOfWeek && eventEnd >= now;
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

  // // Filter logic including location
  // const filteredEvents = savedEvents.filter(ev => {
  //   const query = searchKeyword.toLowerCase().trim();

  //   const matchesSearch =
  //     (ev.title?.toLowerCase().includes(query) ?? false) ||
  //     (ev.venue?.name?.toLowerCase().includes(query) ?? false) ||
  //     (ev.venue?.city?.toLowerCase().includes(query) ?? false) ||
  //     (ev.venue?.street_address?.toLowerCase().includes(query) ?? false) ||
  //     (ev.location_name?.toLowerCase().includes(query) ?? false) ||
  //     (ev.time?.toLowerCase().includes(query) ?? false) ||
  //     (ev.description?.replace(/\s+/g, " ").toLowerCase().includes(query) ?? false);

  //   const accessibility = Array.isArray(ev.accessibility) ? ev.accessibility : [];
  //   const wheelchairMatch = !filterWheelchair || accessibility.some(a => ["wheelchair_accessible", "accesible_silla_ruedas"].includes(a));
  //   const soberMatch = !filterSober || accessibility.some(a => ["sober_friendly", "ambiente_sobrio"].includes(a));
  //   const familyMatch = !filterFamily || accessibility.some(a => ["family_friendly", "amigable_familia"].includes(a));

  //   // Location match
  //   const eventCity = (ev.venue?.city || '').toLowerCase();
  //   const selectedCitiesLower = selectedCities.map(c => c.toLowerCase());
  //   const locationMatch = selectedCities.length === 0 || selectedCitiesLower.includes(eventCity);

  //   const matchesCategory =
  //     selectedCategories.length === 0 ||
  //     (event.categories || []).some((cat) => selectedCategories.includes(cat)); 

  //   return matchesSearch && wheelchairMatch && soberMatch && familyMatch && locationMatch && matchesCategory;
  // });

  const getNext14DaysEvents = () => {
    const today = new Date();
    const endRange = new Date();
    endRange.setDate(today.getDate() + 14);

    const days = {};
    for (let d = new Date(today); d <= endRange; d.setDate(d.getDate() + 1)) {
      const key = d.toISOString().slice(0, 10);
      days[key] = { date: new Date(d), events: [] };
    }

    filteredEvents.forEach(ev => {
      const start = new Date(ev.datetime_local);
      const end = ev.end_date ? new Date(ev.end_date) : start;
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const key = d.toISOString().slice(0, 10);
        if (days[key]) days[key].events.push(ev);
      }
    });

    return Object.values(days)
      .filter(day => day.events.length > 0)
      .map(day => {
        day.events.sort((a, b) => {
          if (!a.time) return -1;
          if (!b.time) return 1;
          return a.time.localeCompare(b.time);
        });
        return day;
      });
  };

  const days = getNext14DaysEvents();

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.stickyHeader}>
        <View style={styles.headerRow}>
          <Text style={styles.header}>Saved Events</Text>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <TouchableOpacity onPress={() => setAdvancedFilterVisible(true)} style={{ marginRight: 9 }}>
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
              savedEvents={savedEvents}           
              selectedCities={selectedCities}      
              setSelectedCities={setSelectedCities}  
              selectedCategories={selectedCategories}
              setSelectedCategories={setSelectedCategories}
              availableCategories={availableCategories}   
              availableCities={availableCities}   
              selectedDateFilter={selectedDateFilter}
              setSelectedDateFilter={setSelectedDateFilter}
            />
            <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: 0 }}>
              <Ionicons name="list-outline" size={28} color={BLUE} />
            </TouchableOpacity>
          </View>
        </View>
        <SearchBar
          query={searchKeyword}
          onChangeQuery={setSearchKeyword}
          placeholder="Search by keyword, time, city..."
        />
      </View>

      <ScrollView style={styles.container}>
        {days.map(day => (
          <View key={day.date.toISOString()}>
            <Text style={styles.dayHeader}>
              {day.date.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
            </Text>
            <View style={styles.line} />
            {day.events.map(ev => (
              <EventCardSmall
                key={ev.id + day.date}
                event={ev}
                selectedDate={day.date}
                onPress={() => navigation.navigate("EventDetails", {
                  event: ev,
                  city: ev.venue?.city,
                  isSaved: savedEventIds.includes(ev.id),
                })}
              />
            ))}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f8f8f8" },
  container: { flex: 1, paddingHorizontal: 16 },
  dayHeader: { fontSize: 18, fontWeight: "600", marginTop: 20 },
  line: { height: 1, backgroundColor: "#ddd", marginVertical: 6 },
  stickyHeader: { backgroundColor: '#f8f8f8', zIndex: 10, elevation: 5, paddingBottom: 0 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 8, marginBottom: 4 },
  header: { fontSize: 26, fontWeight: '500', color: '#000', fontFamily: 'Helvetica' },
});
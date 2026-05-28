import React, { useEffect, useState } from "react";
import {
  ScrollView,
  View,
  Text,
  Image,
  Linking,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import alcFreeIcon from '../assets/alcfree.png'; 
import { auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import AddToCalendarButton from "../components/AddToCalendarButton";
import ReviewSection from "../components/ReviewSection";
import { useFocusEffect } from '@react-navigation/native';
const API_URL = "http://127.0.0.1:5000/api";
const BLUE = "#0492c2";

export default function EventDetailsScreen({ route, navigation }) {
  const { event, city, isSaved, savedEventIds: initialSavedIds = [] } = route.params;
  const [user, setUser] = useState(null);
  const eventDate = event.datetime_local ? new Date(event.datetime_local) : null;
  // FIRST RENDER: use navigation param (correct from list screen)
  const [savedEventIds, setSavedEventIds] = useState(
    initialSavedIds.length ? initialSavedIds : (isSaved ? [event.id] : [])
  );
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [eventReviews, setEventReviews] = useState([]);

  // Only auth listener, NO saved events fetch (that was causing the flip)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      if (u) setUser(u);
    });
    return unsubscribe;
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      if (eventReviews.length > 0) return;
      if (!event?.id) return;
      const fetchReviews = async () => {
        try {
          const res = await fetch(`${API_URL}/reviews/event/${event.id}`);
          const data = await res.json();
          const sortedReviews = (data.reviews || [])
            .map(r => ({ ...r, _id: r._id || r.id }))
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at)); // newest first
          setEventReviews(sortedReviews);
        } catch (err) {
          console.error("Error fetching reviews:", err);
        }
      };
      fetchReviews();
    }, [event.id, event.source])
  );

  const toggleSave = () => {
    if (!user) return;

    const isSavedNow = savedEventIds.includes(event.id);

    // INSTANT UI update
    setSavedEventIds(prev =>
      isSavedNow ? prev.filter(id => id !== event.id) : [...prev, event.id]
    );

    // Background network call
    (async () => {
      try {
        const idToken = await user.getIdToken();
        await fetch(`${API_URL}/user/saved-events`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({
            id: event.id,
            source: event.source,
            action: isSavedNow ? 'remove' : 'add',
          }),
        });
      } catch (err) {
        console.error('Error saving event:', err);
      }
    })();
  };
    
  const nonEmptyItems = (arr) =>
    Array.isArray(arr) ? arr.filter(item => item != null && item.trim() !== '') : [];

  const capitalizeWords = (str) =>
    str
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');      

  const [selectedAccessibility, setSelectedAccessibility] = useState(null);

  const spanishCities = ["Madrid", "Barcelona", "Valencia"];
  const isSpanishCity = spanishCities.includes(city);
  
  // --- REVIEW HANDLERS ---
  const handleAddReviewForEvent = (newReview) => {
    setEventReviews(prev => [
      { ...newReview, _id: newReview._id || newReview.id, created_at: newReview.created_at || new Date().toISOString(), city: event.city, },
      ...prev
    ]);
    // setShowAddReviewModal(false);
  };

  const handleUpdateReview = (updatedReview) => {
    setEventReviews(prev =>
      prev.map(r => r._id === updatedReview._id ? updatedReview : r)
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    );
  };

  const handleDeleteReview = (deletedReview) => {
    setEventReviews(prev =>
      prev.filter(r => r._id !== deletedReview._id)
    );
  };


  return (
    <SafeAreaView style={styles.safeArea} edges='top'>      
      <ScrollView contentContainerStyle={styles.container}>
        
        {eventDate && (
          <View style={styles.topButtonsRow}>
            <AddToCalendarButton event={event} selectedDate={eventDate} style={{ paddingRight: 6 }}/>
            <TouchableOpacity onPress={toggleSave}>
              <Ionicons
                name={savedEventIds.includes(event.id) ? 'heart' : 'heart-outline'}
                size={28}
                color={savedEventIds.includes(event.id) ? BLUE : '#ccc'}
              />
            </TouchableOpacity>
          </View>
        )}

        {event.image && (
          <Image source={{ uri: event.image }} style={styles.image} />
        )}

        {/* Event title and other info */}
        <Text style={styles.title}>{event.title}</Text>
        <View style={styles.eventInfoContainer}>
          <Text style={styles.eventInfoText}>
            <Text style={styles.eventInfoLabel}>
              {isSpanishCity ? "Duración: " : "Duration: "}
            </Text>
            <Text>
              {event.datetime_local}
              {event.end_date && event.end_date !== event.datetime_local
                ? isSpanishCity
                  ? ` a ${event.end_date}`
                  : ` to ${event.end_date}`
                : ''}
            </Text>
          </Text>
          
          {event.time && (
            <Text style={styles.eventInfoText}>
              <Text style={styles.eventInfoLabel}>{isSpanishCity ? "Hora: " : "Time: "}</Text>
              <Text>{event.time}</Text>
            </Text>
          )}

          {event.venue?.name && (
            <Text style={styles.eventInfoText}>
              <Text style={styles.eventInfoLabel}>{isSpanishCity ? "Lugar: " : "Venue: "}</Text>
              <Text>{event.venue.name}</Text>
            </Text>
          )}

          {event.venue?.street_address && (
            <TouchableOpacity
              style={{ flexDirection: 'row', alignItems: 'center', marginTop: 3 }}
              onPress={() =>
                Linking.openURL(
                  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.venue.street_address + ', ' + event.venue.city)}`
                )
              }
            >
              <MaterialCommunityIcons 
                name="map-marker" 
                size={18} 
                color='#000'
                style={{ marginRight: 6 }} 
              />
              <Text style={[styles.eventInfoText, { color: '#767676ff', fontSize: 16, textDecorationLine: 'underline' }]}>
                {capitalizeWords(event.venue.street_address + ', ' + event.venue.city)}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {event.description && (
          <View style={{ marginTop: 10, marginBottom: 10 }}>
            <Text style={styles.description}>
              {showFullDescription 
                ? event.description 
                : event.description.length > 310 
                  ? event.description.slice(0, 310) + '...' 
                  : event.description
              }
            </Text>

            {event.description.length > 310 && (
              <TouchableOpacity onPress={() => setShowFullDescription(!showFullDescription)}>
                <Text style={styles.readMoreButton}>
                  {showFullDescription ? (isSpanishCity ? 'Leer menos' : 'Read Less') 
                                      : (isSpanishCity ? 'Leer más' : 'Read More')}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {event.performers && event.performers.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{isSpanishCity ? "Artistas: " : "Performers: "}</Text>
            {event.performers.map((p, i) => (
              <Text key={i} style={styles.performer}>{p.name}</Text>
            ))}
          </View>
        )}

        {nonEmptyItems(event.categories).length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{isSpanishCity ? "Categorías: " : "Categories: "}</Text>
            <View style={styles.bubbleContainer}>
              {nonEmptyItems(event.categories).map((cat, i) => (
                <View key={i} style={styles.bubble}>
                  <Text style={styles.bubbleText}>{cat}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {nonEmptyItems(event.accessibility).length > 0 && (
          <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                {nonEmptyItems(event.accessibility).some(tag => 
                  ["accesible_silla_ruedas","ambiente_sobrio","amigable_familia"].includes(tag)
                ) ? "Accesibilidad: " : "Accessibility: "}
              </Text>
          </View>
        )} 
        
        {nonEmptyItems(event.accessibility).length > 0 && (
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 0 }}>
            {nonEmptyItems(event.accessibility).includes('wheelchair_accessible') || 
             nonEmptyItems(event.accessibility).includes('accesible_silla_ruedas') ? (
              <MaterialCommunityIcons name="wheelchair-accessibility" size={35} color="#0492c2" />
            ) : null}

            {nonEmptyItems(event.accessibility).includes('sober_friendly') || 
             nonEmptyItems(event.accessibility).includes('ambiente_sobrio') ? (
              <Image source={alcFreeIcon} style={{ width: 35, height: 35, marginRight: 6 }} resizeMode="contain" />
            ) : null}

            {nonEmptyItems(event.accessibility).includes('family_friendly') || 
             nonEmptyItems(event.accessibility).includes('amigable_familia') ? (
              <MaterialCommunityIcons name="human-male-female-child" size={35} color="#f38affff" />
            ) : null}

            <TouchableOpacity
              onPress={() => setSelectedAccessibility(event.accessibility)}
              style={{
                marginLeft: 8,
                width: 28,
                height: 28,
                borderRadius: 14,
                backgroundColor: '#edededff',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Text style={{ fontWeight: 'bold', color: '#555' }}>?</Text>
            </TouchableOpacity>
          </View>
        )}

        <Modal
          transparent={true}
          visible={selectedAccessibility !== null}
          animationType="fade"
          onRequestClose={() => setSelectedAccessibility(null)}
        >
          <View style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.3)',
            justifyContent: 'center',
            alignItems: 'center',
          }}>
            <View style={{
              backgroundColor: '#fff',
              paddingTop: 30,
              paddingBottom: 20,
              paddingHorizontal: 20,
              borderRadius: 12,
              maxWidth: '80%',
              position: 'relative',
            }}>
              {selectedAccessibility && (() => {
                const tags = nonEmptyItems(selectedAccessibility);
                const englishIntro = "This event has been categorized as:";
                const spanishIntro = "Este evento ha sido categorizado como:";
                const isSpanish = tags.some(tag => ["accesible_silla_ruedas", "ambiente_sobrio", "amigable_familia"].includes(tag));
                return <Text style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 10 }}>{isSpanish ? spanishIntro : englishIntro}</Text>;
              })()}

              {selectedAccessibility && nonEmptyItems(selectedAccessibility).map((tag) => {
                let icon = null;
                let text = '';
                const isSpanishCityTag = ["accesible_silla_ruedas", "ambiente_sobrio", "amigable_familia"].includes(tag);

                switch(tag) {
                  case 'wheelchair_accessible':
                  case 'accesible_silla_ruedas':
                    icon = <MaterialCommunityIcons name="wheelchair-accessibility" size={20} color={BLUE} style={{ marginRight: 6 }} />;
                    text = isSpanishCityTag ? "un evento accesible en silla de ruedas." : "an event that is wheelchair accessible.";
                    break;
                  case 'sober_friendly':
                  case 'ambiente_sobrio':
                    icon = <Image source={alcFreeIcon} style={{ width: 20, height: 20, marginRight: 6 }} resizeMode="contain" />;
                    text = isSpanishCityTag ? "un evento pensado para personas que prefieren un entorno sobrio." : "an event that is suitable for people who prefer a sober-friendly environment.";
                    break;
                  case 'family_friendly':
                  case 'amigable_familia':
                    icon = <MaterialCommunityIcons name="human-male-female-child" size={20} color="#f38aff" style={{ marginRight: 6 }} />;
                    text = isSpanishCityTag ? "un evento amigable para familias." : "a family-friendly event.";
                    break;
                }

                return (
                  <View key={tag} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                    {icon}
                    <Text style={{ fontSize: 14, color: '#333', flexShrink: 1 }}>{text}</Text>
                  </View>
                );
              })}

              <TouchableOpacity
                onPress={() => setSelectedAccessibility(null)}
                style={{
                  position: 'absolute',
                  top: 10,
                  right: 10,
                }}
              >
                <MaterialCommunityIcons name="close" size={22} color={BLUE} />
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        <Text style={styles.source}>{isSpanishCity ? "Fuente: " : "Source: "}{event.source}</Text>

        {event.url && (
          <TouchableOpacity
            style={styles.button}
            onPress={() => Linking.openURL(event.url)}
          >
            <Text style={styles.buttonText}>
              {isSpanishCity 
                ? (event.source !== "ticketmaster" && event.source !== "seatgeek" 
                    ? "Ver más información" 
                    : "Ver entradas") 
                : (event.source !== "ticketmaster" && event.source !== "seatgeek" 
                    ? "View More Information" 
                    : "View Tickets")}
            </Text>
          </TouchableOpacity>
        )}

        {/* Reviews */}
        <View style={{ marginTop:70, marginBottom:40 }}>
          <ReviewSection
            reviews={eventReviews}
            currentUserId={user?.uid}
            showAddButton={true}
            user={user}
            event={event}
            navigation={navigation}
            genericMode={true}
            onAddReview={handleAddReviewForEvent}
            onUpdateReview={handleUpdateReview}
            onDeleteReview={handleDeleteReview}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  container: { padding: 16, paddingTop: 13 },
  image: { width: '100%', height: 250, borderRadius: 12, marginTop: 16 },
  title: { fontSize: 24, fontWeight: '700', color: '#222', marginBottom: 6, lineHeight: 30, marginTop: 16 },
  // date: { fontSize: 16, color: '#555', marginTop: 3 },
  // venue: { fontSize: 16, color: '#666', marginTop: 3 },
  // Add to your existing StyleSheet
  eventInfoContainer: {
    marginTop: 12,
    marginBottom: 12,
  },
  eventInfoText: {
    fontSize: 16,
    color: '#767676ff',
    marginTop: 2,
  },
  eventLinkText: {
    color: BLUE,
    textDecorationLine: 'underline',
  },
  eventInfoLabel: {
    fontWeight: '700', // bold
    color: '#333',     // dark gray
  },
  description: { fontSize: 16, color: '#000000ff', lineHeight: 22 },  
  section: { marginTop: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '500', color: '#000000ff', marginBottom: 6 }, 
    color: '#333',     // dark gray

  performers: { marginTop: 0 },
  performer: { fontSize: 14, color: '#555' },
  bubbleContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8},
  bubble: {
    backgroundColor: BLUE,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginRight: 6,
    marginBottom: 4,
  },
  bubbleText: { color: '#fff', fontSize: 13 },
  source: { color: BLUE, marginTop: 27, fontStyle: 'italic' },
  button: {
    backgroundColor: BLUE,
    padding: 14,
    borderRadius: 10,
    marginTop: 10,
    alignItems: 'center',
  },
  buttonText: { color: '#fff', fontWeight: 'bold' },
  heartContainer: {
    alignItems: 'flex-end',
    backgroundColor: '#fff',
    paddingBottom: 10,
    paddingTop: 0,
    paddingRight: 0,
  },
  topButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end', 
    alignItems: 'center',
    marginBottom: 0,
  },
});

// Do we want to make all the font thinner to match the reviews idk? 
// const styles = StyleSheet.create({
//   safeArea: { flex: 1, backgroundColor: '#fff' },
//   container: { padding: 16, paddingTop: 13 },
//   image: { width: '100%', height: 250, borderRadius: 12, marginTop: 16 },
//   title: { fontSize: 24, fontWeight: '600', color: '#222', marginBottom: 6, lineHeight: 30, marginTop: 16 }, // was 700 → now 600
//   eventInfoContainer: { marginTop: 12, marginBottom: 12 },
//   eventInfoText: { fontSize: 16, color: '#767676ff', marginTop: 2, fontWeight: '300' }, // normal text lighter
//   eventLinkText: { color: BLUE, textDecorationLine: 'underline', fontWeight: '300' },
//   eventInfoLabel: { fontWeight: '600', color: '#333' }, // semi-bold now, was 700
//   description: { fontSize: 16, color: '#000000ff', lineHeight: 22, fontWeight: '300' },  
//   section: { marginTop: 16 },
//   sectionTitle: { fontSize: 16, fontWeight: '500', color: '#333', marginBottom: 8 }, // was 600
//   performers: { marginTop: 12 },
//   performer: { fontSize: 14, color: '#555', fontWeight: '300' }, // lighter
//   bubbleContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
//   bubble: {
//     backgroundColor: BLUE,
//     paddingVertical: 6,
//     paddingHorizontal: 12,
//     borderRadius: 20,
//     marginRight: 6,
//     marginBottom: 4,
//   },
//   bubbleText: { color: '#fff', fontSize: 13, fontWeight: '400' }, // slightly lighter
//   source: { color: BLUE, marginTop: 12, fontStyle: 'italic', fontWeight: '300' },
//   button: {
//     backgroundColor: BLUE,
//     padding: 14,
//     borderRadius: 10,
//     marginTop: 24,
//     alignItems: 'center',
//   },
//   buttonText: { color: '#fff', fontWeight: '600' }, // was bold, now softer
//   heartContainer: {
//     alignItems: 'flex-end',
//     backgroundColor: '#fff',
//     paddingBottom: 10,
//     paddingTop: 0,
//     paddingRight: 0,
//   },
//   topButtonsRow: {
//     flexDirection: 'row',
//     justifyContent: 'flex-end', 
//     alignItems: 'center',
//     marginBottom: 0,
//   },
//   readMoreButton: { fontSize: 16, color: BLUE, fontWeight: '500' },
// });
import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, Image, Dimensions, StyleSheet, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import alcFreeIcon from '../assets/alcfree.png';

const BLUE = "#0492c2";

export default function FilterModal({
  visible,
  onClose,
  filterWheelchair,
  setFilterWheelchair,
  filterSober,
  setFilterSober,
  filterFamily,
  setFilterFamily,
  savedEvents = [],
  selectedCities = [],
  selectedCategories = [],         
  setSelectedCategories,           
  setSelectedCities,
  showLocation = true,
  savedEventsPage = false, 
  availableCities = [],      
  availableCategories = [],  
  selectedDateFilter,
  setSelectedDateFilter, 
}) {
  const { height: SCREEN_HEIGHT } = Dimensions.get('window');

  const eventsForFilter = savedEvents;  

  // // Get all distinct cities
  // const allCities = Array.from(new Set(savedEvents.map(ev => ev.venue?.city).filter(Boolean))).sort();

  // // Get all distinct categories
  // const allCategories = Array.from(
  //   new Set(
  //     eventsForFilter.flatMap(ev => ev.categories || []).filter(Boolean)
  //   )
  // ).sort();
  const allCities = availableCities;         // passed from SavedEventsScreen
  const allCategories = availableCategories; // passed from SavedEventsScreen

  const dateOptions = [
    "Today",
    "Tomorrow",
    "This Week",
    "Next Week",
    "This Weekend",
    "This Month"
  ];
  const toggleDateFilter = (option) => {
    if (selectedDateFilter === option) {
      setSelectedDateFilter(null);
    } else {
      setSelectedDateFilter(option);
    }
  };

  const toggleCity = (city) => {
    if (selectedCities.includes(city)) {
      setSelectedCities(selectedCities.filter(c => c !== city));
    } else {
      setSelectedCities([...selectedCities, city]);
    }
  };

  const toggleCategory = (category) => {
    if (selectedCategories.includes(category)) {
      setSelectedCategories(selectedCategories.filter(c => c !== category));
    } else {
      setSelectedCategories([...selectedCategories, category]);
    }
  };

  const toTitleCase = (str) => {
    if (!str) return '';
    return str
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

//   return (
//     <Modal animationType="slide" transparent={true} visible={visible} onRequestClose={onClose}>
//       <View style={styles.modalOverlay}>
//         <View style={[styles.modalContent, { maxHeight: SCREEN_HEIGHT * 0.85 }]}>

//           {/* Top-right Clear All button */}
//           <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 3 }}>
//             <TouchableOpacity
//               onPress={() => {
//                 setFilterWheelchair(false);
//                 setFilterSober(false);
//                 setFilterFamily(false);
//                 if (showLocation) {
//                   setSelectedCities([]);
//                 }
//                 setSelectedCategories([]);
//                 setSelectedDateFilter(null);
//               }}
//               style={{ padding: 6 }}
//             >
//               <Text style={{ color: BLUE, fontWeight: '500' }}>Reset All Filters</Text>
//             </TouchableOpacity>
//           </View>

//           {/* Accessibility Filters */}
//           <Text style={styles.title}>Accessibility Filters</Text>
//           <View style={styles.line} />

//           <View style={styles.iconRow}>
//             <TouchableOpacity onPress={() => setFilterWheelchair(prev => !prev)}>
//               <View style={[styles.iconCircle, { backgroundColor: filterWheelchair ? BLUE : "#ecececff" }]}>
//                 <MaterialCommunityIcons
//                   name="wheelchair-accessibility"
//                   size={30}
//                   color={filterWheelchair ? '#fff' : '#000'}
//                 />
//               </View>
//             </TouchableOpacity>

//             <TouchableOpacity onPress={() => setFilterSober(prev => !prev)}>
//               <View style={[styles.iconCircle, { backgroundColor: filterSober ? BLUE : "#ecececff" }]}>
//                 <Image source={alcFreeIcon} style={{ width: 25, height: 25 }} resizeMode="contain" />
//               </View>
//             </TouchableOpacity>

//             <TouchableOpacity onPress={() => setFilterFamily(prev => !prev)}>
//               <View style={[styles.iconCircle, { backgroundColor: filterFamily ? BLUE : "#ecececff" }]}>
//                 <MaterialCommunityIcons
//                   name="human-male-female-child"
//                   size={30}
//                   color={filterFamily ? '#fff' : '#000'}
//                 />
//               </View>
//             </TouchableOpacity>
//           </View>

//           {/* Location Section */}
//           {showLocation && allCities.length > 0 && (
//             <>
//               <Text style={styles.title}>Set Location</Text>
//               <View style={styles.line} />
//               <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12 }}>
//                 {allCities.map(city => {
//                   const selected = selectedCities.includes(city);
//                   return (
//                     <TouchableOpacity
//                       key={city}
//                       onPress={() => toggleCity(city)}
//                       style={{
//                         paddingHorizontal: 12,
//                         paddingVertical: 6,
//                         margin: 4,
//                         borderRadius: 12,
//                         backgroundColor: selected ? BLUE : '#ecececff',
//                       }}
//                     >
//                       <Text style={{ color: selected ? '#fff' : '#000' }}>{toTitleCase(city)}</Text>
//                     </TouchableOpacity>
//                   );
//                 })}
//               </View>
//             </>
//           )}

//           {/* Categories Section */}
//           {allCategories.length > 0 && (
//             <>
//               <Text style={styles.title}>Set Categories</Text>
//               <View style={styles.line} />
//               <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12 }}>
//                 {allCategories.map(category => {
//                   const selected = selectedCategories.includes(category);
//                   return (
//                     <TouchableOpacity
//                       key={category}
//                       onPress={() => toggleCategory(category)}
//                       style={{
//                         paddingHorizontal: 12,
//                         paddingVertical: 6,
//                         margin: 4,
//                         borderRadius: 12,
//                         backgroundColor: selected ? BLUE : '#ecececff',
//                       }}
//                     >
//                       <Text style={{ color: selected ? '#fff' : '#000' }}>{toTitleCase(category)}</Text>
//                     </TouchableOpacity>
//                   );
//                 })}
//               </View>
              
//             </>
//           )}
//           {/* Date Section */}
//           <Text style={styles.title}>Set Date</Text>
//           <View style={styles.line} />

//           <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12 }}>
//             {dateOptions.map(option => {
//               const selected = selectedDateFilter === option;

//               return (
//                 <TouchableOpacity
//                   key={option}
//                   onPress={() => toggleDateFilter(option)}
//                   style={{
//                     paddingHorizontal: 12,
//                     paddingVertical: 6,
//                     margin: 4,
//                     borderRadius: 12,
//                     backgroundColor: selected ? BLUE : '#ecececff',
//                   }}
//                 >
//                   <Text style={{ color: selected ? '#fff' : '#000' }}>
//                     {option}
//                   </Text>
//                 </TouchableOpacity>
//               );
//             })}
//           </View>

//           {/* Close button at bottom */}
//           <TouchableOpacity style={[styles.cancelButton, { marginTop: 10 }]} onPress={onClose}>
//             <Text style={[styles.cancelText, { color: BLUE }]}>Close</Text>
//           </TouchableOpacity>

//         </View>
//       </View>
//     </Modal>
//   );
// }

return (
  <Modal animationType="slide" transparent={true} visible={visible} onRequestClose={onClose}>
    <View style={styles.modalOverlay}>
      <View style={[styles.modalContent, { maxHeight: SCREEN_HEIGHT * 0.85 }]}>

        {/* TOP BAR - Reset stays fixed */}
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 3 }}>
          <TouchableOpacity
            onPress={() => {
              setFilterWheelchair(false);
              setFilterSober(false);
              setFilterFamily(false);
              if (showLocation) {
                setSelectedCities([]);
              }
              setSelectedCategories([]);
              setSelectedDateFilter(null);
            }}
            style={{ padding: 6 }}
          >
            <Text style={{ color: BLUE, fontWeight: '500' }}>
              Reset All Filters
            </Text>
          </TouchableOpacity>
        </View>

        {/* SCROLLABLE CONTENT */}
        <ScrollView showsVerticalScrollIndicator={false}>

          {/* Accessibility Filters */}
          <Text style={styles.title}>Accessibility Filters</Text>
          <View style={styles.line} />

          <View style={styles.iconRow}>
            <TouchableOpacity onPress={() => setFilterWheelchair(prev => !prev)}>
              <View style={[styles.iconCircle, { backgroundColor: filterWheelchair ? BLUE : "#ecececff" }]}>
                <MaterialCommunityIcons
                  name="wheelchair-accessibility"
                  size={30}
                  color={filterWheelchair ? '#fff' : '#000'}
                />
              </View>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setFilterSober(prev => !prev)}>
              <View style={[styles.iconCircle, { backgroundColor: filterSober ? BLUE : "#ecececff" }]}>
                <Image source={alcFreeIcon} style={{ width: 25, height: 25 }} resizeMode="contain" />
              </View>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setFilterFamily(prev => !prev)}>
              <View style={[styles.iconCircle, { backgroundColor: filterFamily ? BLUE : "#ecececff" }]}>
                <MaterialCommunityIcons
                  name="human-male-female-child"
                  size={30}
                  color={filterFamily ? '#fff' : '#000'}
                />
              </View>
            </TouchableOpacity>
          </View>

          {/* Location */}
          {showLocation && allCities.length > 0 && (
            <>
              <Text style={styles.title}>Set Location</Text>
              <View style={styles.line} />

              <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12 }}>
                {allCities.map(city => {
                  const selected = selectedCities.includes(city);
                  return (
                    <TouchableOpacity
                      key={city}
                      onPress={() => toggleCity(city)}
                      style={{
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        margin: 4,
                        borderRadius: 12,
                        backgroundColor: selected ? BLUE : '#ecececff',
                      }}
                    >
                      <Text style={{ color: selected ? '#fff' : '#000' }}>
                        {toTitleCase(city)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </>
          )}

          {/* Categories */}
          {allCategories.length > 0 && (
            <>
              <Text style={styles.title}>Set Categories</Text>
              <View style={styles.line} />

              <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12 }}>
                {allCategories.map(category => {
                  const selected = selectedCategories.includes(category);
                  return (
                    <TouchableOpacity
                      key={category}
                      onPress={() => toggleCategory(category)}
                      style={{
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        margin: 4,
                        borderRadius: 12,
                        backgroundColor: selected ? BLUE : '#ecececff',
                      }}
                    >
                      <Text style={{ color: selected ? '#fff' : '#000' }}>
                        {toTitleCase(category)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </>
          )}

          {/* Date */}
          <Text style={styles.title}>Set Date</Text>
          <View style={styles.line} />

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12 }}>
            {dateOptions.map(option => {
              const selected = selectedDateFilter === option;

              return (
                <TouchableOpacity
                  key={option}
                  onPress={() => toggleDateFilter(option)}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    margin: 4,
                    borderRadius: 12,
                    backgroundColor: selected ? BLUE : '#ecececff',
                  }}
                >
                  <Text style={{ color: selected ? '#fff' : '#000' }}>
                    {option}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

        </ScrollView>

        {/* FIXED FOOTER */}
        <TouchableOpacity
          style={[styles.cancelButton, { marginTop: 10 }]}
          onPress={onClose}
        >
          <Text style={[styles.cancelText, { color: BLUE }]}>
            Close
          </Text>
        </TouchableOpacity>

      </View>
    </View>
  </Modal>
);
}

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 16 },
  modalContent: { width: '100%', backgroundColor: '#fff', borderRadius: 20, padding: 20 },
  title: { fontSize: 20, fontWeight: '500', color: '#000', marginBottom: 8, alignSelf: 'flex-start' },
  line: { height: 1, backgroundColor: '#ccc', alignSelf: 'stretch', marginBottom: 20 },
  iconRow: { flexDirection: 'row', justifyContent: 'space-around', width: '100%', marginBottom: 20 },
  iconCircle: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center' },
  cancelButton: { alignSelf: 'stretch', paddingVertical: 14, alignItems: 'center', backgroundColor: '#f1f1f1', borderRadius: 12 },
  cancelText: { color: BLUE, fontWeight: '500', fontSize: 16 },
});
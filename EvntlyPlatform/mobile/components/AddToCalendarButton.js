import React from "react";
import { TouchableOpacity, Alert, Linking } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Calendar from 'expo-calendar';

const BLUE = "#0492c2";

export default function AddToCalendarButton({ event, selectedDate, style }) {
  if (!event || !selectedDate) return null;

  const time = event.time || "";
  // const city = event.venue?.city || "";
  const location = `${event.venue?.street_address || ''}${event.venue?.street_address && event.venue?.city ? ', ' : ''}${event.venue?.city || ''}`;

  const addToCalendar = async () => {
    const hasTime = !!time;

    // Parse local date + time
    const [year, month, day] = selectedDate.toISOString().slice(0, 10).split('-').map(Number);
    let hour = 0, minute = 0;
    if (hasTime) [hour, minute] = time.split(':').map(Number);

    const start = new Date(year, month - 1, day, hour, minute);
    const end = hasTime
      ? new Date(start.getTime() + 60 * 60 * 1000)
      : new Date(year, month - 1, day + 1);

    const title = encodeURIComponent(event.title);
    const locationEncoded = encodeURIComponent(location);
    const details = encodeURIComponent(event.description || '');

    // Google Calendar
    const googleUrl = hasTime
      ? `https://www.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${start.toISOString().replace(/-|:|\.\d\d\d/g,'')}/${end.toISOString().replace(/-|:|\.\d\d\d/g,'')}&details=${details}&location=${locationEncoded}`
      : `https://www.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${start.toISOString().slice(0,10).replace(/-/g,'')}/${end.toISOString().slice(0,10).replace(/-/g,'')}&details=${details}&location=${locationEncoded}`;

    // Outlook
    const outlookUrl = hasTime
      ? `https://outlook.office.com/calendar/deeplink/compose?subject=${title}&startdt=${start.toISOString()}&enddt=${end.toISOString()}&body=${details}&location=${locationEncoded}`
      : `https://outlook.office.com/calendar/deeplink/compose?subject=${title}&startdt=${start.toISOString().slice(0,10)}&enddt=${end.toISOString().slice(0,10)}&body=${details}&location=${locationEncoded}`;

    // Apple Calendar
    const addAppleEvent = async () => {
      try {
        const { status } = await Calendar.requestCalendarPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert("Permission denied", "Cannot access Apple Calendar.");
          return;
        }
        const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
        const defaultCal = calendars.find(cal => cal.allowsModifications) || calendars[0];
        await Calendar.createEventAsync(defaultCal.id, {
          title: event.title,
          startDate: start,
          endDate: hasTime ? end : new Date(year, month - 1, day + 1),
          location: location,
          notes: event.description || "",
          allDay: !hasTime,
        });
        Alert.alert("Added!", "Event added to Apple Calendar.");
      } catch (err) {
        console.warn("Error adding to Apple Calendar:", err);
        Alert.alert("Error", "Could not add event to Apple Calendar.");
      }
    };

    Alert.alert("Add to calendar", "Which calendar would you like to add this event to?", [
      { text: "Google Calendar", onPress: () => Linking.openURL(googleUrl) },
      { text: "Apple Calendar", onPress: addAppleEvent },
      { text: "Outlook", onPress: () => Linking.openURL(outlookUrl) },
      { text: "Cancel", style: "cancel" }
    ]);
  };

  return (
    <TouchableOpacity
      style={style}
      onPress={addToCalendar}
      accessible
      accessibilityLabel="Add event to calendar"
      accessibilityHint="Opens your calendar app to save this event"
    >
      <Ionicons name="add-circle-outline" size={24} color={BLUE} />
    </TouchableOpacity>
  );
}
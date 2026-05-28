import React, { useState } from "react";
import { View, TextInput, Text, Alert, Image, TouchableOpacity, StyleSheet, Platform } from "react-native";
import { auth, db, syncUserToMongoDB } from "../firebase";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons"; 

export default function RegisterScreen({ navigation }) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleRegister = async () => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await updateProfile(user, { displayName: username });
      await setDoc(doc(db, "users", user.uid), { username, email });

      await syncUserToMongoDB(user);

      Alert.alert("Account created!", `Welcome ${username}`);
      navigation.replace("Preferences", { firstTime: true });
    } catch (error) {
      Alert.alert("Registration failed", error.message);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0492c2', '#00c6ff']}
        style={styles.logoContainer}
      >
        <Image
          source={require("../assets/logo.png")}
          style={styles.logo}
          resizeMode="contain"
        />
      </LinearGradient>

      <Text style={styles.headerText}>Register</Text>

      <TextInput
        style={styles.input}
        placeholder="Username"
        value={username}
        onChangeText={setUsername}
      />

      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      {/* Password input with eye icon toggle */}
      <View style={styles.passwordContainer}>
        <TextInput
          style={styles.inputPassword}
          placeholder="Password"
          value={password}
          secureTextEntry={!showPassword}
          onChangeText={setPassword}
        />
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => setShowPassword(!showPassword)}
        >
          <Ionicons
            name={showPassword ? "eye" : "eye-off"}
            size={24}
            color="#0492c2"
          />
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.button} onPress={handleRegister}>
        <Text style={styles.buttonText}>Register</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.switchButton}
        onPress={() => navigation.replace("Login")}
      >
        <Text style={styles.switchButtonText}>Already have an account? Login</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f0f4f7",
    justifyContent: "flex-start",
    alignItems: "center",
    padding: 20,
    paddingTop: 60,
  },
  logoContainer: {
    width: 150,
    height: 150,
    marginTop: 40,
    marginBottom: 70,
    borderRadius: 75,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 8,
  },
  logo: { width: 100, height: 100 },
  headerText: {
    fontSize: 28,
    fontWeight: "500",
    fontFamily: Platform.OS === "ios" ? "Helvetica" : "sans-serif",
    color: "#000",
    marginBottom: 20,
  },
  input: {
    width: "100%",
    backgroundColor: "#fff",
    padding: 15,
    marginVertical: 10,
    borderRadius: 30,
    fontSize: 16,
    fontWeight: "300",
    fontFamily: Platform.OS === "ios" ? "Helvetica" : "sans-serif",
    color: "#000",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  passwordContainer: {
    width: "100%",
    position: "relative",
    marginVertical: 10,
    alignItems: "center",
  },
  inputPassword: {
    width: "100%",
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 30,
    fontSize: 16,
    fontWeight: "300",
    fontFamily: Platform.OS === "ios" ? "Helvetica" : "sans-serif",
    color: "#000",
    paddingRight: 50,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  iconButton: {
    position: "absolute",
    right: 15,
    top: 15,
  },
  button: {
    width: "100%",
    backgroundColor: "#0492c2",
    padding: 15,
    borderRadius: 30,
    alignItems: "center",
    marginVertical: 10,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "300",
    fontFamily: Platform.OS === "ios" ? "Helvetica" : "sans-serif",
  },
  switchButton: {
    width: "100%",
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 30,
    alignItems: "center",
    marginTop: 30,
    borderWidth: 1,
    borderColor: "#0492c2",
  },
  switchButtonText: {
    color: "#0492c2",
    fontSize: 16,
    fontWeight: "300",
    fontFamily: Platform.OS === "ios" ? "Helvetica" : "sans-serif",
  },
});

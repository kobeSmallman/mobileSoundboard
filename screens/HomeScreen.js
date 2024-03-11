import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
//app description
const HomeScreen = ({ navigation }) => {
  const showDescriptionAlert = () => {
    Alert.alert(
      "App Description",
      "Welcome to the Soundboard App! This app allows you to:\n\n" +
      "- **Record your own sounds**: Tap the record button to capture new sounds and press stop recording when you're happy with the recording!\n" +
      "- **Play and loop sounds**: Press the triangle play symbol to play sounds and Enable loop for continuous playback.\n" +
      "- **Customize sound labels**: Rename sounds to keep your board organized.\n" +
      "- **Manage your sounds**: Add new sounds from files, recordings and delete unwanted sounds (except the default sounds), and stop all sounds with a single tap.\n" 
      [{ text: "OK", style: "cancel" }]
    );
  };
//main view with the title and buttons to either read description or go to the soundboard part of the app
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to the Soundboard App</Text>
      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Soundboard')}>
        <Text style={styles.buttonText}>Go to Soundboard</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={showDescriptionAlert}>
        <Text style={styles.buttonText}>Read App Description</Text>
      </TouchableOpacity>
    </View>
  );
};
//styles for my landing page
const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#121212', 
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#FFF', 
  },
  button: {
    backgroundColor: '#1E88E5', 
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 25,
    marginVertical: 10, 
    width: '80%', 
    alignItems: 'center', 
  },
  buttonText: {
    color: '#FFF', 
    fontSize: 18, 
    fontWeight: '500', 
  }
});

export default HomeScreen;

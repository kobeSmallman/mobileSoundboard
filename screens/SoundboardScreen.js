import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, StyleSheet, TextInput, ScrollView } from 'react-native';
import { Audio } from 'expo-av';
import * as DocumentPicker from 'expo-document-picker';
import { initDB, addSound, fetchSounds, updateSoundLabel, deleteSound } from '../database/db';
import { LinearGradient } from 'expo-linear-gradient';

//default sounds 
const defaultSoundUris = {
  'Sound1.mp3': require('../assets/sounds/Sound1.mp3'),
  'Sound2.mp3': require('../assets/sounds/Sound2.mp3'),
  'Sound3.mp3': require('../assets/sounds/Sound3.mp3'),
};
//my constants
const SoundboardScreen = () => {
  const [sounds, setSounds] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState(null);
  const [isLooping, setIsLooping] = useState(false);
  const [playbackObjects, setPlaybackObjects] = useState({});

  useEffect(() => {
    initDB();
    fetchSoundsFromDB();
  }, []);
 
 // Fetches sound entries from the database and merges them with predefined default sounds.
 //After fetching these sounds, it merges the fetched sounds array with an array of default sounds defined in the application.
  const fetchSoundsFromDB = async () => {
    fetchSounds((fetchedSounds) => {
      const mergedSounds = [...fetchedSounds, ...Object.keys(defaultSoundUris).map((key, index) => ({
        id: `default-${index}`,
        label: `Default Sound ${index + 1}`,
        uri: key,
        isDefault: true,
      }))];
      setSounds(mergedSounds);
    });
  };
  
 //This function handles the recording button press action. It toggles the recording state between starting and stopping the recording
  const handleRecordPress = async () => {
    if (isRecording) {
      setIsRecording(false);
      await stopRecording();
    } else {
      setIsRecording(true);
      await startRecording();
    }
  };
//This function initiates the audio recording process. first requests permission to use the microphone. 
//then it configures the audio session for recording and starts the recording

  const startRecording = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission to access microphone is required!');
        setIsRecording(false);
        return;
      }
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync(Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY);
      await recording.startAsync();
      setRecording(recording);
    } catch (error) {
      console.log('Error during recording:', error);
      setIsRecording(false);
    }
  };
// This function stops the recording, this function finalizes the recording process by stopping and unloading the recording object
  const stopRecording = async () => {
    if (recording) {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      addSound('New Recording', uri, fetchSoundsFromDB);
      setRecording(null);
    }
  };

// This function is responsible for playing a selected sound
// It checks if the sound file exists and, if so, loads the sound into a playback object and plays it
//If the global loop mode is enabled, it also sets the sound to loop
  const playSound = async (sound) => {
    if (!sound.uri) {
      Alert.alert('Error', 'Sound file not found.');
      return;
    }
  
    try {
      const source = sound.isDefault ? defaultSoundUris[sound.uri] : { uri: sound.uri };
      const { sound: newSound } = await Audio.Sound.createAsync(source);
      
      if (isLooping) {
        await newSound.setIsLoopingAsync(true);
      }
  
      await newSound.playAsync();
  
      // Update the state with the new playback object
      setPlaybackObjects(prevState => ({
        ...prevState,
        [sound.id]: newSound,
      }));
    } catch (error) {
      Alert.alert('Error', 'Cannot play the sound.');
    }
  };
  
  // This function allows users to delete a selected sound from the soundboard, except for the default sounds
  //It identifies the sound by its ID and removes it from the database and then refreshes the list of sounds
  const handleDeleteSound = async (id) => {
    const soundToDelete = sounds.find(sound => sound.id === id);
    if (!soundToDelete.isDefault) {
       deleteSound(id, fetchSoundsFromDB);
    } 
  };
  // This function lets users add new sounds to the soundboard by selecting audio files from their device storage
  // It uses the document picker to allow file selection and adds the selected file to the database
  const handleAddFile = async () => {
    try {
      const pickerResult = await DocumentPicker.getDocumentAsync({ type: 'audio/*' }); 
      if (!pickerResult.canceled && pickerResult.assets && pickerResult.assets.length > 0) {
        const { uri: fileUri, name: fileName } = pickerResult.assets[0];     
        addSound(fileName, fileUri, fetchSoundsFromDB); 
      } else {
        throw new Error('No file URI available from the document picker');
      }
    } catch (error) {
      Alert.alert('Error', `Failed to add file: ${error.message}`);
    }
  };
  // This function toggles the looping state which will loop all selected sounds until disabled.
  const toggleGlobalLoop = async () => {
    setIsLooping(!isLooping);
    const updatedPlaybackObjects = {};
  
    await Promise.all(Object.keys(playbackObjects).map(async (key) => {
      const playbackObject = playbackObjects[key];
      await playbackObject.setIsLoopingAsync(!isLooping);
      updatedPlaybackObjects[key] = playbackObject; // Update each playback object in the new state
    }));
  
    setPlaybackObjects(updatedPlaybackObjects); // Update the state with the modified playback objects
  };
  // This function stops the playback of a currently playing sounds. 
  const stopAllSounds = async () => {
    await Promise.all(Object.values(playbackObjects).map(playbackObject => playbackObject.stopAsync()));
    setPlaybackObjects({}); // Reset playback objects state
  };
  return (
    <View style={styles.container}>
      <ScrollView>
      {sounds.map((sound, index) => (
          <LinearGradient key={sound.id.toString()} colors={['#8E2DE2', '#4A00E0']} style={styles.soundItem}>
            <TextInput
              style={styles.textInput}
              defaultValue={sound.label}
              onBlur={(e) => !sound.isDefault && updateSoundLabel(sound.id, e.nativeEvent.text, fetchSoundsFromDB)}
            />
            <TouchableOpacity onPress={() => playSound(sound)} style={styles.controlButton}>
              <Text style={styles.symbolText}>▶</Text>
            </TouchableOpacity>
            {!sound.isDefault && (
              <TouchableOpacity onPress={() => handleDeleteSound(sound.id)} style={styles.deleteButton}>
                <Text style={styles.symbolText}>🗑️</Text>
              </TouchableOpacity>
            )}
            </LinearGradient>
          ))}
        </ScrollView>
        <View style={styles.controls}>
        <TouchableOpacity onPress={toggleGlobalLoop} style={[styles.button, styles.loopButton]}>
          <Text style={styles.buttonText}>{isLooping ? 'Disable Loop' : 'Enable Loop'}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={stopAllSounds} style={[styles.button, styles.stopButton]}>
          <Text style={styles.buttonText}>Stop All Sounds</Text>
        </TouchableOpacity>
      </View>
        <View style={styles.buttonContainer}>
        <TouchableOpacity onPress={handleRecordPress} style={[styles.button, styles.recordButton]}>
          <Text style={styles.buttonText}>{isRecording ? '■ Stop Recording' : '● Start Recording'}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleAddFile} style={[styles.button, styles.addButton]}>
          <Text style={styles.buttonText}>+ Add File</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
    container: {
      flex: 1,
      paddingTop: 20,
      backgroundColor: '#121212'
    },
    scrollView: {
      marginBottom: 20, 
    },
    soundItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 10,
      padding: 10,
      borderRadius: 5,
      elevation: 2, 
    },
    textInput: {
      flex: 1,
      marginRight: 10,
      color: 'white',
    },
    controlButton: {
      marginHorizontal: 5,
      padding: 8,
    },
    deleteButton: {
      padding: 8,
    },
    symbolText: {
      color: 'white',
      fontSize: 24,
    },
    playButton: {
    marginRight: 10,
    padding: 10,
  },
  deleteButton: {
    padding: 10,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20, 
    marginBottom: 40, 
  },
  button: {
    paddingVertical: 15, 
    paddingHorizontal: 20, 
    alignItems: 'center',
    borderRadius: 8, 
    elevation: 3, 
    shadowOpacity: 0.3, 
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  recordButton: {
    backgroundColor: '#ff5555', 
    flex: 0.45, 
    marginRight: 10, 
  },
  addButton: {
    backgroundColor: '#55ff55', 
    flex: 0.45, 
    marginLeft: 10, 
  },
  loopButton: {
    backgroundColor: '#4CAF50', 
  },
  stopButton: {
    backgroundColor: '#F44336', 
  
  },
  buttonText: {
    color: '#fff',
    fontSize: 18, 
    fontWeight: 'bold',
  },
  symbolText: {
    fontSize: 24,
  },
});

export default SoundboardScreen;
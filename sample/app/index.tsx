import { StyleSheet, Text, TextInput } from 'react-native';
import React, { useState, useEffect } from 'react';
import Anthropic, { ContentBlockDeltaEvent, TextDelta } from 'anthropic-react-native';
import { Button, View } from 'react-native';


import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from "firebase/auth";

// Initialize Firebase
// TODO replace with your Firebase Project config
const firebaseConfig = {
  apiKey: 'AIzaSyAddbefeeNCjWxChVGerxW1lZqDN8XlWUU',
  authDomain: 'openai-react-native.firebaseapp.com',
  projectId: 'openai-react-native',
};

export default function HomeScreen() {
  const [text, setText] = useState<string>('');
  const [client, setClient] = useState<Anthropic | null>(null);
  const [userInput, setUserInput] = useState<string>(''); // New state for user input


  useEffect(() => {
    const initializeClient = async () => {
      initializeApp(firebaseConfig);
      const auth = getAuth();
      const creds = await signInAnonymously(auth);
      const newClient = new Anthropic({
        baseURL: 'https://edge.backmesh.com/v1/proxy/PyHU4LvcdsQ4gm2xeniAFhMyuDl2/5E0H2L4zGG5thXl8FOpA/v1',
        apiKey: await creds.user.getIdToken(),
      });
      setClient(newClient);
    };

    initializeClient();
  }, []);

  const startStreaming = async () => {
    if (!client) return;
    setText('');
    client.messages.stream(
      {
        model: 'claude-3-5-sonnet-20240620',
        messages: [{ role: 'user', content: userInput }],
        max_tokens: 1024,
      },
      {
        onError: (error) => {
          console.error('SSE Error:', error); // Handle any errors here
        },
        onMessageStart: () => {
          setUserInput('');
        },
        onContentBlockDelta: (ev: ContentBlockDeltaEvent) => {
          if (ev.delta.type === 'text_delta') setText((prevText) => prevText + (ev.delta as TextDelta).text);
        },
        onMessageStop: () => {
          console.log('SSE connection for completion closed.'); // Handle when the connection is opened
        },
      }
    );
  };

  return (
      <View style={styles.buttonContainer}>
        <TextInput
          style={styles.input}
          placeholder="Enter your message"
          value={userInput}
          onChangeText={setUserInput}
        />
        <Button title="Start Streaming" onPress={startStreaming} />
        <Text style={styles.header}>chat complete streaming:</Text>
        <Text>{text}</Text>
      </View>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: 'absolute',
  },
  header: {
    marginVertical: 8,
    fontWeight: 'bold',
    fontSize: 18,
  },
  buttonContainer: {
    margin: 16,
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 12,
    paddingHorizontal: 8,
  },
});
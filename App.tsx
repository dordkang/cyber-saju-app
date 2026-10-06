import React from 'react';
import { StatusBar, StyleSheet, Text, View } from 'react-native';

export default function App() {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#090D16" />
      <Text style={styles.title}>🔮 CYBER-SAJU V2.0</Text>
      <Text style={styles.subtitle}>DESIGN STUDIO READY</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090D16',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: '#00FFCC',
    fontSize: 22,
    fontWeight: 'bold',
  },
  subtitle: {
    marginTop: 8,
    color: '#8A99AD',
    fontSize: 13,
  },
});

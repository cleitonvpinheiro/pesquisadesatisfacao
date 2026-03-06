import React from 'react';
import { View, ActivityIndicator } from 'react-native';
// eslint-disable-next-line import/no-unresolved
import AppNavigator from './src/navigation/AppNavigator';
// eslint-disable-next-line import/no-unresolved
import { LanguageProvider } from './src/context/LanguageContext';
import { useFonts, Poppins_400Regular, Poppins_600SemiBold, Poppins_700Bold } from '@expo-google-fonts/poppins';

export default function App() {
  let [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#faab45' }}>
        <ActivityIndicator size="large" color="#ffffff" />
      </View>
    );
  }

  return (
    <LanguageProvider>
      <AppNavigator />
    </LanguageProvider>
  );
}
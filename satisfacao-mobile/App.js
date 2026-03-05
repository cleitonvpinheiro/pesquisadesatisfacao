import React from 'react';
// eslint-disable-next-line import/no-unresolved
import AppNavigator from './src/navigation/AppNavigator';
// eslint-disable-next-line import/no-unresolved
import { LanguageProvider } from './src/context/LanguageContext';

export default function App() {
  return (
    <LanguageProvider>
      <AppNavigator />
    </LanguageProvider>
  );
}
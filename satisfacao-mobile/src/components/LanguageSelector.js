import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useLanguage } from '../context/LanguageContext';

export default function LanguageSelector({ style }) {
  const { language, setLanguage } = useLanguage();

  const languages = [
    { code: 'pt', label: 'PT' },
    { code: 'en', label: 'EN' },
    { code: 'es', label: 'ES' },
  ];

  return (
    <View style={[styles.container, style]}>
      <View style={styles.options}>
        {languages.map((lang) => (
          <TouchableOpacity
            key={lang.code}
            style={[
              styles.option,
              language === lang.code && styles.selectedOption,
            ]}
            onPress={() => setLanguage(lang.code)}
          >
            <Text
              style={[
                styles.optionText,
                language === lang.code && styles.selectedOptionText,
              ]}
            >
              {lang.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  options: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    padding: 2,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  option: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 18,
  },
  selectedOption: {
    backgroundColor: '#4CAF50',
  },
  optionText: {
    color: '#666',
    fontWeight: '600',
    fontSize: 12,
  },
  selectedOptionText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import Svg, { Rect, Path, Circle } from 'react-native-svg';
import { useLanguage } from '../context/LanguageContext';

const FlagBR = ({ size = 20 }) => (
  <Svg width={size} height={size * 0.72} viewBox="0 0 22 16">
    <Rect width="22" height="16" fill="#009c3b" />
    <Path d="M11 2L19 8L11 14L3 8Z" fill="#ffdf00" />
    <Circle cx="11" cy="8" r="3.5" fill="#002776" />
    <Path d="M9 8.5C9 8.5 10 9.5 13 8" stroke="#fff" strokeWidth="0.5" fill="none" />
  </Svg>
);

const FlagUS = ({ size = 20 }) => (
  <Svg width={size} height={size * 0.72} viewBox="0 0 22 16">
    <Rect width="22" height="16" fill="#b22234" />
    <Path d="M0 2H22M0 6H22M0 10H22M0 14H22" stroke="#fff" strokeWidth="2" />
    <Rect width="10" height="9" fill="#3c3b6e" />
    <Path d="M1 1.5h8M1 4.5h8M1 7.5h8" stroke="#fff" strokeWidth="0.5" strokeDasharray="1 1" opacity="0.5" />
  </Svg>
);

const FlagES = ({ size = 20 }) => (
  <Svg width={size} height={size * 0.72} viewBox="0 0 22 16">
    <Rect width="22" height="16" fill="#AA151B" />
    <Rect y="4" width="22" height="8" fill="#F1BF00" />
  </Svg>
);

export default function LanguageSelector({ style }) {
  const { language, setLanguage } = useLanguage();

  const languages = [
    { code: 'pt', Flag: FlagBR },
    { code: 'en', Flag: FlagUS },
    { code: 'es', Flag: FlagES },
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
            <lang.Flag size={24} />
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
    backgroundColor: 'transparent',
    borderRadius: 30,
    padding: 4,
    borderWidth: 0,
    elevation: 0,
  },
  option: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 2,
    opacity: 0.7,
  },
  selectedOption: {
    backgroundColor: '#FAAA46',
    transform: [{ scale: 1.05 }],
    opacity: 1,
    shadowColor: '#FAAA46',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 4,
  },
});

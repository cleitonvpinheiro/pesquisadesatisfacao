import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
// eslint-disable-next-line import/no-unresolved
import { useLanguage } from '../context/LanguageContext';
// eslint-disable-next-line import/no-unresolved
import LanguageSelector from '../components/LanguageSelector';

export default function AvaliacaoScreen() {
    const navigation = useNavigation();
    const { t } = useLanguage();

    const handleSelection = (avaliacao) => {
        navigation.navigate('Questionario', { avaliacaoInicial: avaliacao });
    };

    return (
        <View style={styles.container}>
            <View style={styles.languageContainer}>
                <LanguageSelector />
            </View>
            
            <Image 
                source={require('../../assets/images/logo.png')} 
                style={styles.logo}
                resizeMode="contain"
            />
            <Text style={styles.title}>{t('mainTitle')}</Text>
            
            <TouchableOpacity 
                style={[styles.button, styles.excelenteButton]} 
                onPress={() => handleSelection('excelente')}
            >
                <Text style={styles.buttonText}>😃 {t('excellent')}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
                style={[styles.button, styles.bomButton]} 
                onPress={() => handleSelection('bom')}
            >
                <Text style={styles.buttonText}>😐 {t('good')}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
                style={[styles.button, styles.ruimButton]} 
                onPress={() => handleSelection('ruim')}
            >
                <Text style={styles.buttonText}>😞 {t('bad')}</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'flex-start',
        alignItems: 'center',
        padding: 20,
        paddingTop: 60,
        backgroundColor: '#f5f5f5',
    },
    languageContainer: {
        position: 'absolute',
        top: 50,
        right: 20,
        zIndex: 10,
    },
    logo: {
        width: 300,
        height: 200,
        marginBottom: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 40,
        color: '#333',
    },
    button: {
        width: '100%',
        padding: 20,
        borderRadius: 10,
        alignItems: 'center',
        marginBottom: 15,
        elevation: 3,
    },
    excelenteButton: {
        backgroundColor: '#4CAF50',
    },
    bomButton: {
        backgroundColor: '#FFC107',
    },
    ruimButton: {
        backgroundColor: '#F44336',
    },
    buttonText: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
    },
});

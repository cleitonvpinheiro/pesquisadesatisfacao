import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useLanguage } from '../context/LanguageContext';
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
        backgroundColor: '#faab45',
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
        fontFamily: 'Poppins_700Bold',
        marginBottom: 40,
        color: '#000',
    },
    button: {
        width: '100%',
        padding: 20,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
        elevation: 5,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    excelenteButton: {
        backgroundColor: '#00b894', // Mint Green
    },
    bomButton: {
        backgroundColor: '#Faa45', // Dark Slate Grey
    },
    ruimButton: {
        backgroundColor: '#d63031', // Soft Red
    },
    buttonText: {
        color: '#ffffff',
        fontSize: 22,
        fontWeight: 'bold',
        fontFamily: 'Poppins_700Bold',
        textShadowColor: 'rgba(0, 0, 0, 0.2)',
        textShadowOffset: {width: 1, height: 1},
        textShadowRadius: 3
    },
});

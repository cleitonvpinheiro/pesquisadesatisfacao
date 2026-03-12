import React, { useContext, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Text, TextInput, TouchableOpacity, View, StyleSheet, Alert } from 'react-native';

export default function LoginScreen() {
    const { login } = useContext(AuthContext);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    async function handleLogin() {
        const success = await login(username, password);
        if (!success) {
            Alert.alert('Login failed');
        }
    }

    return (
        <View style={styles.container}>
            <View style={styles.content}>
                <Text style={styles.title}>Login</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Username"
                    value={username}
                    onChangeText={setUsername}
                />
                <TextInput
                    style={styles.input}
                    placeholder="Password"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                />
                <TouchableOpacity style={styles.button} onPress={handleLogin}>
                    <Text style={styles.buttonText}>Login</Text>
                </TouchableOpacity>
            </View>
            <View style={styles.footer}>
                <Text style={styles.footerText}>Desenvolvido por Família Madalosso - Excelência em servir.</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#faab45',
    },
    content: {
        flex: 1,
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        fontFamily: 'Poppins_700Bold',
        marginBottom: 20,
        color: '#000',
    },
    input: {
        width: '100%',
        padding: 10,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#333',
        borderRadius: 5,
        backgroundColor: 'rgba(255,255,255,0.8)',
        color: '#000',
        fontFamily: 'Poppins_400Regular',
    },
    button: {
        width: '100%',
        padding: 10,
        backgroundColor: '#007bff',
        borderRadius: 5,
        alignItems: 'center',
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontFamily: 'Poppins_700Bold',
    },
    footer: {
        width: '100%',
        paddingTop: 12,
        paddingBottom: 6,
        alignItems: 'center',
    },
    footerText: {
        fontSize: 12,
        color: 'rgba(0,0,0,0.7)',
        textAlign: 'center',
        fontFamily: 'Poppins_400Regular',
    },
});

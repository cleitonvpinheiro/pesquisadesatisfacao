import React, { createContext, useState, useEffect } from 'react';
import api from '../services/api';

export const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    async function login(username, password) {
        try {
            const response = await api.get('/check-login');
            setUser(response.data.user);
            return true
        } catch {
            return false
        }
    }

    async function logout() {
        await api.get('/logout');
        setUser(null);
    }
    async function verify() {
        try {
            const response = await api.get('/check-login');
            setUser(response.data.user);
            return true
        } catch {
            setUser(null);
        } finally {
            setLoading(false);
        }
    }
    useEffect(() => {
        verify();
    }, []);

    return (
        <AuthContext.Provider value={{ user, login, logout }}>
            {!loading && children}
        </AuthContext.Provider>
    )

}
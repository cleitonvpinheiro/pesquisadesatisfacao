import React, { createContext, useState, useEffect } from 'react';
import api from '../services/api';

export const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    async function login(username, password) {
        try {
            const response = await api.post('/login', { username, password });
            if (response.data.success) {
                setUser(response.data.user);
                return true;
            }
            return false;
        } catch (error) {
            console.error("Login error:", error);
            return false;
        }
    }

    async function logout() {
        try {
            await api.post('/logout');
        } catch (error) {
            console.error("Logout error:", error);
        }
        setUser(null);
    }

    async function verify() {
        try {
            const response = await api.get('/verify-auth');
            if (response.data.success) {
                setUser(response.data.user);
                return true;
            }
        } catch {
            // Silently fail if not authenticated
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
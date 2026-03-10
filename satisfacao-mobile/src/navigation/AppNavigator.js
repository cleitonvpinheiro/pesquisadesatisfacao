import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AvaliacaoScreen from '../screens/AvaliacaoScreen';
import QuestionarioScreen from '../screens/QuestionarioScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
    return (
        <NavigationContainer>
            <Stack.Navigator initialRouteName="Avaliacao">
                <Stack.Screen 
                    name="Avaliacao" 
                    component={AvaliacaoScreen} 
                    options={{ title: 'Avaliação', headerShown: false }} 
                />
                <Stack.Screen 
                    name="Questionario" 
                    component={QuestionarioScreen} 
                    options={{ title: 'Questionário', headerShown: false }} 
                />
            </Stack.Navigator>
        </NavigationContainer>
    );
}

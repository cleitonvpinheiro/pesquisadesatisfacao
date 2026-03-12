import React, { useEffect, useState } from 'react';
import { View, Text, Dimensions, StyleSheet } from 'react-native';
import { PieChart } from 'react-native-chart-kit';
import api from '../services/api';

export default function DashboardScreen() {
    const [data, setData] = useState([]);
    const screenWidth = Dimensions.get('window').width;
    useEffect(() => {
        async function load() {
            try {
                const response = await api.get('/avaliacao');
                setData(response.data);
            } catch {
                setData([
                    { name: 'Positivo', population: 100, color: 'green', legendFontColor: '#7F7F7F', legendFontSize: 15 },
                    { name: 'Negativo', population: 50, color: 'red', legendFontColor: '#7F7F7F', legendFontSize: 15 },
                    { name: 'Bom', population: 30, color: 'yellow', legendFontColor: '#7F7F7F', legendFontSize: 15 },
                ]);
            }
        }

        load();

    }, []);

    return (
        <View style={styles.container}>
            <View style={styles.content}>
                <PieChart
                    data={data}
                    width={screenWidth}
                    height={220}
                    chartConfig={{
                        backgroundColor: '#e26a00',
                        backgroundGradientFrom: '#fb8c00',
                        backgroundGradientTo: '#ffa726',
                        decimalPlaces: 2,
                        color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                        labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                        style: {
                            borderRadius: 16,
                        },
                    }}
                    accessor="population"
                    backgroundColor="transparent"
                    paddingLeft="15"
                    absolute
                />
            </View>
            <View style={styles.footer}>
                <Text style={styles.footerText}>Desenvolvido por Família Madalosso - Excelência em servir.</Text>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#faab45',
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
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

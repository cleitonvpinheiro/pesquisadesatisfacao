/* eslint-disable no-undef */
import React, { useState, useEffect } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    TextInput, 
    ScrollView, 
    TouchableOpacity, 
    Alert,
    Image,
    ActivityIndicator
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import api from '../services/api';
// eslint-disable-next-line import/no-unresolved
import { useLanguage } from '../context/LanguageContext';
// eslint-disable-next-line import/no-unresolved
import LanguageSelector from '../components/LanguageSelector';

export default function QuestionarioScreen() {
    const route = useRoute();
    const navigation = useNavigation();
    const { t } = useLanguage();
    const { avaliacaoInicial } = route.params || {};

    const [loading, setLoading] = useState(true);
    const [questions, setQuestions] = useState([]);
    const [answers, setAnswers] = useState({});

    const [notaGeral, setNotaGeral] = useState('');
    const [sugestao, setSugestao] = useState('');

    useEffect(() => {
        fetchConfig();
    }, []);

    const fetchConfig = async () => {
        try {
            const response = await api.get('/config/form');
            if (response.data && response.data.questions) {
                // Filtra apenas as habilitadas
                const enabledQuestions = response.data.questions.filter(q => q.enabled);
                setQuestions(enabledQuestions);
                
                // Inicializa respostas
                const initialAnswers = {};
                enabledQuestions.forEach(q => {
                    initialAnswers[q.id] = q.type === 'stars' ? 0 : '';
                });
                setAnswers(initialAnswers);
            }
        } catch (error) {
            console.error('Erro ao carregar configurações do formulário:', error);
            Alert.alert(t('connectionError'), 'Usando formulário padrão.');
            // Fallback para perguntas padrão se falhar
            const defaultQuestions = [
                { id: "horario", type: "radio", label: t('mealSchedule'), options: ['Café', 'Almoço', 'Jantar'] },
                { id: "qualidade", type: "stars", label: t('mealQuality') },
                { id: "variedade", type: "stars", label: t('mealVariety') },
                { id: "cardapio", type: "radio", label: t('menuNeeds'), options: ['Sim', 'Parcialmente', 'Não'] },
                { id: "temperatura", type: "stars", label: t('foodTemperature') },
                { id: "limpeza", type: "stars", label: t('cafeteriaClean') },
                { id: "organizacao", type: "stars", label: t('comfortOrganization') },
                { id: "espera", type: "radio", label: t('waitingTime'), options: ['Rápido', 'Razoável', 'Demorado'] }
            ];
            setQuestions(defaultQuestions);
            const initialAnswers = {};
            defaultQuestions.forEach(q => {
                initialAnswers[q.id] = q.type === 'stars' ? 0 : '';
            });
            setAnswers(initialAnswers);
        } finally {
            setLoading(false);
        }
    };

    const handleAnswer = (questionId, value) => {
        setAnswers(prev => ({
            ...prev,
            [questionId]: value
        }));
    };

    const renderStars = (questionId, currentRating) => {
        return (
            <View style={styles.starsContainer}>
                {[1, 2, 3, 4, 5].map((star) => (
                    <TouchableOpacity key={star} onPress={() => handleAnswer(questionId, star)}>
                        <Text style={[styles.star, star <= currentRating && styles.starSelected]}>
                            ★
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
        );
    };

    const renderRadio = (question) => {
        return (
            <View style={styles.radioGroup}>
                {question.options && question.options.map((opt) => (
                    <TouchableOpacity 
                        key={opt} 
                        style={[styles.radioButton, answers[question.id] === opt && styles.radioButtonSelected]}
                        onPress={() => handleAnswer(question.id, opt)}
                    >
                        <Text style={[styles.radioText, answers[question.id] === opt && styles.radioTextSelected]}>{opt}</Text>
                    </TouchableOpacity>
                ))}
            </View>
        );
    };

    const handleSubmit = async () => {
        console.log('Iniciando envio do questionário...');
        
        // Validações básicas (adaptadas para campos dinâmicos se existirem)
        if (questions.find(q => q.id === 'horario') && !answers['horario']) {
            console.log('Validação falhou: Horário não selecionado');
            Alert.alert(t('attention'), t('selectSchedule'));
            return;
        }

        if (!notaGeral) {
            console.log('Validação falhou: Nota geral não selecionada');
            Alert.alert(t('attention'), t('selectOverallRating'));
            return;
        }

        // Lógica de validação de nota baixa
        // Considera apenas respostas numéricas (estrelas) para a média/menor nota
        const starAnswers = questions
            .filter(q => q.type === 'stars')
            .map(q => answers[q.id]);
            
        const menorNota = starAnswers.length > 0 ? Math.min(...starAnswers) : 5;
        
        if ((avaliacaoInicial === 'ruim' || menorNota <= 2) && !sugestao.trim()) {
            console.log('Validação falhou: Sugestão obrigatória para nota baixa');
            Alert.alert(t('attention'), t('suggestionRequired'));
            return;
        }

        try {
            const payload = {
                avaliacao: avaliacaoInicial,
                sugestao,
                notaGeral: Number(notaGeral),
                ...answers // Espalha as respostas dinâmicas (horario, cardapio, qualidade, etc.)
            };

            console.log('Dados a serem enviados:', payload);

            // Envia questionário completo (backend espera tudo aqui)
            const response = await api.post('/questionario', payload);

            console.log('Resposta do servidor:', response.data);
            console.log('Status da resposta:', response.status);

            if (response.status === 200 || response.status === 201) {
                // Navegação imediata para a tela inicial
                console.log('Navegando de volta para Avaliacao');
                navigation.reset({
                    index: 0,
                    routes: [{ name: 'Avaliacao' }],
                });
            } else {
                 throw new Error('Erro ao enviar: Status ' + response.status);
            }
        } catch (error) {
            console.error('Erro ao enviar:', error);
            if (error.response) {
                console.error('Dados do erro:', error.response.data);
                console.error('Status do erro:', error.response.status);
            }
            Alert.alert(t('connectionError'), t('connectionErrorMessage'));
        }
    };

    if (loading) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color="#007bff" />
                <Text>Carregando formulário...</Text>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container}>
            <View style={styles.headerContainer}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Text style={styles.backButtonText}>←</Text>
                </TouchableOpacity>
                <View style={styles.languageContainer}>
                    <LanguageSelector />
                </View>
                <Image 
                    source={require('../../assets/images/logo.png')} 
                    style={styles.logo}
                    resizeMode="contain"
                />
                <Text style={styles.headerTitle}>{t('surveyTitle')}</Text>
            </View>
            
            {/* Renderização Dinâmica das Perguntas */}
            {questions.map((q) => (
                <View key={q.id}>
                    <Text style={styles.label}>{q.label}</Text>
                    {q.type === 'stars' && renderStars(q.id, answers[q.id] || 0)}
                    {q.type === 'radio' && renderRadio(q)}
                </View>
            ))}

            <Text style={styles.sectionTitle}>4. Avaliação Geral</Text>
            <Text style={styles.label}>{t('overallRating')}</Text>
            <View style={styles.notaContainer}>
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((nota) => (
                    <TouchableOpacity 
                        key={nota} 
                        style={[styles.notaButton, notaGeral === nota && styles.notaButtonSelected]}
                        onPress={() => setNotaGeral(nota)}
                    >
                        <Text style={[styles.notaText, notaGeral === nota && styles.notaTextSelected]}>{nota}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            <Text style={styles.sectionTitle}>{t('suggestions')}</Text>
            <TextInput
                style={styles.input}
                placeholder={t('suggestionsPlaceholder')}
                multiline
                numberOfLines={4}
                value={sugestao}
                onChangeText={setSugestao}
            />

            <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
                <Text style={styles.submitButtonText}>{t('submit')}</Text>
            </TouchableOpacity>
            
            <View style={{ height: 50 }} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#f5f5f5',
    },
    headerContainer: {
        alignItems: 'center',
        marginBottom: 20,
        marginTop: 40,
        position: 'relative',
    },
    backButton: {
        position: 'absolute',
        top: -20,
        left: 0,
        padding: 10,
        zIndex: 10,
    },
    backButtonText: {
        fontSize: 30,
        color: '#333',
        fontWeight: 'bold',
    },
    languageContainer: {
        position: 'absolute',
        top: -20,
        right: 0,
        zIndex: 10,
    },
    logo: {
        width: 300,
        height: 200,
        marginBottom: 10,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 20,
        color: '#333',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginTop: 20,
        marginBottom: 10,
        color: '#444',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        paddingBottom: 5,
    },
    label: {
        fontSize: 16,
        marginBottom: 8,
        marginTop: 10,
        color: '#555',
    },
    starsContainer: {
        flexDirection: 'row',
        marginBottom: 10,
    },
    star: {
        fontSize: 30,
        color: '#ddd',
        marginRight: 10,
    },
    starSelected: {
        color: '#FFD700',
    },
    radioGroup: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 10,
    },
    radioButton: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 20,
        paddingVertical: 8,
        paddingHorizontal: 16,
        marginRight: 10,
        marginBottom: 10,
    },
    radioButtonSelected: {
        backgroundColor: '#007bff',
        borderColor: '#007bff',
    },
    radioText: {
        color: '#555',
    },
    radioTextSelected: {
        color: '#fff',
    },
    notaContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
    },
    notaButton: {
        width: 35,
        height: 35,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 17.5,
        margin: 3,
    },
    notaButtonSelected: {
        backgroundColor: '#007bff',
        borderColor: '#007bff',
    },
    notaText: {
        color: '#555',
        fontSize: 12,
    },
    notaTextSelected: {
        color: '#fff',
    },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        padding: 10,
        textAlignVertical: 'top',
        minHeight: 100,
    },
    submitButton: {
        backgroundColor: '#28a745',
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 30,
        marginBottom: 30,
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
});

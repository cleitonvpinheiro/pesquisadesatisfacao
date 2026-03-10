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
import { useLanguage } from '../context/LanguageContext';
import LanguageSelector from '../components/LanguageSelector';

export default function QuestionarioScreen() {
    const route = useRoute();
    const navigation = useNavigation();
    const { t } = useLanguage();
    const { avaliacaoInicial } = route.params || {};

    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [showThankYou, setShowThankYou] = useState(false);
    const [questions, setQuestions] = useState([]);
    const [answers, setAnswers] = useState({});

    const [notaGeral, setNotaGeral] = useState('');
    const [sugestao, setSugestao] = useState('');

    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const response = await api.get('/config/form');
                if (response.data && response.data.questions) {
                    const enabledQuestions = response.data.questions.filter(q => q.enabled);
                    setQuestions(enabledQuestions);

                    const initialAnswers = {};
                    enabledQuestions.forEach(q => {
                        initialAnswers[q.id] = q.type === 'stars' ? 0 : '';
                    });
                    setAnswers(initialAnswers);
                }
            } catch (error) {
                if (__DEV__) console.error('Erro ao carregar configurações do formulário:', error);
                Alert.alert(t('connectionError'), 'Usando formulário padrão.');
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

        fetchConfig();
    }, [t]);

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

    const getLabel = (question) => {
        const labelMap = {
            'horario': 'mealSchedule',
            'qualidade': 'mealQuality',
            'variedade': 'mealVariety',
            'cardapio': 'menuNeeds',
            'temperatura': 'foodTemperature',
            'limpeza': 'cafeteriaClean',
            'organizacao': 'comfortOrganization',
            'espera': 'waitingTime'
        };

        if (labelMap[question.id]) {
            return t(labelMap[question.id]);
        }
        return question.label;
    };

    const getOptionLabel = (option) => {
        const optionMap = {
            'Café': 'breakfast',
            'Almoço': 'lunch',
            'Jantar': 'dinner',
            'Sim': 'yes',
            'Parcialmente': 'partially',
            'Não': 'no',
            'Rápido': 'fast',
            'Razoável': 'reasonable',
            'Demorado': 'slow'
        };

        if (optionMap[option]) {
            return t(optionMap[option]);
        }
        return option;
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
                        <Text style={[styles.radioText, answers[question.id] === opt && styles.radioTextSelected]}>
                            {getOptionLabel(opt)}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
        );
    };

    const handleSubmit = async () => {
        if (sending || showThankYou) return;
        if (__DEV__) console.log('Iniciando envio do questionário...');
        
        // Validações básicas (adaptadas para campos dinâmicos se existirem)
        if (questions.find(q => q.id === 'horario') && !answers['horario']) {
            if (__DEV__) console.log('Validação falhou: Horário não selecionado');
            Alert.alert(t('attention'), t('selectSchedule'));
            return;
        }

        if (!notaGeral) {
            if (__DEV__) console.log('Validação falhou: Nota geral não selecionada');
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
            if (__DEV__) console.log('Validação falhou: Sugestão obrigatória para nota baixa');
            Alert.alert(t('attention'), t('suggestionRequired'));
            return;
        }

        try {
            setSending(true);
            const payload = {
                avaliacao: avaliacaoInicial,
                sugestao,
                notaGeral: Number(notaGeral),
                ...answers // Espalha as respostas dinâmicas (horario, cardapio, qualidade, etc.)
            };

            if (__DEV__) console.log('Dados a serem enviados:', payload);

            // Envia questionário completo (backend espera tudo aqui)
            const response = await api.post('/questionario', payload);

            if (__DEV__) console.log('Resposta do servidor:', response.data);
            if (__DEV__) console.log('Status da resposta:', response.status);

            if (response.status === 200 || response.status === 201) {
                if (__DEV__) console.log('Navegando de volta para Avaliacao');
                setShowThankYou(true);
                setTimeout(() => {
                    navigation.reset({
                        index: 0,
                        routes: [{ name: 'Avaliacao' }],
                    });
                }, 1200);
            } else {
                 throw new Error('Erro ao enviar: Status ' + response.status);
            }
        } catch (error) {
            if (__DEV__) console.error('Erro ao enviar:', error);
            if (error.response) {
                if (__DEV__) console.error('Dados do erro:', error.response.data);
                if (__DEV__) console.error('Status do erro:', error.response.status);
            }
            Alert.alert(t('connectionError'), t('connectionErrorMessage'));
            setSending(false);
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

    if (showThankYou) {
        return (
            <View style={styles.thankYouContainer}>
                <ActivityIndicator size="large" color="#007bff" />
                <Text style={styles.thankYouTitle}>{t('thankYouResponse')}</Text>
                <Text style={styles.thankYouText}>{t('thankYouMessage')}</Text>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container}>
            <View style={styles.headerContainer}>
                <TouchableOpacity disabled={sending} onPress={() => navigation.goBack()} style={styles.backButton}>
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
                    <Text style={styles.label}>{getLabel(q)}</Text>
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

            <TouchableOpacity disabled={sending} style={[styles.submitButton, sending && styles.submitButtonDisabled]} onPress={handleSubmit}>
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
        backgroundColor: '#faab45',
    },
    thankYouContainer: {
        flex: 1,
        padding: 20,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#faab45',
    },
    thankYouTitle: {
        marginTop: 16,
        fontSize: 28,
        fontWeight: 'bold',
        color: '#000',
        fontFamily: 'Poppins_700Bold',
        textAlign: 'center',
    },
    thankYouText: {
        marginTop: 8,
        fontSize: 16,
        color: '#000',
        fontFamily: 'Poppins_400Regular',
        textAlign: 'center',
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
        color: '#000',
        fontWeight: 'bold',
        fontFamily: 'Poppins_700Bold',
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
        color: '#000',
        fontFamily: 'Poppins_700Bold',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginTop: 20,
        marginBottom: 10,
        color: '#000',
        borderBottomWidth: 1,
        borderBottomColor: '#333',
        paddingBottom: 5,
        fontFamily: 'Poppins_700Bold',
    },
    label: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 8,
        marginTop: 10,
        color: '#000',
        fontFamily: 'Poppins_600SemiBold',
    },
    starsContainer: {
        flexDirection: 'row',
        marginBottom: 10,
    },
    star: {
        fontSize: 30,
        color: '#555',
        marginRight: 10,
    },
    starSelected: {
        color: '#fff',
        textShadowColor: 'rgba(0, 0, 0, 0.75)',
        textShadowOffset: {width: -1, height: 1},
        textShadowRadius: 10
    },
    radioGroup: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 10,
    },
    radioButton: {
        borderWidth: 1,
        borderColor: '#333',
        backgroundColor: 'rgba(255,255,255,0.3)',
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
        color: '#000',
        fontFamily: 'Poppins_400Regular',
    },
    radioTextSelected: {
        color: '#fff',
        fontFamily: 'Poppins_600SemiBold',
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
        borderColor: '#333',
        backgroundColor: 'rgba(255,255,255,0.3)',
        borderRadius: 17.5,
        margin: 3,
    },
    notaButtonSelected: {
        backgroundColor: '#007bff',
        borderColor: '#007bff',
    },
    notaText: {
        color: '#000',
        fontSize: 12,
        fontWeight: 'bold',
        fontFamily: 'Poppins_700Bold',
    },
    notaTextSelected: {
        color: '#fff',
    },
    input: {
        borderWidth: 1,
        borderColor: '#333',
        backgroundColor: 'rgba(255,255,255,0.5)',
        borderRadius: 8,
        padding: 10,
        textAlignVertical: 'top',
        minHeight: 100,
        color: '#000',
        fontFamily: 'Poppins_400Regular',
    },
    submitButton: {
        backgroundColor: '#28a745',
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 30,
        marginBottom: 30,
    },
    submitButtonDisabled: {
        opacity: 0.6,
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        fontFamily: 'Poppins_700Bold',
    },
});

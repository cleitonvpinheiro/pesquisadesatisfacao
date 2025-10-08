// Sistema de tradução para o formulário de satisfação
const translations = {
  pt: {
    // Tela inicial (index.html)
    pageTitle: 'Pesquisa de Satisfação',
    mainTitle: 'Avalie nosso Refeitório',
    excellent: 'Excelente',
    good: 'Bom',
    bad: 'Ruim',
    answerSurvey: 'Responder Pesquisa',
    selectOption: '⚠️ Por favor, selecione uma opção antes de continuar!',
    
    // Formulário detalhado (formulario-refeitorio.html)
    surveyTitle: 'Pesquisa satisfação - Refeitório',
    generalData: '1. Dados Gerais',
    breakfast: 'Café',
    lunch: 'Almoço',
    dinner: 'Jantar',
    scheduleHelp: '(Horário que você costuma utilizar o refeitório)',
    
    aboutFood: '2. Sobre a comida',
    mealQuality: 'Qualidade das refeições:',
    mealVariety: 'Variedade das refeições:',
    foodTemperature: 'Temperatura dos alimentos:',
    menuNeeds: 'O cardápio atende às suas necessidades?',
    yes: 'Sim',
    partially: 'Parcialmente',
    no: 'Não',
    
    aboutEnvironment: '3. Sobre o ambiente',
    cafeteriaClean: 'Limpeza do refeitório:',
    comfortOrganization: 'Conforto e Organização (filas, mesas, bandejas, utensílios):',
    waitingTime: 'Tempo de espera:',
    fast: 'Rápido',
    reasonable: 'Razoável',
    slow: 'Demorado',
    
    overallRating: 'Nota geral do refeitório:',
    select: 'Selecione',
    
    suggestions: 'Sugestões',
    suggestionsPlaceholder: 'O que você gostaria de ver de diferente?',
    submit: 'Enviar',
    
    // Classificações
    ratingBad: 'Ruim',
    ratingGood: 'Bom',
    ratingExcellent: 'Excelente',
    
    // Mensagens de validação
    initialEvaluationNotSelected: '⚠️ Avaliação inicial não selecionada. Volte e escolha uma opção na tela anterior.',
    selectSchedule: '⚠️ Por favor, selecione o horário.',
    selectOverallRating: '⚠️ Por favor, selecione a nota geral.',
    suggestionRequired: '⚠️ O campo de sugestão é obrigatório para avaliações ruins ou com até 2 estrelas.',
    thankYouResponse: '✅ Obrigado pela sua resposta!',
    connectionError: '🚫 Erro de conexão com o servidor.',
    
    // Seletor de idioma
    language: 'Idioma',
    portuguese: 'Português',
    english: 'English',
    spanish: 'Español'
  },
  
  en: {
    // Initial screen (index.html)
    pageTitle: 'Satisfaction Survey',
    mainTitle: 'Rate our Cafeteria',
    excellent: 'Excellent',
    good: 'Good',
    bad: 'Bad',
    answerSurvey: 'Answer Survey',
    selectOption: '⚠️ Please select an option before continuing!',
    
    // Detailed form (formulario-refeitorio.html)
    surveyTitle: 'Satisfaction Survey - Cafeteria',
    generalData: '1. General Data',
    breakfast: 'Breakfast',
    lunch: 'Lunch',
    dinner: 'Dinner',
    scheduleHelp: '(Time you usually use the cafeteria)',
    
    aboutFood: '2. About the food',
    mealQuality: 'Meal quality:',
    mealVariety: 'Meal variety:',
    foodTemperature: 'Food temperature:',
    menuNeeds: 'Does the menu meet your needs?',
    yes: 'Yes',
    partially: 'Partially',
    no: 'No',
    
    aboutEnvironment: '3. About the environment',
    cafeteriaClean: 'Cafeteria cleanliness:',
    comfortOrganization: 'Comfort and Organization (lines, tables, trays, utensils):',
    waitingTime: 'Waiting time:',
    fast: 'Fast',
    reasonable: 'Reasonable',
    slow: 'Slow',
    
    overallRating: 'Overall cafeteria rating:',
    select: 'Select',
    
    suggestions: 'Suggestions',
    suggestionsPlaceholder: 'What would you like to see different?',
    submit: 'Submit',
    
    // Classifications
    ratingBad: 'Bad',
    ratingGood: 'Good',
    ratingExcellent: 'Excellent',
    
    // Validation messages
    initialEvaluationNotSelected: '⚠️ Initial evaluation not selected. Go back and choose an option on the previous screen.',
    selectSchedule: '⚠️ Please select the schedule.',
    selectOverallRating: '⚠️ Please select the overall rating.',
    suggestionRequired: '⚠️ The suggestion field is required for bad ratings or ratings with up to 2 stars.',
    thankYouResponse: '✅ Thank you for your response!',
    connectionError: '🚫 Server connection error.',
    
    // Language selector
    language: 'Language',
    portuguese: 'Português',
    english: 'English',
    spanish: 'Español',
    
    // Login
    loginTitle: 'Dashboard Access',
    loginSubtitle: 'Enter your credentials to access the administrative panel',
    username: 'Username:',
    password: 'Password:',
    usernamePlaceholder: 'Enter your username',
    passwordPlaceholder: 'Enter your password',
    loginButton: 'Login',
    backToSurvey: 'Back to',
    surveyLink: 'satisfaction survey',
    fillAllFields: '⚠️ Please fill in all fields.',
    invalidCredentials: '⚠️ Invalid username or password.'
  },
  
  es: {
    // Pantalla inicial (index.html)
    pageTitle: 'Encuesta de Satisfacción',
    mainTitle: 'Evalúa nuestra Cafetería',
    excellent: 'Excelente',
    good: 'Bueno',
    bad: 'Malo',
    answerSurvey: 'Responder Encuesta',
    selectOption: '⚠️ ¡Por favor, selecciona una opción antes de continuar!',
    
    // Formulario detallado (formulario-refeitorio.html)
    surveyTitle: 'Encuesta de satisfacción - Cafetería',
    generalData: '1. Datos Generales',
    breakfast: 'Desayuno',
    lunch: 'Almuerzo',
    dinner: 'Cena',
    scheduleHelp: '(Horario en que sueles usar la cafetería)',
    
    aboutFood: '2. Sobre la comida',
    mealQuality: 'Calidad de las comidas:',
    mealVariety: 'Variedad de las comidas:',
    foodTemperature: 'Temperatura de los alimentos:',
    menuNeeds: '¿El menú satisface tus necesidades?',
    yes: 'Sí',
    partially: 'Parcialmente',
    no: 'No',
    
    aboutEnvironment: '3. Sobre el ambiente',
    cafeteriaClean: 'Limpieza de la cafetería:',
    comfortOrganization: 'Comodidad y Organización (filas, mesas, bandejas, utensilios):',
    waitingTime: 'Tiempo de espera:',
    fast: 'Rápido',
    reasonable: 'Razonable',
    slow: 'Lento',
    
    overallRating: 'Calificación general de la cafetería:',
    select: 'Seleccionar',
    
    suggestions: 'Sugerencias',
    suggestionsPlaceholder: '¿Qué te gustaría ver diferente?',
    submit: 'Enviar',
    
    // Clasificaciones
    ratingBad: 'Malo',
    ratingGood: 'Bueno',
    ratingExcellent: 'Excelente',
    
    // Mensajes de validación
    initialEvaluationNotSelected: '⚠️ Evaluación inicial no seleccionada. Regresa y elige una opción en la pantalla anterior.',
    selectSchedule: '⚠️ Por favor, selecciona el horario.',
    selectOverallRating: '⚠️ Por favor, selecciona la calificación general.',
    suggestionRequired: '⚠️ El campo de sugerencia es obligatorio para evaluaciones malas o con hasta 2 estrellas.',
    thankYouResponse: '✅ ¡Gracias por tu respuesta!',
    connectionError: '🚫 Error de conexión con el servidor.',
    
    // Selector de idioma
    language: 'Idioma',
    portuguese: 'Português',
    english: 'English',
    spanish: 'Español'
  }
};

// Idioma padrão
let currentLanguage = 'pt';

// Função para obter tradução
function t(key) {
  return translations[currentLanguage][key] || translations['pt'][key] || key;
}

// Função para trocar idioma
function changeLanguage(lang) {
  if (translations[lang]) {
    currentLanguage = lang;
    localStorage.setItem('selectedLanguage', lang);
    updatePageTexts();
  }
}

// Função para carregar idioma salvo
function loadSavedLanguage() {
  const savedLang = localStorage.getItem('selectedLanguage');
  if (savedLang && translations[savedLang]) {
    currentLanguage = savedLang;
  }
}

// Função para atualizar textos da página
function updatePageTexts() {
  // Atualiza título da página
  document.title = t('pageTitle');
  
  // Atualiza elementos com data-translate
  document.querySelectorAll('[data-translate]').forEach(element => {
    const key = element.getAttribute('data-translate');
    if (element.tagName === 'INPUT' && element.type === 'submit') {
      element.value = t(key);
    } else if (element.tagName === 'INPUT' && element.hasAttribute('placeholder')) {
      element.placeholder = t(key);
    } else if (element.tagName === 'TEXTAREA' && element.hasAttribute('placeholder')) {
      element.placeholder = t(key);
    } else if (element.tagName === 'OPTION') {
      element.textContent = t(key);
    } else {
      element.textContent = t(key);
    }
  });
  
  // Atualiza elementos com data-translate-placeholder
  document.querySelectorAll('[data-translate-placeholder]').forEach(element => {
    const key = element.getAttribute('data-translate-placeholder');
    element.placeholder = t(key);
  });
  
  // Atualiza seletor de idioma
  const languageSelect = document.getElementById('languageSelect');
  if (languageSelect) {
    languageSelect.value = currentLanguage;
  }
}

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
  loadSavedLanguage();
  updatePageTexts();
});
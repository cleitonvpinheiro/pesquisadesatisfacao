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
    
    // Roles
    admin: 'Administrador',
    manager: 'Gestor',
    user: 'Usuário',
    logout: 'Sair',
    
    // Login
    loginTitle: 'Acesso ao Dashboard',
    loginSubtitle: 'Entre com suas credenciais para acessar o painel administrativo',
    username: 'Usuário:',
    password: 'Senha:',
    usernamePlaceholder: 'Digite seu usuário',
    passwordPlaceholder: 'Digite sua senha',
    loginButton: 'Entrar',
    backToSurvey: 'Voltar para a',
    surveyLink: 'Pesquisa de Satisfação',
    fillAllFields: '⚠️ Por favor, preencha todos os campos.',
    invalidCredentials: '⚠️ Usuário e senha inválidos.',
    
    // Selector de idioma
    language: 'Idioma',
    portuguese: 'Português',
    english: 'English',
    spanish: 'Español',
    
    // Dark Mode
    darkModeTitle: 'Alternar Modo Escuro',

    // Dashboard
    dashboardTitle: "Dashboard - Avaliações do Refeitório",
    tabOverview: "Visão Geral",
    tabConfig: "Configuração do Formulário",
    tabUsers: "Gerenciar Usuários",
    cardClassificacao: "Classificação Geral",
    cardNotas: "Distribuição por Nota Geral",
    labelClassificacao: "Classificação:",
    labelDataInicio: "Data Início:",
    labelDataFim: "Data Fim:",
    btnFiltrar: "Filtrar",
    btnLimpar: "Limpar",
    resumoTotal: "Total de respostas:",
    resumoMedia: "Média da nota geral:",
    resumoNPS: "NPS Estimado:",
    tableHeaderData: "Data",
    tableHeaderRefeicao: "Refeição",
    tableHeaderNota: "Nota",
    tableHeaderComentario: "Comentário",
    configTitle: "Personalizar Formulário",
    usersTitle: "Gerenciar Usuários",
    btnAddStars: "+ Adicionar Pergunta (Estrelas)",
    btnAddRadio: "+ Adicionar Pergunta (Opções)",
    
    // Configuração do Formulário
    configFieldsTitle: "Campos do Questionário",
    configFieldsDesc: "Adicione, remova ou edite as perguntas do formulário móvel.",
    btnSaveConfig: "Salvar Configurações",
    typeStars: "Estrelas",
    typeMulti: "Múltipla Escolha",
    labelId: "ID: ",
    btnDisable: "Desativar",
    btnEnable: "Ativar",
    btnRemove: "Remover",
    confirmRemoveQuestion: "Remover esta pergunta?",
    btnAddOption: "+ Opção",
    alertConfigSaved: "Configurações salvas!",
    alertConfigError: "Erro ao salvar",
    alertConnectionError: "Erro de conexão",
    newQuestionLabel: "Nova Pergunta",
    newQuestionRadioLabel: "Nova Pergunta (Opções)",
    btnSave: "Salvar",
    exportExcel: "Exportar Excel",

    // User Management
    btnNewUser: "+ Novo Usuário",
    userTableUser: "Usuário",
    userTableRole: "Função",
    userTableOrigin: "Origem",
    userTableActions: "Ações",
    modalNewUser: "Novo Usuário",
    modalEditUser: "Editar Usuário",
    labelUsername: "Usuário",
    labelPassword: "Senha",
    labelRole: "Função",
    roleUser: "Usuário",
    roleManager: "Gestor",
    roleAdmin: "Administrador",
    passwordHelp: "Deixe em branco para manter a atual",
    btnCancel: "Cancelar",
    confirmDeleteUser: "Tem certeza que deseja excluir este usuário?",
    alertUserSaved: "Usuário salvo com sucesso!",
    alertUserDeleted: "Usuário excluído com sucesso!",
    alertUserError: "Erro ao salvar usuário",
    originDB: "Banco de Dados",
    originEnv: "Variável de Ambiente"
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
    
    // Dark Mode
    darkModeTitle: 'Toggle Dark Mode',
    
    // Roles
    admin: 'Administrator',
    manager: 'Manager',
    user: 'User',
    logout: 'Logout',
    
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
    invalidCredentials: '⚠️ Invalid username or password.',

    // Dashboard
    dashboardTitle: "Dashboard - Cafeteria Evaluations",
    tabOverview: "Overview",
    tabConfig: "Form Configuration",
    tabUsers: "Manage Users",
    cardClassificacao: "General Classification",
    cardNotas: "Distribution by Overall Rating",
    labelClassificacao: "Classification:",
    labelDataInicio: "Start Date:",
    labelDataFim: "End Date:",
    btnFiltrar: "Filter",
    btnLimpar: "Clear",
    resumoTotal: "Total responses:",
    resumoMedia: "Average overall rating:",
    resumoNPS: "Estimated NPS:",
    tableHeaderData: "Date",
    tableHeaderRefeicao: "Meal",
    tableHeaderNota: "Rating",
    tableHeaderComentario: "Comment",
    configTitle: "Customize Form",
    usersTitle: "Manage Users",
    btnAddStars: "+ Add Question (Stars)",
    btnAddRadio: "+ Add Question (Options)",
    
    // Form Configuration
    configFieldsTitle: "Questionnaire Fields",
    configFieldsDesc: "Add, remove, or edit mobile form questions.",
    btnSaveConfig: "Save Settings",
    typeStars: "Stars",
    typeMulti: "Multiple Choice",
    labelId: "ID: ",
    btnDisable: "Disable",
    btnEnable: "Enable",
    btnRemove: "Remove",
    confirmRemoveQuestion: "Remove this question?",
    btnAddOption: "+ Option",
    alertConfigSaved: "Settings saved!",
    alertConfigError: "Error saving",
    alertConnectionError: "Connection error",
    newQuestionLabel: "New Question",
    newQuestionRadioLabel: "New Question (Options)",
    btnSave: "Save",
    exportExcel: "Export Excel",

    // User Management
    btnNewUser: "+ New User",
    userTableUser: "User",
    userTableRole: "Role",
    userTableOrigin: "Origin",
    userTableActions: "Actions",
    modalNewUser: "New User",
    modalEditUser: "Edit User",
    labelUsername: "Username",
    labelPassword: "Password",
    labelRole: "Role",
    roleUser: "User",
    roleManager: "Manager",
    roleAdmin: "Administrator",
    passwordHelp: "Leave blank to keep current",
    btnCancel: "Cancel",
    confirmDeleteUser: "Are you sure you want to delete this user?",
    alertUserSaved: "User saved successfully!",
    alertUserDeleted: "User deleted successfully!",
    alertUserError: "Error saving user",
    originDB: "Database",
    originEnv: "Environment Variable"
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
    spanish: 'Español',
    
    // Roles
    admin: 'Administrador',
    manager: 'Gerente',
    user: 'Usuario',
    logout: 'Salir',
    
    // Login
    loginTitle: 'Acceso al Panel',
    loginSubtitle: 'Ingrese sus credenciales para acceder al panel administrativo',
    username: 'Usuario:',
    password: 'Contraseña:',
    usernamePlaceholder: 'Ingrese su usuario',
    passwordPlaceholder: 'Ingrese su contraseña',
    loginButton: 'Entrar',
    backToSurvey: 'Volver a la',
    surveyLink: 'Encuesta de Satisfacción',
    fillAllFields: '⚠️ Por favor, complete todos los campos.',
    invalidCredentials: '⚠️ Usuario o contraseña inválidos.',
    
    // Dark Mode
    darkModeTitle: 'Alternar Modo Oscuro',

    // Dashboard
    dashboardTitle: "Panel - Evaluaciones de Cafetería",
    tabOverview: "Visión General",
    tabConfig: "Configuración del Formulario",
    cardClassificacao: "Clasificación General",
    cardNotas: "Distribución de Puntajes",
    labelClassificacao: "Clasificación:",
    labelDataInicio: "Fecha Inicio:",
    labelDataFim: "Fecha Fin:",
    btnFiltrar: "Filtrar",
    btnLimpar: "Limpiar",
    resumoTotal: "Total de Evaluaciones:",
    resumoMedia: "Promedio General:",
    resumoNPS: "NPS Estimado:",
    tableHeaderData: "Fecha",
    tableHeaderRefeicao: "Comida",
    tableHeaderNota: "Nota",
    tableHeaderComentario: "Comentario",
    configTitle: "Configuración del Formulario",
    btnAddStars: "+ Añadir Pregunta (Estrellas)",
    btnAddRadio: "+ Añadir Pregunta (Opciones)",

    // Configuración del Formulario
    configFieldsTitle: "Campos del Cuestionario",
    configFieldsDesc: "Añadir, eliminar o editar preguntas del formulario móvil.",
    btnSaveConfig: "Guardar Configuración",
    typeStars: "Estrellas",
    typeMulti: "Opción Múltiple",
    labelId: "ID: ",
    btnDisable: "Desactivar",
    btnEnable: "Activar",
    btnRemove: "Eliminar",
    confirmRemoveQuestion: "¿Eliminar esta pregunta?",
    btnAddOption: "+ Opción",
    alertConfigSaved: "¡Configuración guardada!",
    alertConfigError: "Error al guardar",
    alertConnectionError: "Error de conexión",
    newQuestionLabel: "Nueva Pregunta",
    newQuestionRadioLabel: "Nueva Pregunta (Opciones)",
    btnSave: "Guardar Configuración",
    exportExcel: "Exportar Excel",

    // Gestión de Usuarios
    btnNewUser: "+ Nuevo Usuario",
    userTableUser: "Usuario",
    userTableRole: "Rol",
    userTableOrigin: "Origen",
    userTableActions: "Acciones",
    modalNewUser: "Nuevo Usuario",
    modalEditUser: "Editar Usuario",
    labelUsername: "Usuario",
    labelPassword: "Contraseña",
    labelRole: "Rol",
    roleUser: "Usuario",
    roleManager: "Gerente",
    roleAdmin: "Administrador",
    passwordHelp: "Dejar en blanco para mantener la actual",
    btnCancel: "Cancelar",
    confirmDeleteUser: "¿Está seguro de que desea eliminar este usuario?",
    alertUserSaved: "¡Usuario guardado con éxito!",
    alertUserDeleted: "¡Usuario eliminado con éxito!",
    alertUserError: "Error al guardar usuario",
    originDB: "Base de Datos",
    originEnv: "Variable de Entorno"
  }
};

// Idioma padrão
let currentLanguage = 'pt';

// Função para obter tradução
function t(key) {
  // Se a chave não existir no idioma atual, tenta em português, senão retorna a própria chave
  if (translations[currentLanguage] && translations[currentLanguage][key]) {
      return translations[currentLanguage][key];
  }
  if (translations['pt'] && translations['pt'][key]) {
      return translations['pt'][key];
  }
  return key;
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
  
  // Atualiza seletor de idioma (Select antigo)
  const languageSelect = document.getElementById('languageSelect');
  if (languageSelect) {
    languageSelect.value = currentLanguage;
    languageSelect.setAttribute('aria-label', t('language'));
    languageSelect.setAttribute('title', t('language'));
  }

  // Atualiza seletor de idioma (Novo estilo Mobile Pill)
  document.querySelectorAll('.lang-btn').forEach(btn => {
    if (btn.dataset.lang === currentLanguage) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
  
  // Atualiza botão dark mode
  const darkModeBtn = document.getElementById('darkModeToggle');
  if (darkModeBtn) {
    darkModeBtn.title = t('darkModeTitle');
  }
}

// ==========================================
// DARK MODE
// ==========================================
function updateDarkModeIcons() {
    const isDark = document.body.classList.contains('dark-mode');
    const moonIcon = document.querySelector('.icon-moon');
    const sunIcon = document.querySelector('.icon-sun');
    
    if (moonIcon && sunIcon) {
        if (isDark) {
            moonIcon.style.display = 'none';
            sunIcon.style.display = 'block';
        } else {
            moonIcon.style.display = 'block';
            sunIcon.style.display = 'none';
        }
    }
}

function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    localStorage.setItem('darkMode', isDark);
    updateDarkModeIcons();
}

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
  loadSavedLanguage();
  updatePageTexts();
  
  // Inicialização do Dark Mode
  const isDark = localStorage.getItem('darkMode') === 'true';
  if (isDark) {
      document.body.classList.add('dark-mode');
  }
  updateDarkModeIcons();
  
  // Listener para o botão de dark mode
  const darkModeBtn = document.getElementById('darkModeToggle');
  if (darkModeBtn) {
      // Remove listeners anteriores para evitar duplicação se o script rodar mais de uma vez
      const newBtn = darkModeBtn.cloneNode(true);
      darkModeBtn.parentNode.replaceChild(newBtn, darkModeBtn);
      newBtn.addEventListener('click', toggleDarkMode);
  }
});

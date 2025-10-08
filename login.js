// Aguarda o carregamento completo da página
document.addEventListener('DOMContentLoaded', function() {
    // Carrega o idioma salvo e atualiza os textos
    loadSavedLanguage();
    updatePageTexts();
    
    // Adiciona evento ao formulário de login
    const loginForm = document.getElementById('loginForm');
    loginForm.addEventListener('submit', handleLogin);
    
    // Verifica se já está logado
    isLoggedIn().then(loggedIn => {
        if (loggedIn) {
            window.location.href = 'dashboard.html';
        }
    });
});

// Função para lidar com o login
function handleLogin(event) {
    event.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorMessage = document.getElementById('error-message');
    
    // Limpa mensagens de erro anteriores
    hideError();
    
    // Validação básica
    if (!username || !password) {
        showError(t('fillAllFields'));
        return;
    }
    
    // Simula autenticação (em produção, isso seria uma chamada para o backend)
    authenticateUser(username, password)
        .then(response => {
            if (response.success) {
                // Salva o token de sessão
                localStorage.setItem('authToken', response.token);
                localStorage.setItem('userInfo', JSON.stringify(response.user));
                
                // Redireciona para o dashboard
                window.location.href = 'dashboard.html';
            } else {
                showError(response.message || t('invalidCredentials'));
            }
        })
        .catch(error => {
            console.error('Erro na autenticação:', error);
            showError(t('connectionError'));
        });
}

// Função para autenticar usuário
function authenticateUser(username, password) {
    return fetch('http://localhost:3003/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .catch(error => {
        console.error('Erro na requisição:', error);
        throw new Error(t('connectionError'));
    });
}

// Função para verificar se o token ainda é válido
function verifyToken() {
    const token = localStorage.getItem('authToken');
    if (!token) return Promise.resolve(false);
    
    return fetch('http://localhost:3003/verify-auth', {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => {
        if (response.ok) {
            return response.json().then(data => data.success);
        }
        return false;
    })
    .catch(() => false);
}

// Função para verificar se o usuário está logado
function isLoggedIn() {
    const token = localStorage.getItem('authToken');
    if (!token) return Promise.resolve(false);
    
    return verifyToken();
}

// Função para mostrar erro
function showError(message) {
    const errorElement = document.getElementById('error-message');
    errorElement.textContent = message;
    errorElement.style.display = 'block';
}

// Função para esconder erro
function hideError() {
    const errorElement = document.getElementById('error-message');
    errorElement.style.display = 'none';
}

// Função para fazer logout
function logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userInfo');
    window.location.href = 'login.html';
}
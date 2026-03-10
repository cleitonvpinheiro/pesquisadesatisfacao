// Configuração da API
const API_PORT = 3003;

function getApiUrl(path) {
    // Se estiver rodando em arquivo local, usa http
    const protocol = window.location.protocol.startsWith('https') ? 'https' : 'http';
    const hostname = window.location.hostname;
    
    // Se estiver rodando localmente (file:// ou localhost), usa localhost
    // Se estiver rodando em IP (rede), usa o mesmo IP
    const host = (!hostname || hostname === 'localhost' || hostname === '127.0.0.1') 
        ? 'localhost' 
        : hostname;
        
    return `${protocol}://${host}:${API_PORT}${path}`;
}

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
        showError(t('Usuário ou senha invalido'));
        return;
    }
    
    // Simula autenticação (em produção, isso seria uma chamada para o backend)
    authenticateUser(username, password)
        .then(response => {
            if (response.success) {
                localStorage.setItem('userInfo', JSON.stringify(response.user));
                localStorage.removeItem('authToken');
                
                // Redireciona para o dashboard
                window.location.href = 'dashboard.html';
            } else {
                showError(response.message || t('invalidCredentials'));
            }
        })
        .catch(error => {
            console.error('Erro na autenticação:', error);
            // Mostra a mensagem de erro real se disponível, caso contrário erro de conexão
            const msg = error.message && error.message !== 'Failed to fetch' 
                ? error.message 
                : `${t('connectionError')} (API: ${getApiUrl('')})`;
            showError(msg);
        });
}

// Função para autenticar usuário
function authenticateUser(username, password) {
    return fetch(getApiUrl('/login'), {
        method: 'POST',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
    })
    .then(async response => {
        if (!response.ok) {
            // Tenta ler a mensagem de erro do servidor
            try {
                const data = await response.json();
                throw new Error(data.message || data.error || `Erro ${response.status}`);
            } catch (e) {
                if (e.message && e.message !== 'Unexpected end of JSON input') throw e;
                throw new Error(`Erro do servidor: ${response.status}`);
            }
        }
        return response.json();
    });
}

// Função para verificar se o token ainda é válido
function verifyToken() {
    const token = localStorage.getItem('authToken');

    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    return fetch(getApiUrl('/verify-auth'), {
        headers,
        credentials: 'include'
    })
    .then(response => {
        if (response.ok) {
            return response.json().then(data => data.success);
        }
        return false;
    })
    .catch(() => false);
}

// ==========================================
// DARK MODE
// ==========================================
// Função toggleDarkMode agora está no translations.js
// function toggleDarkMode() { ... }

// Função updateDarkModeIcon removida ou comentada pois o controle é via CSS
// function updateDarkModeIcon(isDark) {
//    const btn = document.getElementById('darkModeToggle');
//    if (btn) {
//        btn.textContent = isDark ? '☀️' : '🌙';
//    }
// }

// Inicialização do tema
document.addEventListener('DOMContentLoaded', () => {
    // Verificar preferência salva e listeners de dark mode agora são gerenciados pelo translations.js
});

// Função para verificar se o usuário está logado
function isLoggedIn() {
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

// Sistema de autenticação para o dashboard

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
        
    // Remove barra inicial do path se houver, para evitar duplicidade
    const cleanPath = path.startsWith('/') ? path : '/' + path;
    
    return `${protocol}://${host}:${API_PORT}${cleanPath}`;
}

// Inicializa a autenticação (alias para checkAuth para compatibilidade)
function initAuth() {
    return checkAuth();
}

// Função para verificar se o usuário está autenticado
function checkAuth() {
    const token = localStorage.getItem('authToken');

    const headers = {};
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    return fetch(getApiUrl('/verify-auth'), {
        headers,
        credentials: 'include'
    })
    .then(response => {
        if (response.ok) {
            return response.json().then(data => {
                if (data.success) {
                    // Salva informações do usuário
                    localStorage.setItem('userInfo', JSON.stringify(data.user));
                    return true;
                } else {
                    redirectToLogin();
                    return false;
                }
            });
        } else {
            redirectToLogin();
            return false;
        }
    })
    .catch(error => {
        console.error('Erro na verificação de autenticação:', error);
        // Em caso de erro de conexão, tenta permitir acesso se tiver token, 
        // mas idealmente deveria bloquear. Vamos manter o bloqueio por segurança.
        redirectToLogin();
        return false;
    });
}

// Função para redirecionar para login
function redirectToLogin() {
    // Evita loop de redirecionamento se já estiver na página de login
    if (window.location.pathname.endsWith('login.html')) {
        return;
    }

    // Remove tokens inválidos
    localStorage.removeItem('authToken');
    localStorage.removeItem('userInfo');
    
    // Redireciona para login
    window.location.href = 'login.html';
}

// Função para fazer logout
function logout() {
    const token = localStorage.getItem('authToken');
    
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    fetch(getApiUrl('/logout'), {
        method: 'POST',
        headers,
        credentials: 'include'
    }).catch(error => console.error('Erro no logout:', error));
    
    // Remove dados locais
    localStorage.removeItem('authToken');
    localStorage.removeItem('userInfo');
    
    // Redireciona para login
    window.location.href = 'login.html';
}

// Helper para fetch autenticado
function authenticatedFetch(url, options = {}) {
    const token = localStorage.getItem('authToken');
    
    // Se a URL for relativa ou apenas o path, usa getApiUrl
    let finalUrl = url;
    if (url.startsWith('/')) {
        finalUrl = getApiUrl(url);
    } else if (!url.startsWith('http')) {
        // Assume que é um path sem barra inicial
        finalUrl = getApiUrl('/' + url);
    }
    
    const defaultHeaders = { 'Content-Type': 'application/json' };
    if (token) defaultHeaders['Authorization'] = `Bearer ${token}`;
    
    const finalOptions = {
        ...options,
        credentials: 'include',
        headers: {
            ...defaultHeaders,
            ...options.headers
        }
    };
    
    return fetch(finalUrl, finalOptions).then(response => {
        if (response.status === 401 || response.status === 403) {
            // Token expirado ou inválido
            redirectToLogin();
            throw new Error('Sessão expirada');
        }
        return response;
    });
}


// Função para obter informações do usuário
function getUserInfo() {
    const userInfo = localStorage.getItem('userInfo');
    return userInfo ? JSON.parse(userInfo) : null;
}

// Função para verificar se o usuário tem um papel específico
function hasRole(role) {
    const user = getUserInfo();
    return user && user.role === role;
}

// Função para verificar se o usuário é administrador
function isAdmin() {
    const user = getUserInfo();
    return user && user.role === 'admin';
}

// Função para verificar se o usuário é gestor
function isManager() {
    const user = getUserInfo();
    return user && user.role === 'manager';
}

// Função para verificar permissão baseada em hierarquia (Admin > Manager > User)
function hasPermission(requiredRole) {
    const user = getUserInfo();
    if (!user) return false;
    
    const roles = {
        'admin': 3,
        'manager': 2,
        'user': 1,
        'ldap_user': 1
    };
    
    const userLevel = roles[user.role] || 0;
    const requiredLevel = roles[requiredRole] || 0;
    
    return userLevel >= requiredLevel;
}

// Função para fazer requisições autenticadas (Removida duplicata - usar a definição anterior que utiliza getApiUrl)

// Expor funções globalmente
window.checkAuth = checkAuth;
window.initAuth = checkAuth; // Alias para compatibilidade
window.logout = logout;
window.getUserInfo = getUserInfo;
window.hasRole = hasRole;
window.isAdmin = isAdmin;
window.isManager = isManager;
window.hasPermission = hasPermission;
window.authenticatedFetch = authenticatedFetch;

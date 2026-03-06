// Sistema de autenticação para o dashboard

// Função para verificar se o usuário está autenticado
function checkAuth() {
    const token = localStorage.getItem('authToken');
    
    if (!token) {
        redirectToLogin();
        return Promise.resolve(false);
    }
    
    return fetch('http://localhost:3003/verify-auth', {
        headers: {
            'Authorization': `Bearer ${token}`
        }
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
        redirectToLogin();
        return false;
    });
}

// Função para redirecionar para login
function redirectToLogin() {
    // Remove tokens inválidos
    localStorage.removeItem('authToken');
    localStorage.removeItem('userInfo');
    
    // Redireciona para login
    window.location.href = 'login.html';
}

// Função para fazer logout
function logout() {
    const token = localStorage.getItem('authToken');
    
    if (token) {
        // Chama endpoint de logout no backend
        fetch('http://localhost:3003/logout', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
        .catch(error => console.error('Erro no logout:', error));
    }
    
    // Remove dados locais
    localStorage.removeItem('authToken');
    localStorage.removeItem('userInfo');
    
    // Redireciona para login
    window.location.href = 'login.html';
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

// Função para fazer requisições autenticadas
function authenticatedFetch(url, options = {}) {
    const token = localStorage.getItem('authToken');
    
    if (!token) {
        redirectToLogin();
        return Promise.reject(new Error('Token não encontrado'));
    }
    
    const authOptions = {
        ...options,
        headers: {
            ...options.headers,
            'Authorization': `Bearer ${token}`
        }
    };
    
    return fetch(url, authOptions)
        .then(response => {
            if (response.status === 401) {
                redirectToLogin();
                throw new Error('Não autorizado');
            }
            return response;
        });
}

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

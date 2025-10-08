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
                throw new Error('Token inválido');
            }
            return response;
        });
}

// Inicialização da autenticação
function initAuth() {
    return checkAuth().then(isAuthenticated => {
        if (isAuthenticated) {
            // Adiciona informações do usuário na interface
            displayUserInfo();
            // Adiciona botão de logout
            addLogoutButton();
        }
        return isAuthenticated;
    });
}

// Função para exibir informações do usuário
function displayUserInfo() {
    const userInfo = getUserInfo();
    if (userInfo) {
        // Cria elemento de informações do usuário se não existir
        let userInfoElement = document.getElementById('user-info');
        if (!userInfoElement) {
            userInfoElement = document.createElement('div');
            userInfoElement.id = 'user-info';
            userInfoElement.className = 'user-info';
            
            // Insere no início do container
            const container = document.querySelector('.container');
            if (container) {
                container.insertBefore(userInfoElement, container.firstChild);
            } else {
                // Fallback: adiciona ao body se não encontrar container
                document.body.insertBefore(userInfoElement, document.body.firstChild);
            }
        }
        
        userInfoElement.innerHTML = `
            <div class="user-welcome">
                <span>Bem-vindo, <strong>${userInfo.username}</strong> (${userInfo.role})</span>
                <button id="logout-btn" class="btn-logout">Sair</button>
            </div>
        `;
    }
}

// Função para adicionar botão de logout
function addLogoutButton() {
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
}

// Exporta as funções para uso global
window.checkAuth = checkAuth;
window.logout = logout;
window.getUserInfo = getUserInfo;
window.authenticatedFetch = authenticatedFetch;
window.initAuth = initAuth;
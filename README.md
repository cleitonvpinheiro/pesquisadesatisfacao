# Sistema de Avaliação de Satisfação

Este projeto é um sistema completo para coleta e análise de avaliações de satisfação, composto por um frontend estático e um backend em Node.js.

## 🚀 Funcionalidades

### 📊 **Dashboard Administrativo**
- Visualização de estatísticas em tempo real
- Gráficos interativos de satisfação
- Análise de tendências e métricas
- Exportação de relatórios

### 🔐 **Sistema de Autenticação**
- Login seguro com suporte a LDAP e autenticação local
- Sessões gerenciadas com Cookies `httpOnly`
- Controle de acesso baseado em roles (Admin, Gestor, Usuário)
- Rate limiting para proteção contra força bruta

### 📝 **Formulários de Avaliação**
- Interface intuitiva para coleta de feedback
- Validação robusta de dados (Joi)
- Suporte a múltiplos idiomas (Internacionalização)
- Campos customizáveis

## 🏗️ Arquitetura do Projeto

```
satisfacao/
├── backend/                # Servidor Node.js/Express
│   ├── server.js           # Ponto de entrada da API
│   ├── package.json        # Dependências do backend
│   ├── database.json       # Banco de dados local (JSON)
│   └── .env                # Variáveis de ambiente do backend
├── assets/                 # Imagens e recursos estáticos
├── index.html              # Página inicial (Seleção de satisfação)
├── formulario-refeitorio.html # Formulário detalhado
├── login.html              # Página de login administrativo
├── dashboard.html          # Painel de controle
├── *.js                    # Lógica do frontend (auth, translations, etc.)
├── *.css                   # Estilos
├── package.json            # Scripts de automação da raiz
└── README.md               # Documentação
```

## �️ Tecnologias Utilizadas

### Backend
- **Node.js** & **Express**: Servidor e API REST.
- **Security**: `helmet` (Headers HTTP), `cors` (Controle de acesso), `express-rate-limit` (Limitação de requisições).
- **Authentication**: `passport`, `passport-ldapauth` (Integração LDAP), `bcrypt` (Hash de senhas), `cookie-parser`.
- **Validation**: `joi` (Validação de schemas).
- **Database**: `fs-extra` (Persistência em arquivo JSON local).

### Frontend
- **HTML5/CSS3**: Interface responsiva e moderna.
- **JavaScript (Vanilla)**: Lógica de interação sem frameworks pesados.
- **Chart.js**: (Presumido para o dashboard) Visualização de dados.
- **Fetch API**: Comunicação com o backend.

## ⚙️ Configuração e Instalação

### Pré-requisitos
- Node.js (v14+)
- npm

### 1. Instalação
Na raiz do projeto, execute o comando para instalar as dependências do backend e as ferramentas de desenvolvimento:

```bash
npm run setup
npm install
```

### 2. Configuração de Ambiente (.env)
O backend já possui um arquivo `.env` configurado por padrão na pasta `backend/`. As principais variáveis são:

```ini
PORT=3003
NODE_ENV=development

# Credenciais Padrão (Local)
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin
GESTOR_USERNAME=gestor
GESTOR_PASSWORD=gestor
USUARIO_USERNAME=usuario
USUARIO_PASSWORD=usuario

# Configurações de Segurança
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# LDAP (Opcional - Descomente para ativar)
# LDAP_URL=ldap://example.com
# LDAP_BIND_DN=...
```

## 🚀 Como Rodar o Projeto

Para iniciar o **Frontend** e o **Backend** simultaneamente, utilize o comando:

```bash
npm run dev
```

Isso iniciará:
- **Frontend**: http://localhost:8000
- **Backend**: http://localhost:3003

Caso prefira rodar separadamente:
- Backend: `npm start`
- Frontend: `npm run start:front`

## � Documentação da API

### Autenticação
- `POST /login`: Autentica usuário (Local ou LDAP).
- `POST /logout`: Encerra a sessão.
- `GET /verify-auth`: Verifica se o token atual é válido.

### Avaliações
- `POST /avaliar`: Envia uma avaliação simplificada (Excelente/Bom/Ruim).
- `POST /questionario`: Envia o questionário completo.
- `GET /avaliacoes`: Lista avaliações (Requer autenticação).
- `GET /questionarios`: Lista questionários detalhados (Requer autenticação).
- `GET /estatisticas`: Retorna métricas consolidadas (Requer autenticação).

## 🔒 Segurança

O sistema implementa diversas camadas de segurança:
1. **Cookies Seguros**: Tokens armazenados em cookies `httpOnly` e `SameSite=Strict`.
2. **CORS Restrito**: Apenas origens permitidas podem acessar a API.
3. **Sanitização**: Validação rigorosa de entrada com `Joi`.
4. **Rate Limiting**: Proteção contra ataques de força bruta no login.

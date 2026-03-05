# Sistema de Avaliação de Satisfação

Este projeto é um sistema completo para coleta e análise de avaliações de satisfação, composto por um frontend web, um backend em Node.js e um aplicativo mobile (React Native).

## 🚀 Funcionalidades

### 📊 **Dashboard Administrativo**
- **Visualização em Tempo Real**: Estatísticas e gráficos interativos de satisfação.
- **Configuração de Questionário**: Interface para adicionar, remover e editar perguntas do formulário dinamicamente.
- **Gestão de Idiomas**: Interface traduzida para Português, Inglês e Espanhol.
- **Temas**: Suporte a modo claro e escuro.

### 🔐 **Sistema de Autenticação**
- Login seguro com suporte a LDAP e autenticação local.
- Sessões gerenciadas com Cookies `httpOnly`.
- Controle de acesso baseado em roles (Admin, Gestor, Usuário).

### 📝 **Formulários de Avaliação (Web)**
- Interface intuitiva para coleta de feedback.
- **Internacionalização (i18n)**: Suporte completo a PT, EN e ES com seletor de idiomas unificado.
- **Design Responsivo**: Layout adaptável com controles modernos (Pill-style).

### 📱 **Aplicativo Mobile**
- Projeto React Native (Expo) localizado na pasta `satisfacao-mobile`.
- Interface otimizada para tablets e dispositivos móveis.
- Sincronização com o backend para envio de avaliações.

## 🏗️ Arquitetura do Projeto

```
satisfacao/
├── backend/                # Servidor Node.js/Express
│   ├── server.js           # API REST
│   ├── database.json       # Banco de dados local (ignorado no git)
│   └── database.example.json # Template do banco de dados
├── satisfacao-mobile/      # Projeto React Native (Expo)
│   ├── app/                # Rotas e telas (Expo Router)
│   └── ...
├── assets/                 # Imagens e recursos estáticos
├── index.html              # Página inicial (Seleção de satisfação)
├── formulario-refeitorio.html # Formulário detalhado
├── login.html              # Página de login administrativo
├── dashboard.html          # Painel de controle
├── translations.js         # Central de traduções (PT, EN, ES)
├── *.js                    # Lógica do frontend
├── *.css                   # Estilos globais e de componentes
└── README.md               # Documentação
```

## 🛠️ Tecnologias Utilizadas

### Backend
- **Node.js** & **Express**: API REST.
- **Segurança**: `helmet`, `cors`, `express-rate-limit`.
- **Autenticação**: `passport`, `bcrypt`, `cookie-parser`.
- **Persistência**: Arquivo JSON local (`fs-extra`).

### Frontend Web
- **HTML5/CSS3**: Layout moderno com CSS Variables para temas.
- **JavaScript (Vanilla)**: Lógica leve e eficiente.
- **Chart.js**: Visualização de dados no dashboard.

### Mobile
- **React Native** & **Expo**: Desenvolvimento multiplataforma.
- **Expo Router**: Navegação baseada em arquivos.

## ⚙️ Configuração e Instalação

### Pré-requisitos
- Node.js (v18+)
- npm ou yarn

### 1. Instalação do Backend e Frontend Web
Na raiz do projeto:

```bash
# Instalar dependências do backend
cd backend
npm install
# Copiar o banco de dados de exemplo
cp database.example.json database.json
# Voltar para a raiz e iniciar
cd ..
npm start
```

### 2. Instalação do Mobile App
Para rodar o aplicativo móvel:

```bash
cd satisfacao-mobile
npm install
npx expo start
```

## 🔑 Credenciais Padrão (Ambiente de Desenvolvimento)

O arquivo `.env` no backend define as credenciais iniciais:

- **Admin**: `admin` / `admin`
- **Gestor**: `gestor` / `gestor`
- **Usuário**: `usuario` / `usuario`

## 🌍 Internacionalização

O sistema utiliza o arquivo `translations.js` como fonte única de verdade para textos.
- **Adicionar novo idioma**: Basta adicionar uma nova chave no objeto `translations` em `translations.js`.
- **Uso no HTML**: Adicione o atributo `data-translate="CHAVE"` aos elementos.
- **Uso no JS**: Utilize a função global `t('CHAVE')`.

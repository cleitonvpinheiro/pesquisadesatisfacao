# Sistema de Avaliação de Satisfação

Um sistema web completo para coleta e análise de avaliações de satisfação, desenvolvido com foco em segurança e usabilidade.

## 🚀 Funcionalidades

### 📊 **Dashboard Administrativo**
- Visualização de estatísticas em tempo real
- Gráficos interativos de satisfação
- Análise de tendências e métricas
- Exportação de relatórios

### 🔐 **Sistema de Autenticação**
- Login seguro com diferentes níveis de acesso
- Cookies httpOnly para proteção de tokens
- Sistema de logout com limpeza de sessão
- Controle de acesso baseado em roles

### 📝 **Formulários de Avaliação**
- Interface intuitiva para coleta de feedback
- Validação robusta de dados
- Suporte a múltiplos idiomas
- Campos customizáveis

### 🛡️ **Segurança Avançada**
- Rate limiting para prevenção de ataques
- Headers de segurança com Helmet
- Validação de dados com Joi
- CORS configurado especificamente
- Logs de auditoria e segurança

## 🏗️ Arquitetura

```
satisfacao/
├── backend/           # Servidor Node.js/Express
│   ├── server.js     # Servidor principal
│   ├── package.json  # Dependências do backend
│   └── database.json # Banco de dados local
├── frontend/         # Interface web
│   ├── index.html    # Página inicial
│   ├── login.html    # Página de login
│   ├── dashboard.html# Dashboard administrativo
│   └── *.js         # Scripts do frontend
└── .env             # Variáveis de ambiente
```

## 🔧 Instalação

### Pré-requisitos
- Node.js (versão 14 ou superior)
- npm ou yarn
- Git

### Passos de Instalação

1. **Clone o repositório**
```bash
git clone <url-do-repositorio>
cd satisfacao
```

2. **Configure as variáveis de ambiente**
```bash
# Crie o arquivo .env na raiz do projeto
cp .env.example .env
```

3. **Instale as dependências do backend**
```bash
cd backend
npm install
```

4. **Instale as dependências do frontend**
```bash
cd ..
npm install
```

## ⚙️ Configuração

### Variáveis de Ambiente (.env)

```env
# Configurações do Servidor
PORT=3003
NODE_ENV=production

# Credenciais de Usuários
ADMIN_USERNAME=admin
ADMIN_PASSWORD=senha_segura_admin
GESTOR_USERNAME=gestor
GESTOR_PASSWORD=senha_segura_gestor
USUARIO_USERNAME=usuario
USUARIO_PASSWORD=senha_segura_usuario

# Segurança
JWT_SECRET=sua_chave_jwt_super_secreta
SESSION_SECRET=sua_chave_sessao_super_secreta

# CORS
ALLOWED_ORIGINS=http://localhost:8000,http://127.0.0.1:8000
```

## 🚀 Execução

### Desenvolvimento

1. **Inicie o servidor backend**
```bash
cd backend
node server.js
```

2. **Inicie o servidor frontend**
```bash
# Em outro terminal, na raiz do projeto
npx http-server -p 8000 -c-1
```

3. **Acesse a aplicação**
- Frontend: http://localhost:8000
- Backend API: http://localhost:3003

### Produção

```bash
# Configure NODE_ENV=production no .env
# Use um processo manager como PM2
npm install -g pm2
cd backend
pm2 start server.js --name "satisfacao-backend"
```

## 🔐 Segurança

### Melhorias Implementadas

✅ **Autenticação Segura**
- Cookies httpOnly para tokens
- Hashing seguro de senhas com bcrypt
- Sessões com timeout automático

✅ **Proteção contra Ataques**
- Rate limiting (máx. 5 tentativas/15min)
- Headers de segurança (CSP, HSTS, etc.)
- Validação rigorosa de entrada
- Sanitização de logs

✅ **Configuração Segura**
- Variáveis de ambiente para credenciais
- CORS restritivo por origem
- Modo de produção otimizado

## 📚 API Endpoints

### Autenticação
```
POST /login          # Login de usuário
POST /logout         # Logout e limpeza de sessão
```

### Avaliações
```
POST /avaliar        # Submeter nova avaliação
GET /avaliacoes      # Listar avaliações (autenticado)
GET /estatisticas    # Obter estatísticas (autenticado)
```

### Dados
```
GET /dados-dashboard # Dados para dashboard (autenticado)
```

## 🧪 Testes

### Testes de Segurança

```bash
# Teste de rate limiting
curl -X POST http://localhost:3003/login \
  -H "Content-Type: application/json" \
  -d '{"username":"invalid","password":"invalid"}'

# Teste de CORS
curl -X OPTIONS http://localhost:3003/login \
  -H "Origin: http://localhost:8000" \
  -H "Access-Control-Request-Method: POST"

# Teste de validação
curl -X POST http://localhost:3003/avaliar \
  -H "Content-Type: application/json" \
  -d '{"avaliacao":"invalido","notaGeral":15}'
```

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 🆘 Suporte

Para suporte e dúvidas:
- Abra uma issue no GitHub
- Entre em contato com a equipe de desenvolvimento

## 📈 Roadmap

- [ ] Implementação de testes automatizados
- [ ] Dashboard com mais métricas
- [ ] Integração com banco de dados externo
- [ ] API REST completa
- [ ] Aplicativo mobile

---

**Desenvolvido com ❤️ para melhorar a experiência do usuário**
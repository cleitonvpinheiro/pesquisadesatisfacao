import express from "express"
import cors from "cors"
import bodyParser from "body-parser"
import fs from "fs-extra"
import crypto from "crypto"
import dotenv from "dotenv"
import helmet from "helmet"
import rateLimit from "express-rate-limit"
import Joi from "joi"
import bcrypt from "bcrypt"
import cookieParser from "cookie-parser"
import passport from "passport"
import { Strategy as LdapStrategy } from "passport-ldapauth"
import { Server } from "http"
import { url } from "inspector"


const ldapOptions = {
    server: {
        url: process.env.LDAP_URL,
        bindDN: process.env.LDAP_BIND_DN,
        bindCredentials: process.env.LDAP_BIND_CREDENTIALS,
        searchBase: process.env.LDAP_BASE_DN,
        // Suporte a múltiplos atributos comuns para login LDAP/AD
        searchFilter: process.env.LDAP_SEARCH_FILTER || "(|(sAMAccountName={{username}})(uid={{username}})(userPrincipalName={{username}}))"
    },
    handleErrorsAsFailures: true,
    passReqToCallback: true,
}

// Carrega variáveis de ambiente
dotenv.config()

const app = express()

const ldapEnabled = Boolean(process.env.LDAP_URL)
if (ldapEnabled) {
  passport.use(new LdapStrategy(ldapOptions, (req, user, done) => {
    if (!user) return done(null, false)
    return done(null, user)
  }))
  app.use(passport.initialize())
} else {
  console.warn("LDAP desabilitado: variáveis de ambiente não configuradas.")
}
const PORT = process.env.PORT || 3003
const DB_File = "./database.json"

// Usuários válidos (carregados das variáveis de ambiente)
const validUsers = [
    { username: process.env.ADMIN_USERNAME, password: process.env.ADMIN_PASSWORD, role: 'admin' },
    { username: process.env.GESTOR_USERNAME, password: process.env.GESTOR_PASSWORD, role: 'manager' },
    { username: process.env.USUARIO_USERNAME, password: process.env.USUARIO_PASSWORD, role: 'user' }
]

// Armazenamento de sessões em memória (em produção, usar Redis ou banco)
const sessions = new Map()

// Armazenamento de clientes SSE
let sseClients = [];

// Função para enviar atualizações SSE
function enviarAtualizacaoSSE(data) {
    sseClients.forEach(client => {
        try {
            client.res.write(`data: ${JSON.stringify(data)}\n\n`);
        } catch (e) {
            console.error("Erro ao enviar SSE:", e);
        }
    });
}

// Configurações de segurança
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:"],
        },
    },
}))

// Configuração CORS específica
const defaultOrigins = [
    'http://localhost:8000',
    'http://10.41.1.11:8000',
    'http://192.168.0.4:8000',
    'http://127.0.0.1:5500',
    'http://localhost:8081',
    'http://10.41.1.11:8081',
    'http://localhost:19006'
]
const envOrigins = (process.env.ALLOWED_ORIGINS || '').split(',').map(o => o.trim()).filter(Boolean)
const allowedOrigins = [...new Set([...defaultOrigins, ...envOrigins])]
app.use(cors({
    origin: function(origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            return callback(null, true)
        }
        return callback(new Error('Not allowed by CORS'))
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With', 'content-type'],
    optionsSuccessStatus: 204
}))

// ✅ Responder explicitamente preflight OPTIONS em todas as rotas
// app.options removido para compatibilidade com Express 5 — preflight será tratado pelo middleware abaixo

// Garantir 204 para preflight mesmo sem rota específica
app.use((req, res, next) => {
    if (req.method === 'OPTIONS') {
        const origin = req.headers.origin
        if (!origin || allowedOrigins.includes(origin)) {
            res.header('Access-Control-Allow-Origin', origin || '*')
            res.header('Access-Control-Allow-Credentials', 'true')
            res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
            res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, X-Requested-With, content-type')
            return res.sendStatus(204)
        }
        return res.status(403).send('Not allowed by CORS')
    }
    next()
})

// Rate limiting para rotas de autenticação
const authLimiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutos
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 5, // máximo 5 tentativas
    message: { error: 'Muitas tentativas de login. Tente novamente em 15 minutos.' },
    standardHeaders: true,
    legacyHeaders: false,
})

app.use(bodyParser.json({ limit: '10mb' }))
app.use(cookieParser())

// 🔧 Funções auxiliares
async function getDB() {
    try {
        const data = await fs.readJson(DB_File)
        if (!data.avaliacoes) data.avaliacoes = []
        if (!data.questionarios) data.questionarios = []
        if (!data.users) data.users = []
        return data
    } catch {
        return { avaliacoes: [], questionarios: [], users: [] }
    }
}

async function saveDB(data) {
    await fs.writeJSON(DB_File, data, { spaces: 2 })
}

// Função para gerar token de sessão
function generateToken() {
    return crypto.randomBytes(32).toString('hex')
}

// Middleware para verificar autenticação
function requireAuth(req, res, next) {
    // Tenta obter token do cookie primeiro, depois do header Authorization
    let token = req.cookies?.authToken

    if (!token) {
        token = req.headers.authorization?.replace('Bearer ', '')
    }

    if (!token) {
        return res.status(401).json({ error: 'Token de acesso requerido' })
    }

    const session = sessions.get(token)
    if (!session || session.expires < Date.now()) {
        sessions.delete(token)
        // Remove cookie se expirado
        res.clearCookie('authToken')
        return res.status(401).json({ error: 'Token inválido ou expirado' })
    }

    // Atualiza último acesso
    session.lastAccess = Date.now()
    req.user = session.user
    next()
}

// Esquemas de validação Joi
const loginSchema = Joi.object({
    // Permite usuários de LDAP com caracteres comuns: letras, números, ponto, underline, hífen, @ e barra invertida (domínio\\usuário)
    username: Joi.string().pattern(/^[A-Za-z0-9._\-@\\]{3,64}$/).required(),
    password: Joi.string().min(3).max(50).required()
})

const avaliacaoSchema = Joi.object({
    avaliacao: Joi.string().valid('excelente', 'bom', 'ruim').required(),
    sugestao: Joi.string().max(500).allow(''),
    notaGeral: Joi.number().integer().min(0).max(10).allow(null)
})

const questionarioSchema = Joi.object({
    horario: Joi.string().valid('Café', 'Almoço', 'Jantar').required(),
    qualidade: Joi.number().integer().min(0).max(5),
    variedade: Joi.number().integer().min(0).max(5),
    temperatura: Joi.number().integer().min(0).max(5),
    cardapio: Joi.string().valid('Sim', 'Parcialmente', 'Não'),
    limpeza: Joi.number().integer().min(0).max(5),
    organizacao: Joi.number().integer().min(0).max(5),
    espera: Joi.string().valid('Rápido', 'Razoável', 'Demorado'),
    notaGeral: Joi.number().integer().min(0).max(10).allow(null),
    sugestao: Joi.string().max(500).allow('')
})

// Rota para SSE (Server-Sent Events) - Atualizações em tempo real para o Dashboard
app.get('/events', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    
    // Envia cabeçalhos imediatamente
    if (res.flushHeaders) res.flushHeaders();

    const clientId = Date.now();
    const newClient = {
        id: clientId,
        res
    };
    sseClients.push(newClient);

    // Remove cliente ao desconectar
    req.on('close', () => {
        sseClients = sseClients.filter(client => client.id !== clientId);
    });
});

// 🔐 Rotas de autenticação
app.post("/login", authLimiter, async (req, res, next) => {
  // 🔹 Validação básica com Joi
  const { error, value } = loginSchema.validate(req.body)
  if (error) {
    return res.status(400).json({
      success: false,
      message: "Dados inválidos: " + error.details[0].message
    })
  }

  // Normaliza formatos de username (DOMINIO\\usuario, usuario@dominio -> usuario)
  const originalUsername = value.username
  const normalizedUsername = originalUsername.includes('\\')
    ? originalUsername.split('\\').pop()
    : originalUsername.split('@')[0]
  value.username = normalizedUsername

  // Função auxiliar para criar sessão
  const createSession = (user) => {
      const token = generateToken()
      const expires = Date.now() + (24 * 60 * 60 * 1000) // 24h

      sessions.set(token, {
        user: {
          username: user.username,
          role: user.role
        },
        expires,
        createdAt: Date.now(),
        lastAccess: Date.now()
      })

      res.cookie("authToken", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 24 * 60 * 60 * 1000
      })

      console.log(`Login bem-sucedido para: ${user.username} (${user.role})`)
      res.json({
        success: true,
        token,
        user: {
          username: user.username,
          role: user.role
        }
      })
  }

  // 1. Tenta autenticação no banco de dados local (users.json)
  const db = await getDB()
  const dbUser = db.users.find(u => u.username === value.username)
  
  if (dbUser) {
      // Verifica senha (suporta hash e plain text para migração)
      const isMatch = await bcrypt.compare(value.password, dbUser.password).catch(() => false)
      
      if (isMatch) {
          return createSession(dbUser)
      } else if (dbUser.password === value.password) {
          // Auto-migração: converte senha em texto plano para hash
          try {
              const hashedPassword = await bcrypt.hash(value.password, 10)
              dbUser.password = hashedPassword
              await saveDB(db)
              console.log(`Senha do usuário ${dbUser.username} migrada para hash com segurança.`)
              return createSession(dbUser)
          } catch (err) {
              console.error("Erro ao migrar senha:", err)
          }
      }
  }

  // 2. Tenta autenticação com usuários de ambiente (fallback)
  const envUser = validUsers.find(u => u.username === value.username && u.password === value.password)
  if (envUser) {
      return createSession(envUser)
  }

  // 3. Tenta autenticação LDAP se habilitado
  if (ldapEnabled) {
    passport.authenticate("ldapauth", { session: false }, (err, user, info) => {
      if (err) {
        console.error("Erro LDAP:", err)
        return res.status(500).json({ success: false, message: "Erro interno no LDAP" })
      }

      if (!user) {
        console.warn(`Tentativa de login inválida: ${value.username}`)
        return res.status(401).json({ success: false, message: "Usuário e senha inválidos." })
      }

      // Se passou no LDAP, cria sessão como ldap_user (ou mapeia role se necessário)
      createSession({
          username: user.sAMAccountName || user.uid || user.username,
          role: user.role || "ldap_user"
      })

    })(req, res, next)
  } else {
    // Se chegou aqui e não achou em lugar nenhum
    console.warn(`Tentativa de login inválida: ${value.username}`)
    return res.status(401).json({ success: false, message: "Usuário e senha inválidos." })
  }
})

app.post("/logout", (req, res) => {
    try {
        // Obtém token do cookie ou header
        let token = req.cookies?.authToken
        if (!token) {
            const authHeader = req.headers['authorization']
            token = authHeader && authHeader.split(' ')[1]
        }

        if (token) {
            // Remove sessão do servidor
            sessions.delete(token)
            console.log(`Logout realizado em ${new Date().toISOString()}`)
        }

        // Remove cookie
        res.clearCookie('authToken')

        res.json({
            success: true,
            message: 'Logout realizado com sucesso'
        })

    } catch (error) {
        console.error('Erro no logout:', error.message)
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        })
    }
})

app.get("/verify-auth", requireAuth, (req, res) => {
    res.json({
        success: true,
        user: req.user
    })
})

// 📝 Rota antiga (avaliação simples)
app.post("/avaliar", async (req, res) => {
    try {
        // Validação com Joi
        const { error, value } = avaliacaoSchema.validate(req.body)
        if (error) {
            return res.status(400).json({
                error: 'Dados inválidos: ' + error.details[0].message
            })
        }

        let { avaliacao, sugestao, notaGeral } = value;

        if (notaGeral !== undefined && notaGeral !== null) {
            // 🧠 Nova lógica de classificação
            if (notaGeral <= 3) avaliacao = "ruim";
            else if (notaGeral <= 6) avaliacao = "bom";
            else avaliacao = "excelente";
        }

        const db = await getDB();

        const novaAvaliacao = {
            id: Date.now(),
            avaliacao,
            sugestao: sugestao || "",
            notaGeral: notaGeral ?? null,
            data: new Date().toISOString(),
            ip: req.ip || 'unknown'
        };

        db.avaliacoes.push(novaAvaliacao);
        await saveDB(db);

        console.log(`Nova avaliação registrada: ${avaliacao} em ${new Date().toISOString()}`);

        res.json({
            message: "✅ Avaliação registrada com sucesso!",
            novaAvaliacao: {
                id: novaAvaliacao.id,
                avaliacao: novaAvaliacao.avaliacao,
                data: novaAvaliacao.data
            }
        });

    } catch (err) {
        console.error("Erro no /avaliar:", err.message);
        res.status(500).json({ error: "Erro interno ao salvar avaliação." });
    }
});

// 📝 Rota para salvar questionário completo
app.post("/questionario", async (req, res) => {
    try {
        const { notaGeral, horario, sugestao, avaliacaoInicial, ...outrosCampos } = req.body;
        
        // Validação básica apenas para campos críticos do sistema, o resto é dinâmico
        if (!notaGeral && notaGeral !== 0) {
            return res.status(400).json({ error: "Nota geral é obrigatória" });
        }

        const novoQuestionario = {
            id: Date.now(),
            horario: horario || "Não informado",
            notaGeral,
            sugestao: sugestao || "",
            ...outrosCampos, // Salva todos os campos dinâmicos (qualidade, variedade, perguntas novas, etc.)
            data: new Date().toISOString(),
            ip: req.ip
        };

        const db = await getDB();
        db.questionarios.push(novoQuestionario);
        
        // Se a avaliação inicial veio junto, salva também na lista de avaliações rápidas
        if (avaliacaoInicial) {
             const novaAvaliacao = {
                id: Date.now() - 1, // Pequeno offset para não colidir ID se for muito rápido
                avaliacao: avaliacaoInicial,
                sugestao: sugestao || "",
                notaGeral,
                data: new Date().toISOString(),
                ip: req.ip
            };
            db.avaliacoes.push(novaAvaliacao);
        }

        await saveDB(db);
        
        // Atualiza clientes via SSE
        enviarAtualizacaoSSE({ type: 'nova_avaliacao', data: novoQuestionario });

        res.status(201).json({ message: "Questionário salvo com sucesso!" });
    } catch (error) {
        console.error("Erro ao salvar questionário:", error);
        res.status(500).json({ error: "Erro interno ao salvar questionário" });
    }
});

// Configuração do formulário
app.get("/config/form", async (req, res) => {
    try {
        const db = await getDB();
        
        // Se não existir config, cria padrão
        if (!db.formConfig) {
            db.formConfig = {
                questions: [
                    { id: "qualidade", type: "stars", label: "Qualidade da Refeição", enabled: true },
                    { id: "variedade", type: "stars", label: "Variedade de Opções", enabled: true },
                    { id: "temperatura", type: "stars", label: "Temperatura dos Alimentos", enabled: true },
                    { id: "limpeza", type: "stars", label: "Limpeza do Ambiente", enabled: true },
                    { id: "organizacao", type: "stars", label: "Organização e Atendimento", enabled: true }
                ]
            };
            await saveDB(db);
        }

        res.json(db.formConfig);
    } catch (error) {
        console.error("Erro ao buscar config:", error);
        res.status(500).json({ error: "Erro ao buscar configuração" });
    }
});

app.post("/config/form", requireAuth, requireManagerOrAdmin, async (req, res) => {
    try {
        const { questions } = req.body;
        
        if (!Array.isArray(questions)) {
            return res.status(400).json({ error: "Formato inválido" });
        }

        const db = await getDB();
        db.formConfig = { questions };
        await saveDB(db);

        res.json({ message: "Configuração salva com sucesso", config: db.formConfig });
    } catch (error) {
        console.error("Erro ao salvar config:", error);
        res.status(500).json({ error: "Erro ao salvar configuração" });
    }
});

// Middleware para verificar permissão de admin
function requireAdmin(req, res, next) {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ error: 'Acesso negado. Apenas administradores.' });
    }
}

// Middleware para verificar permissão de admin ou gestor
function requireManagerOrAdmin(req, res, next) {
    if (req.user && (req.user.role === 'admin' || req.user.role === 'manager')) {
        next();
    } else {
        res.status(403).json({ error: 'Acesso negado. Apenas administradores e gestores.' });
    }
}

// 👥 Rotas de Gerenciamento de Usuários
app.get("/users", requireAuth, requireAdmin, async (req, res) => {
    try {
        const db = await getDB();
        // Retorna usuários do banco + usuários de ambiente (marcados como tal)
        const dbUsers = db.users.map(u => ({ ...u, origin: 'database' }));
        const envUsers = validUsers.map(u => ({ ...u, origin: 'env', id: 'env_' + u.username }));
        
        // Combina as listas
        const allUsers = [...dbUsers, ...envUsers];
        
        // Remove senhas antes de enviar
        const safeUsers = allUsers.map(({ password, ...user }) => user);
        
        res.json(safeUsers);
    } catch (error) {
        console.error("Erro ao listar usuários:", error);
        res.status(500).json({ error: "Erro interno ao listar usuários" });
    }
});

app.post("/users", requireAuth, requireAdmin, async (req, res) => {
    try {
        const schema = Joi.object({
            username: Joi.string().min(3).required(),
            password: Joi.string().min(3).required(),
            role: Joi.string().valid('admin', 'manager', 'user').required()
        });

        const { error, value } = schema.validate(req.body);
        if (error) return res.status(400).json({ error: error.details[0].message });

        const db = await getDB();
        
        // Verifica se usuário já existe (no DB ou Env)
        if (db.users.some(u => u.username === value.username) || 
            validUsers.some(u => u.username === value.username)) {
            return res.status(400).json({ error: "Usuário já existe" });
        }

        const newUser = {
            id: Date.now().toString(),
            username: value.username,
            password: await bcrypt.hash(value.password, 10), // Senha hashada
            role: value.role,
            createdAt: new Date().toISOString()
        };

        db.users.push(newUser);
        await saveDB(db);

        const { password, ...safeUser } = newUser;
        res.status(201).json(safeUser);
    } catch (error) {
        console.error("Erro ao criar usuário:", error);
        res.status(500).json({ error: "Erro interno ao criar usuário" });
    }
});

app.put("/users/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const schema = Joi.object({
            username: Joi.string().min(3),
            password: Joi.string().min(3),
            role: Joi.string().valid('admin', 'manager', 'user')
        });

        const { error, value } = schema.validate(req.body);
        if (error) return res.status(400).json({ error: error.details[0].message });

        // Não permite editar usuários de ambiente
        if (id.startsWith('env_')) {
            return res.status(403).json({ error: "Não é possível editar usuários de ambiente via interface." });
        }

        const db = await getDB();
        const userIndex = db.users.findIndex(u => u.id === id);

        if (userIndex === -1) {
            return res.status(404).json({ error: "Usuário não encontrado" });
        }

        // Atualiza campos
        if (value.username) db.users[userIndex].username = value.username;
        if (value.password) db.users[userIndex].password = await bcrypt.hash(value.password, 10);
        if (value.role) db.users[userIndex].role = value.role;

        await saveDB(db);

        const { password, ...safeUser } = db.users[userIndex];
        res.json(safeUser);
    } catch (error) {
        console.error("Erro ao atualizar usuário:", error);
        res.status(500).json({ error: "Erro interno ao atualizar usuário" });
    }
});

app.delete("/users/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        
        // Não permite deletar usuários de ambiente
        if (id.startsWith('env_')) {
            return res.status(403).json({ error: "Não é possível excluir usuários de ambiente via interface." });
        }

        const db = await getDB();
        const initialLength = db.users.length;
        db.users = db.users.filter(u => u.id !== id);

        if (db.users.length === initialLength) {
            return res.status(404).json({ error: "Usuário não encontrado" });
        }

        await saveDB(db);
        res.json({ message: "Usuário removido com sucesso" });
    } catch (error) {
        console.error("Erro ao excluir usuário:", error);
        res.status(500).json({ error: "Erro interno ao excluir usuário" });
    }
});

// 📊 Rota para buscar avaliações
app.get("/avaliacoes", requireAuth, async (req, res) => {
    try {
        const db = await getDB();
        res.json(db.avaliacoes);
    } catch (error) {
        res.status(500).json({ error: "Erro ao buscar avaliações" });
    }
});

app.get("/questionarios", requireAuth, async (req, res) => {
    try {
        const db = await getDB();
        res.json(db.questionarios);
    } catch (error) {
        res.status(500).json({ error: "Erro ao buscar questionários" });
    }
});

// 📈 Estatísticas agregadas
app.get("/estatisticas", requireAuth, async (req, res) => {
    try {
        const db = await getDB()
        const avaliacoes = db.questionarios
        const total = avaliacoes.length

        if (total === 0) {
            return res.json({
                total: 0,
                mediaQualidade: 0,
                mediaVariedade: 0,
                mediaTemperatura: 0,
                mediaLimpeza: 0,
                mediaOrganizacao: 0,
                mediaNotaGeral: 0,
            })
        }

        const media = (campo) =>
            (avaliacoes.reduce((acc, a) => acc + (a[campo] || 0), 0) / total).toFixed(1)

        res.json({
            total,
            mediaQualidade: media("qualidade"),
            mediaVariedade: media("variedade"),
            mediaTemperatura: media("temperatura"),
            mediaLimpeza: media("limpeza"),
            mediaOrganizacao: media("organizacao"),
            mediaNotaGeral: media("notaGeral"),
        })
    } catch (err) {
        console.error(err)
        res.status(500).json({ error: "Erro ao calcular estatísticas." })
    }
})

// 🔍 Status
app.get("/", (req, res) => {
    res.send("✅ API de Avaliações rodando com sucesso!")
})

// 🚀 Inicialização
app.listen(PORT, () => {
    console.log(`✅ Servidor rodando em http://localhost:${PORT}`)
})

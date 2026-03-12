import express from "express"
import cors from "cors"
import bodyParser from "body-parser"
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
import { DatabaseSync } from "node:sqlite"


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

const isProduction = process.env.NODE_ENV === "production"
const trustProxyEnabled = (process.env.TRUST_PROXY ?? (isProduction ? "true" : "false")) === "true"
app.set("trust proxy", trustProxyEnabled ? 1 : false)

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

const sessionCleanupInterval = setInterval(() => {
    const now = Date.now()
    for (const [token, session] of sessions.entries()) {
        if (!session || session.expires < now) {
            sessions.delete(token)
        }
    }
}, 10 * 60 * 1000)
if (typeof sessionCleanupInterval.unref === 'function') sessionCleanupInterval.unref()

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
const allowedOrigins = isProduction
    ? [...new Set([...envOrigins])]
    : [...new Set([...defaultOrigins, ...envOrigins])]

function isAllowedOrigin(origin) {
    if (!origin) return true
    if (allowedOrigins.includes(origin)) return true
    if (!isProduction && /^http:\/\/(localhost|127\.0\.0\.1):\d{2,5}$/.test(origin)) return true
    if (!isProduction && /^http:\/\/(10\.\d{1,3}\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}):\d{2,5}$/.test(origin)) return true

    return false
}
app.use(cors({
    origin: function(origin, callback) {
        if (isProduction && allowedOrigins.length === 0 && origin) {
            return callback(new Error('Not allowed by CORS'))
        }
        if (isAllowedOrigin(origin)) {
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
        if (!origin) return res.sendStatus(204)
        if (!isAllowedOrigin(origin)) return res.status(403).send('Not allowed by CORS')

        res.header('Access-Control-Allow-Origin', origin)
        res.header('Access-Control-Allow-Credentials', 'true')
        res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
        res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, X-Requested-With, content-type')
        return res.sendStatus(204)
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

const submitLimiter = rateLimit({
    windowMs: parseInt(process.env.SUBMIT_RATE_LIMIT_WINDOW_MS) || 10 * 60 * 1000,
    max: parseInt(process.env.SUBMIT_RATE_LIMIT_MAX_REQUESTS) || 60,
    message: { error: 'Muitas tentativas. Tente novamente em alguns minutos.' },
    standardHeaders: true,
    legacyHeaders: false,
})

app.use(bodyParser.json({ limit: process.env.BODY_LIMIT || '1mb' }))
app.use(cookieParser())

const SQLITE_FILE = process.env.SQLITE_FILE || "./database.sqlite"

const sqlite = new DatabaseSync(SQLITE_FILE)

sqlite.exec("PRAGMA foreign_keys = ON;")

sqlite.exec(`
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role TEXT NOT NULL,
    createdAt TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS avaliacoes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    avaliacao TEXT NOT NULL,
    sugestao TEXT,
    notaGeral INTEGER,
    data TEXT NOT NULL,
    ip TEXT
);

CREATE TABLE IF NOT EXISTS questionarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    horario TEXT,
    notaGeral INTEGER NOT NULL,
    sugestao TEXT,
    data TEXT NOT NULL,
    ip TEXT,
    payload_json TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS form_config (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    config_json TEXT NOT NULL
);
`)

function getFormConfig() {

    const row = sqlite
        .prepare("SELECT config_json FROM form_config WHERE id = 1")
        .get()

    return row?.config_json ? JSON.parse(row.config_json) : null
}

function setFormConfig(config) {

    if (!config) return

    sqlite.prepare(`
        INSERT INTO form_config (id, config_json)
        VALUES (1, ?)
        ON CONFLICT(id) DO UPDATE SET
        config_json = excluded.config_json
    `).run(JSON.stringify(config))
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
        const isSecureRequest = Boolean(req.secure || String(req.headers['x-forwarded-proto'] || '').toLowerCase() === 'https')
        res.clearCookie('authToken', { httpOnly: true, sameSite: 'strict', secure: isProduction ? isSecureRequest : false, path: '/' })
        return res.status(401).json({ error: 'Token inválido ou expirado' })
    }

    const currentUa = String(req.headers['user-agent'] || '')
    const currentUaHash = crypto.createHash('sha256').update(currentUa).digest('hex')
    if (session.uaHash && session.uaHash !== currentUaHash) {
        sessions.delete(token)
        const isSecureRequest = Boolean(req.secure || String(req.headers['x-forwarded-proto'] || '').toLowerCase() === 'https')
        res.clearCookie('authToken', { httpOnly: true, sameSite: 'strict', secure: isProduction ? isSecureRequest : false, path: '/' })
        return res.status(401).json({ error: 'Token inválido ou expirado' })
    }

    // Atualiza último acesso
    session.lastAccess = Date.now()
    req.user = session.user
    next()
}

// Esquemas de validação Joi
const loginPasswordMinLengthEnv = Number.parseInt(process.env.LOGIN_PASSWORD_MIN_LENGTH || "", 10)
const loginPasswordMinLength = Number.isFinite(loginPasswordMinLengthEnv)
    ? loginPasswordMinLengthEnv
    : (isProduction ? 8 : 3)

const loginSchema = Joi.object({
    // Permite usuários de LDAP com caracteres comuns: letras, números, ponto, underline, hífen, @ e barra invertida (domínio\\usuário)
    username: Joi.string().pattern(/^[A-Za-z0-9._\-@\\]{3,64}$/).required(),
    password: Joi.string().min(loginPasswordMinLength).max(128).required()
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

const dynamicQuestionarioValueSchema = Joi.alternatives().try(
    Joi.number(),
    Joi.boolean(),
    Joi.string().max(1000).allow(''),
    Joi.array().max(20).items(Joi.number(), Joi.string().max(200).allow(''), Joi.boolean())
)

const questionarioSubmitSchema = Joi.object({
    notaGeral: Joi.number().integer().min(0).max(10).required(),
    sugestao: Joi.string().max(500).allow('').trim(),
    horario: Joi.string().valid('Café', 'Almoço', 'Jantar').optional(),
    avaliacaoInicial: Joi.string().valid('excelente', 'bom', 'ruim').optional(),
}).pattern(/.*/, dynamicQuestionarioValueSchema).max(100)

// Rota para SSE (Server-Sent Events) - Atualizações em tempo real para o Dashboard
app.get('/events', requireAuth, requireManagerOrAdmin, (req, res) => {
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
      const uaHash = crypto.createHash('sha256').update(String(req.headers['user-agent'] || '')).digest('hex')

      sessions.set(token, {
        user: {
          username: user.username,
          role: user.role
        },
        uaHash,
        expires,
        createdAt: Date.now(),
        lastAccess: Date.now()
      })

      const isSecureRequest = Boolean(req.secure || String(req.headers['x-forwarded-proto'] || '').toLowerCase() === 'https')
      res.cookie("authToken", token, {
        httpOnly: true,
        secure: isProduction ? isSecureRequest : false,
        sameSite: "strict",
        path: "/",
        maxAge: 24 * 60 * 60 * 1000
      })

      res.json({
        success: true,
        user: {
          username: user.username,
          role: user.role
        }
      })
  }

  // 1. Tenta autenticação no banco de dados local
  const dbUser = sqlite
      .prepare("SELECT id, username, password, role, createdAt FROM users WHERE username = ?")
      .get(value.username)
  
  if (dbUser) {
      // Verifica senha (suporta hash e plain text para migração)
      const isMatch = await bcrypt.compare(value.password, dbUser.password).catch(() => false)
      
      if (isMatch) {
          return createSession(dbUser)
      } else if (dbUser.password === value.password) {
          // Auto-migração: converte senha em texto plano para hash
          try {
              const hashedPassword = await bcrypt.hash(value.password, 10)
              sqlite.prepare("UPDATE users SET password = ? WHERE id = ?").run(hashedPassword, dbUser.id)
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
        const isSecureRequest = Boolean(req.secure || String(req.headers['x-forwarded-proto'] || '').toLowerCase() === 'https')
        res.clearCookie('authToken', { httpOnly: true, sameSite: 'strict', secure: isProduction ? isSecureRequest : false, path: '/' })

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
app.post("/avaliar", submitLimiter, async (req, res) => {
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
            else if (notaGeral <= 7) avaliacao = "bom";
            else avaliacao = "excelente";
        }

        const novaAvaliacao = {
            id: Date.now(),
            avaliacao,
            sugestao: sugestao || "",
            notaGeral: notaGeral ?? null,
            data: new Date().toISOString(),
            ip: req.ip || 'unknown'
        };

        sqlite.prepare(
            "INSERT OR REPLACE INTO avaliacoes (id, avaliacao, sugestao, notaGeral, data, ip) VALUES (?, ?, ?, ?, ?, ?)"
        ).run(
            novaAvaliacao.id,
            novaAvaliacao.avaliacao,
            novaAvaliacao.sugestao,
            novaAvaliacao.notaGeral === null ? null : Number(novaAvaliacao.notaGeral),
            novaAvaliacao.data,
            novaAvaliacao.ip
        );

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
app.post("/questionario", submitLimiter, async (req, res) => {
    try {
        const { error, value } = questionarioSubmitSchema.validate(req.body)
        if (error) {
            return res.status(400).json({ error: "Dados inválidos: " + error.details[0].message })
        }

        const { notaGeral, horario, sugestao, avaliacaoInicial, ...outrosCampos } = value;

        const novoQuestionario = {
            id: Date.now(),
            horario: horario || "Não informado",
            notaGeral,
            sugestao: sugestao || "",
            ...outrosCampos, // Salva todos os campos dinâmicos (qualidade, variedade, perguntas novas, etc.)
            data: new Date().toISOString(),
            ip: req.ip
        };

        sqlite.exec("BEGIN")
        try {
            sqlite.prepare(
                "INSERT OR REPLACE INTO questionarios (id, horario, notaGeral, sugestao, data, ip, payload_json) VALUES (?, ?, ?, ?, ?, ?, ?)"
            ).run(
                novoQuestionario.id,
                novoQuestionario.horario,
                Number(novoQuestionario.notaGeral),
                novoQuestionario.sugestao,
                novoQuestionario.data,
                novoQuestionario.ip ? String(novoQuestionario.ip) : null,
                JSON.stringify(novoQuestionario)
            )

            if (avaliacaoInicial) {
                const novaAvaliacao = {
                    id: Date.now() - 1,
                    avaliacao: avaliacaoInicial,
                    sugestao: sugestao || "",
                    notaGeral,
                    data: new Date().toISOString(),
                    ip: req.ip
                };

                sqlite.prepare(
                    "INSERT OR REPLACE INTO avaliacoes (id, avaliacao, sugestao, notaGeral, data, ip) VALUES (?, ?, ?, ?, ?, ?)"
                ).run(
                    novaAvaliacao.id,
                    novaAvaliacao.avaliacao,
                    novaAvaliacao.sugestao,
                    novaAvaliacao.notaGeral === null || novaAvaliacao.notaGeral === undefined ? null : Number(novaAvaliacao.notaGeral),
                    novaAvaliacao.data,
                    novaAvaliacao.ip ? String(novaAvaliacao.ip) : null
                )
            }

            sqlite.exec("COMMIT")
        } catch (e) {
            sqlite.exec("ROLLBACK")
            throw e
        }
        
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
        let formConfig = getFormConfig()

        if (!formConfig) {
            formConfig = {
                questions: [
                    { id: "qualidade", type: "stars", label: "Qualidade da Refeição", enabled: true },
                    { id: "variedade", type: "stars", label: "Variedade de Opções", enabled: true },
                    { id: "temperatura", type: "stars", label: "Temperatura dos Alimentos", enabled: true },
                    { id: "limpeza", type: "stars", label: "Limpeza do Ambiente", enabled: true },
                    { id: "organizacao", type: "stars", label: "Organização e Atendimento", enabled: true }
                ]
            };
            setFormConfig(formConfig)
        }

        res.json(formConfig);
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

        const formConfig = { questions }
        setFormConfig(formConfig)

        res.json({ message: "Configuração salva com sucesso", config: formConfig });
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
        // Retorna usuários do banco + usuários de ambiente (marcados como tal)
        const dbUsers = sqlite
            .prepare("SELECT id, username, role, createdAt FROM users ORDER BY createdAt DESC")
            .all()
            .map(u => ({ ...u, origin: 'database' }));
        const dbUsernames = new Set(dbUsers.map(u => u.username));
        const envUsers = validUsers
            .filter(u => !dbUsernames.has(u.username))
            .map(u => ({ username: u.username, role: u.role, origin: 'env', id: 'env_' + u.username }));
        
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
        
        // Verifica se usuário já existe (no DB ou Env)
        const usernameExists = sqlite.prepare("SELECT 1 FROM users WHERE username = ?").get(value.username)
        if (usernameExists) {
            return res.status(400).json({ error: "Usuário já existe" });
        }

        const newUser = {
            id: Date.now().toString(),
            username: value.username,
            password: await bcrypt.hash(value.password, 10), // Senha hashada
            role: value.role,
            createdAt: new Date().toISOString()
        };

        sqlite.prepare(
            "INSERT INTO users (id, username, password, role, createdAt) VALUES (?, ?, ?, ?, ?)"
        ).run(newUser.id, newUser.username, newUser.password, newUser.role, newUser.createdAt);

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

        const existingUser = sqlite
            .prepare("SELECT id, username, role, createdAt FROM users WHERE id = ?")
            .get(id);

        if (!existingUser) {
            return res.status(404).json({ error: "Usuário não encontrado" });
        }

        if (value.username) {
            const usernameTaken = sqlite
                .prepare("SELECT 1 FROM users WHERE username = ? AND id <> ?")
                .get(value.username, id);
            if (usernameTaken || validUsers.some(u => u.username === value.username)) {
                return res.status(400).json({ error: "Usuário já existe" });
            }
            sqlite.prepare("UPDATE users SET username = ? WHERE id = ?").run(value.username, id);
        }
        if (value.password) {
            const hashed = await bcrypt.hash(value.password, 10);
            sqlite.prepare("UPDATE users SET password = ? WHERE id = ?").run(hashed, id);
        }
        if (value.role) {
            sqlite.prepare("UPDATE users SET role = ? WHERE id = ?").run(value.role, id);
        }

        const updatedUser = sqlite
            .prepare("SELECT id, username, role, createdAt FROM users WHERE id = ?")
            .get(id);
        const { password, ...safeUser } = updatedUser;
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

        const result = sqlite.prepare("DELETE FROM users WHERE id = ?").run(id);
        if (!result?.changes) {
            return res.status(404).json({ error: "Usuário não encontrado" });
        }
        res.json({ message: "Usuário removido com sucesso" });
    } catch (error) {
        console.error("Erro ao excluir usuário:", error);
        res.status(500).json({ error: "Erro interno ao excluir usuário" });
    }
});

// 📊 Rota para buscar avaliações
app.get("/avaliacoes", requireAuth, async (req, res) => {
    try {
        const avaliacoes = sqlite
            .prepare("SELECT id, avaliacao, sugestao, notaGeral, data, ip FROM avaliacoes ORDER BY id DESC")
            .all();
        res.json(avaliacoes);
    } catch (error) {
        res.status(500).json({ error: "Erro ao buscar avaliações" });
    }
});

app.get("/questionarios", requireAuth, async (req, res) => {
    try {
        const rows = sqlite.prepare("SELECT payload_json FROM questionarios ORDER BY id DESC").all();
        const questionarios = rows
            .map(r => {
                try {
                    return JSON.parse(r.payload_json)
                } catch {
                    return null
                }
            })
            .filter(Boolean);
        res.json(questionarios);
    } catch (error) {
        res.status(500).json({ error: "Erro ao buscar questionários" });
    }
});

// 📈 Estatísticas agregadas
app.get("/estatisticas", requireAuth, async (req, res) => {
    try {
        const rows = sqlite.prepare("SELECT payload_json FROM questionarios").all();
        const avaliacoes = rows
            .map(r => {
                try {
                    return JSON.parse(r.payload_json)
                } catch {
                    return null
                }
            })
            .filter(Boolean);
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

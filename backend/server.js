// server.js
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

// Carrega variáveis de ambiente
dotenv.config()

const app = express()
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
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:8000']
app.use(cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}))

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
        return data
    } catch {
        return { avaliacoes: [], questionarios: [] }
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
    username: Joi.string().alphanum().min(3).max(30).required(),
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

// 🔐 Rotas de autenticação
app.post("/login", authLimiter, async (req, res) => {
    try {
        // Validação com Joi
        const { error, value } = loginSchema.validate(req.body)
        if (error) {
            return res.status(400).json({ 
                success: false, 
                message: 'Dados inválidos: ' + error.details[0].message 
            })
        }
        
        const { username, password } = value
        
        // Verifica credenciais
        const user = validUsers.find(u => u.username === username && u.password === password)
        
        if (!user) {
            // Log de tentativa de login inválida (sem expor dados sensíveis)
            console.warn(`Tentativa de login inválida para usuário: ${username} em ${new Date().toISOString()}`)
            return res.status(401).json({ 
                success: false, 
                message: 'Credenciais inválidas' 
            })
        }
        
        // Gera token de sessão
        const token = generateToken()
        const expires = Date.now() + (24 * 60 * 60 * 1000) // 24 horas
        
        sessions.set(token, {
            user: { username: user.username, role: user.role },
            expires,
            createdAt: Date.now(),
            lastAccess: Date.now()
        })
        
        // Log de login bem-sucedido
        console.log(`Login bem-sucedido para usuário: ${username} em ${new Date().toISOString()}`)
        
        // Define cookie httpOnly para o token
        res.cookie('authToken', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production', // HTTPS em produção
            sameSite: 'strict',
            maxAge: 24 * 60 * 60 * 1000 // 24 horas
        })
        
        res.json({
            success: true,
            token, // Mantém para compatibilidade com frontend atual
            user: { username: user.username, role: user.role }
        })
        
    } catch (error) {
        console.error('Erro no login:', error.message)
        res.status(500).json({ 
            success: false, 
            message: 'Erro interno do servidor' 
        })
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
// 🧾 Rota nova — formulário completo de satisfação
app.post("/questionario", async (req, res) => {
    try {
        const dadosQuestionario = req.body;

        if (!dadosQuestionario) {
            return res.status(400).json({ error: "Dados do questionário ausentes." });
        }

        // Validação com Joi
        const { error, value } = questionarioSchema.validate(dadosQuestionario)
        if (error) {
            return res.status(400).json({ 
                error: 'Dados inválidos: ' + error.details[0].message 
            })
        }

        const db = await getDB();

        const novoQuestionario = {
            id: Date.now(),
            ...value,
            data: new Date().toISOString(),
            ip: req.ip || 'unknown'
        };

        db.questionarios.push(novoQuestionario);
        await saveDB(db);

        console.log(`Novo questionário registrado: ${value.horario} em ${new Date().toISOString()}`);

        res.json({
            message: "✅ Questionário registrado com sucesso!",
            novoQuestionario: {
                id: novoQuestionario.id,
                horario: novoQuestionario.horario,
                data: novoQuestionario.data
            }
        });

    } catch (err) {
        console.error("Erro no /questionario:", err.message);
        res.status(500).json({ error: "Erro interno ao salvar questionário." });
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

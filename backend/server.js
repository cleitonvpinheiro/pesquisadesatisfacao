import express from "express"
import cors from "cors"
import bodyParser from "body-parser"
import fs from "fs-extra"

const app = express()
const PORT = 3003
const DB_File = "./database.json"

app.use(cors())
app.use(bodyParser.json())

async function getDB() {
    return await fs.readJson(DB_File)
}

async function saveDB(data) {
    await fs.writeJSON(DB_File, data, { spaces: 2 })
}

app.post("/avaliacoes", async (req, res) => {
    try {
        const { avaliacao, sugestao } = req.body
        if (!avaliacao) 
            return res.status(400).json({ errro: "Campo 'avaliacao' é obrigatótio" })

        const db = await getDB()
        db.avaliacoes.push({
            id: Date.now(),
            avaliacao,
            sugestao: sugestao || "",
            data: new Date().toISOString()
        })
        await saveDB(db)
        res.json({ message: "Avaliação registrada com sucesso!"})
    } catch (err) {
        res.status(500).json({ error: "Erro ao salvar avaliação."})
    }
})

app.get("/avaliacoes", async (req, res) => {
    try {
        const db = await getDB();
        res.json(db.avaliacoes || []);
    } catch (err) {
        res.status(500).json({ error: "Erro ao buscar avaliações." });
    }
});
app.get("/estatisticas", async (req, res) => {
    const db = await getDB()
    const total = db.avaliacoes.length

    const estatisticas = {
        excelente: db.avaliacoes.filter(a => a.avaliacao === "excelente").length,
        bom: db.avaliacoes.filter(a => a.avaliacao === "bom").length,
        ruim: db.avaliacoes.filter(a => a.avaliacao === "ruim").length,
        total
    }

    res.json(estatisticas)
})

app.get("/", (req, res) => {
  res.send("API está rodando!");
});

app.listen(PORT, () => console.log(`✅ API rodando em http://localhost:${PORT}`))
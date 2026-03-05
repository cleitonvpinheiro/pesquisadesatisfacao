// questionario.js — Formulário detalhado
document.addEventListener('DOMContentLoaded', () => {
    // Carregar idioma salvo e aplicar traduções
    loadSavedLanguage();
    updatePageTexts();
    
    // Recupera a avaliação inicial escolhida
    const avaliacaoInicial = localStorage.getItem("avaliacaoInicial");
    console.log("Avaliação inicial:", avaliacaoInicial);

    // Cria estrelas interativas
    document.querySelectorAll('.estrelas').forEach(div => {
        for (let i = 1; i <= 5; i++) {
            const estrela = document.createElement('span');
            estrela.textContent = '⭐';
            estrela.dataset.valor = i;
            estrela.style.cursor = 'pointer';
            estrela.style.fontSize = '22px';
            estrela.style.marginRight = '4px';
            estrela.addEventListener('click', () => selecionarEstrelas(div, i));
            div.appendChild(estrela);
        }
    });

    const form = document.getElementById('formSatisfacao');
    const campoSugestao = form.querySelector('[name="sugestao"]');
    const selectNota = document.getElementById('notaGeral');
    const classificacaoDiv = document.getElementById('classificacao-nota');

    // Função para classificar e mostrar feedback da nota
    function classificarNota(nota) {
        const numeroNota = parseInt(nota);
        let classificacao = '';
        let classe = '';
        let emoji = '';

        // Verifica se a nota é válida (0-10)
        if (isNaN(numeroNota) || numeroNota < 0 || numeroNota > 10) {
            classificacaoDiv.textContent = '';
            classificacaoDiv.className = 'classificacao-feedback';
            return;
        }

        if (numeroNota <= 3) {
            classificacao = 'Ruim';
            classe = 'classificacao-ruim';
            emoji = '😞';
        } else if (numeroNota >= 4 && numeroNota <= 6) {
            classificacao = 'Bom';
            classe = 'classificacao-bom';
            emoji = '😃';
        } else if (numeroNota >= 7 && numeroNota <= 10) {
            classificacao = 'Excelente';
            classe = 'classificacao-excelente';
            emoji = '😊';
        }

        if (classificacao) {
            classificacaoDiv.textContent = `${emoji} ${classificacao}`;
            classificacaoDiv.className = `classificacao-feedback ${classe} show`;
        } else {
            classificacaoDiv.textContent = '';
            classificacaoDiv.className = 'classificacao-feedback';
        }
    }

    // Event listener para mudança na nota geral
    if (selectNota) {
        selectNota.addEventListener('change', (e) => {
            const nota = e.target.value;
            if (nota) {
                classificarNota(nota);
            } else {
                classificacaoDiv.textContent = '';
                classificacaoDiv.className = 'classificacao-feedback';
            }
        });
    }

    // Envio do formulário
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Recupera a avaliação inicial escolhida
        const avaliacaoInicial = localStorage.getItem("avaliacaoInicial");
        if (!avaliacaoInicial) {
            alert(t('initialEvaluationNotSelected'));
            return;
        }

        // Pega valores selecionados para /avaliar
        const dadosAvaliacao = {
            avaliacao: avaliacaoInicial,
            sugestao: form.sugestao?.value.trim() || "",
            notaGeral: Number(form.notaGeral?.value || 0)
        };
        // Pega valores selecionados para /questionario
        const dadosQuestionario = {
            horario: form.horario?.value || "",
            qualidade: Number(form.querySelector('[data-pergunta="qualidade"]')?.dataset.valor || 0),
            variedade: Number(form.querySelector('[data-pergunta="variedade"]')?.dataset.valor || 0),
            temperatura: Number(form.querySelector('[data-pergunta="temperatura"]')?.dataset.valor || 0),
            cardapio: form.cardapio?.value || "",
            limpeza: Number(form.querySelector('[data-pergunta="limpeza"]')?.dataset.valor || 0),
            organizacao: Number(form.querySelector('[data-pergunta="organizacao"]')?.dataset.valor || 0),
            espera: form.espera?.value || "",
            notaGeral: form.notaGeral?.value ? Number(form.notaGeral.value) : null
,
            sugestao: form.sugestao?.value.trim() || ""
        };

        // Validação obrigatória
        if (!dadosQuestionario.horario) {
            alert(t('selectSchedule'));
            form.horario.focus();
            return;
        }

        if (!dadosQuestionario.notaGeral && dadosQuestionario.notaGeral !== 0) {
            alert(t('selectOverallRating'));
            form.notaGeral.focus();
            return;
        }

        // Regras de obrigatoriedade
        const menorNota =
            Math.min(dadosQuestionario.qualidade, dadosQuestionario.variedade, dadosQuestionario.temperatura, dadosQuestionario.limpeza, dadosQuestionario.organizacao);

        if (avaliacaoInicial === "ruim" || menorNota <= 2) {
            if (!dadosQuestionario.sugestao) {
                alert(t('suggestionRequired'));
                campoSugestao.focus();
                return;
            }
        }

        console.log("Dados enviados para /avaliar:", dadosAvaliacao);
        console.log("Dados enviados para /questionario:", dadosQuestionario);

        // Envia os dados para o servidor
        try {
            // Primeiro envia a avaliação simples; se falhar, interrompe
            const resAvaliacao = await fetch('http://localhost:3003/avaliar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dadosAvaliacao)
            });
            if (!resAvaliacao.ok) {
                throw new Error("Erro ao enviar avaliação inicial.");
            }

            // Em seguida tenta enviar o questionário detalhado;
            // caso falhe, apenas registra o erro e segue com o redirecionamento
            let questionarioOk = true;
            try {
                const resQuestionario = await fetch('http://localhost:3003/questionario', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(dadosQuestionario)
                });
                if (!resQuestionario.ok) {
                    questionarioOk = false;
                    console.warn("Questionário detalhado não foi aceito:", resQuestionario.status);
                }
            } catch (errQ) {
                questionarioOk = false;
                console.warn("Falha ao enviar questionário detalhado:", errQ);
            }

            // Agradece e redireciona independentemente do sucesso do questionário detalhado
            alert(t('thankYouResponse'));
            localStorage.removeItem("avaliacaoInicial");
            // Redireciona imediatamente
            window.location.href = "./index.html";
            // Fallback após 1.5s caso o primeiro redirect seja bloqueado
            setTimeout(() => {
                try {
                    if (!location.pathname.endsWith("index.html")) {
                        window.location.replace("./index.html");
                    }
                } catch (e) {
                    // Silencia qualquer erro de navegação
                }
            }, 1500);
        } catch (err) {
            console.error("Erro ao enviar avaliação inicial:", err);
            alert(t('connectionError'));
            // Redireciona mesmo em caso de erro para evitar travar o fluxo
            try {
                localStorage.removeItem("avaliacaoInicial");
            } catch (_) {}
            window.location.href = "./index.html";
            setTimeout(() => {
                try {
                    if (!location.pathname.endsWith("index.html")) {
                        window.location.replace("./index.html");
                    }
                } catch (e) {
                    // Silencia qualquer erro de navegação
                }
            }, 1500);
        }

    });
});

// Função para seleção de estrelas
function selecionarEstrelas(container, valor) {
    container.dataset.valor = valor;
    container.querySelectorAll('span').forEach((estrela, index) => {
        estrela.style.filter = index < valor ? 'grayscale(0)' : 'grayscale(1)';
    });
}

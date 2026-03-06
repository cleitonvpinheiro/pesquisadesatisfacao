// questionario.js — Formulário dinâmico
document.addEventListener('DOMContentLoaded', () => {
    // Carregar idioma salvo e aplicar traduções
    loadSavedLanguage();
    updatePageTexts();
    
    // Recupera a avaliação inicial escolhida
    const avaliacaoInicial = localStorage.getItem("avaliacaoInicial");
    console.log("Avaliação inicial:", avaliacaoInicial);

    const form = document.getElementById('formSatisfacao');
    const questionsContainer = document.getElementById('questions-container');
    const classificacaoDiv = document.getElementById('classificacao-nota');
    const selectNota = document.getElementById('notaGeral');

    // Carregar configurações do formulário
    loadFormConfig();

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

    async function loadFormConfig() {
        try {
            const response = await fetch('http://localhost:3003/config/form');
            if (!response.ok) throw new Error('Falha ao carregar configuração');
            const config = await response.json();
            
            renderQuestions(config.questions || []);
        } catch (error) {
            console.error('Erro ao carregar perguntas:', error);
            questionsContainer.innerHTML = '<p class="error">Erro ao carregar o formulário. Por favor, recarregue a página.</p>';
        }
    }

    function renderQuestions(questions) {
        questionsContainer.innerHTML = ''; // Limpa loading

        questions.forEach(question => {
            if (!question.enabled) return;

            const questionDiv = document.createElement('div');
            questionDiv.className = 'question-block';
            questionDiv.style.marginBottom = '20px';
            questionDiv.dataset.id = question.id;
            questionDiv.dataset.type = question.type;

            const label = document.createElement('label');
            label.style.fontWeight = 'bold';
            label.style.display = 'block';
            label.style.marginBottom = '10px';
            label.textContent = question.label; // TODO: Adicionar suporte a tradução se necessário
            questionDiv.appendChild(label);

            if (question.type === 'stars') {
                const starsDiv = document.createElement('div');
                starsDiv.className = 'estrelas';
                starsDiv.dataset.pergunta = question.id;
                
                for (let i = 1; i <= 5; i++) {
                    const estrela = document.createElement('span');
                    estrela.textContent = '⭐';
                    estrela.dataset.valor = i;
                    estrela.style.cursor = 'pointer';
                    estrela.style.fontSize = '22px';
                    estrela.style.marginRight = '4px';
                    estrela.addEventListener('click', () => selecionarEstrelas(starsDiv, i));
                    starsDiv.appendChild(estrela);
                }
                questionDiv.appendChild(starsDiv);

            } else if (question.type === 'radio') {
                const optionsDiv = document.createElement('div');
                optionsDiv.style.display = 'flex';
                optionsDiv.style.gap = '15px';
                optionsDiv.style.flexWrap = 'wrap';

                question.options.forEach(opt => {
                    const labelOpt = document.createElement('label');
                    labelOpt.style.fontWeight = 'normal';
                    labelOpt.style.cursor = 'pointer';
                    labelOpt.style.display = 'flex';
                    labelOpt.style.alignItems = 'center';
                    labelOpt.style.gap = '5px';

                    const input = document.createElement('input');
                    input.type = 'radio';
                    input.name = question.id;
                    input.value = opt;
                    
                    labelOpt.appendChild(input);
                    labelOpt.appendChild(document.createTextNode(opt));
                    optionsDiv.appendChild(labelOpt);
                });
                questionDiv.appendChild(optionsDiv);
            }

            questionsContainer.appendChild(questionDiv);
        });
    }

    // Função global para seleção de estrelas (necessária para o onclick gerado dinamicamente)
    window.selecionarEstrelas = function(container, valor) {
        const estrelas = container.querySelectorAll('span');
        container.dataset.valor = valor;
        
        estrelas.forEach(estrela => {
            const val = parseInt(estrela.dataset.valor);
            if (val <= valor) {
                estrela.style.opacity = '1';
                estrela.style.filter = 'grayscale(0%)';
            } else {
                estrela.style.opacity = '0.3';
                estrela.style.filter = 'grayscale(100%)';
            }
        });
    };

    // Envio do formulário
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Recupera a avaliação inicial escolhida
        const avaliacaoInicial = localStorage.getItem("avaliacaoInicial");
        if (!avaliacaoInicial) {
            alert(t('initialEvaluationNotSelected') || "Avaliação inicial não selecionada.");
            return;
        }

        // Coleta dados dinâmicos
        const dadosQuestionario = {
            notaGeral: form.notaGeral?.value ? Number(form.notaGeral.value) : null,
            sugestao: form.sugestao?.value.trim() || ""
        };

        // Itera sobre as perguntas renderizadas para coletar valores
        const questions = questionsContainer.querySelectorAll('.question-block');
        let isValid = true;

        questions.forEach(qDiv => {
            const id = qDiv.dataset.id;
            const type = qDiv.dataset.type;
            
            if (type === 'stars') {
                const starsDiv = qDiv.querySelector('.estrelas');
                const val = starsDiv.dataset.valor ? Number(starsDiv.dataset.valor) : 0;
                dadosQuestionario[id] = val;
            } else if (type === 'radio') {
                const checked = qDiv.querySelector(`input[name="${id}"]:checked`);
                dadosQuestionario[id] = checked ? checked.value : "";
                
                // Validação específica para horário (exemplo de regra de negócio mantida)
                if (id === 'horario' && !dadosQuestionario[id]) {
                    isValid = false;
                    alert(t('selectSchedule') || "Por favor, selecione o horário.");
                }
            }
        });

        if (!isValid) return;

        if (!dadosQuestionario.notaGeral && dadosQuestionario.notaGeral !== 0) {
            alert(t('selectOverallRating') || "Por favor, selecione a nota geral.");
            form.notaGeral.focus();
            return;
        }

        // Validação de sugestão obrigatória para notas baixas
        // Calcula a menor nota entre as avaliações de estrelas
        const notasEstrelas = Object.values(dadosQuestionario).filter(v => typeof v === 'number' && v <= 5 && v >= 0); // Filtra apenas as notas de estrelas (0-5)
        const menorNota = notasEstrelas.length > 0 ? Math.min(...notasEstrelas) : 5;

        if (avaliacaoInicial === "ruim" || menorNota <= 2) {
            if (!dadosQuestionario.sugestao) {
                alert(t('suggestionRequired') || "Por favor, deixe uma sugestão para nos ajudar a melhorar.");
                form.sugestao.focus();
                return;
            }
        }

        const dadosAvaliacao = {
            avaliacao: avaliacaoInicial,
            sugestao: dadosQuestionario.sugestao,
            notaGeral: dadosQuestionario.notaGeral
        };

        console.log("Dados enviados:", dadosQuestionario);

        // Envia os dados para o servidor
        try {
            // 1. Envia avaliação inicial (/avaliar)
            const resAvaliacao = await fetch('http://localhost:3003/avaliar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dadosAvaliacao)
            });
            if (!resAvaliacao.ok) throw new Error("Erro ao enviar avaliação inicial.");

            // 2. Envia questionário completo (/questionario)
            try {
                const resQuestionario = await fetch('http://localhost:3003/questionario', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(dadosQuestionario)
                });
                if (!resQuestionario.ok) {
                    console.warn("Questionário detalhado não foi aceito:", resQuestionario.status);
                }
            } catch (errQ) {
                console.warn("Falha ao enviar questionário detalhado:", errQ);
            }

            alert(t('thankYouResponse') || "Obrigado pela sua avaliação!");
            localStorage.removeItem("avaliacaoInicial");
            window.location.href = "./index.html";
        } catch (err) {
            console.error("Erro ao enviar:", err);
            alert(t('connectionError') || "Erro de conexão. Tente novamente.");
        }
    });
});

const urlBackend = 'http://localhost:3003';
let graficoClassificacao, graficoNotas;
let dadosAtuais = []; // Armazena os dados atuais para exportação

async function carregarDados() {
  try {
    const [avaliacoes, questionarios] = await Promise.all([
      authenticatedFetch(`${urlBackend}/avaliacoes`).then(r => r.json()).catch(() => []),
      authenticatedFetch(`${urlBackend}/questionarios`).then(r => r.json()).catch(() => [])
    ]);

    // Remove duplicidades: quando há questionário e avaliação quase simultâneos com mesma sugestão
    const timeWindowMs = 5 * 60 * 1000; // 5 minutos
    const avaliacoesFiltradas = avaliacoes.filter(a => {
      return !questionarios.some(q => {
        const sugestaoMatch = (a.sugestao || '').trim().toLowerCase() === (q.sugestao || '').trim().toLowerCase();
        const dataA = new Date(a.data).getTime();
        const dataQ = new Date(q.data).getTime();
        const tempoProximo = Math.abs(dataA - dataQ) <= timeWindowMs;
        // Se IPs existem, usamos para maior precisão; caso contrário, apenas sugestão+tempo
        const ipMatch = (a.ip && q.ip) ? (a.ip === q.ip) : true;
        return sugestaoMatch && tempoProximo && ipMatch;
      });
    });

    // Combina dados: usa questionários completos e adiciona avaliações simples (já filtradas)
    const questionariosCombinados = [
      ...questionarios,
      ...avaliacoesFiltradas.map(a => ({
        notaGeral: typeof a.notaGeral === 'number' ? a.notaGeral : null,
        sugestao: a.sugestao || '',
        data: a.data,
        ip: a.ip
      }))
    ];

    dadosAtuais = questionariosCombinados; // Armazena os dados para exportação

    atualizarGraficos([], questionariosCombinados);
    renderizarSugestoes([], questionariosCombinados);
  } catch (error) {
    console.error('Erro ao carregar dados:', error);
    // Se houver erro de autenticação, será redirecionado automaticamente
  }
}

function atualizarGraficos(avaliacoes, questionarios) {
  // Gráfico 1 — Classificação baseada na nota geral
  const ctx1 = document.getElementById("graficoClassificacao").getContext("2d");
  const contagem = { excelente: 0, bom: 0, ruim: 0 };
  
  // Calcula classificação baseada na nota geral dos questionários
  questionarios.forEach(q => {
    if (q.notaGeral !== null && q.notaGeral !== undefined) {
      if (q.notaGeral <= 3) {
        contagem.ruim++;
      } else if (q.notaGeral >= 4 && q.notaGeral <= 6) {
        contagem.bom++;
      } else if (q.notaGeral >= 7 && q.notaGeral <= 10) {
        contagem.excelente++;
      }
    }
  });

  if (graficoClassificacao) graficoClassificacao.destroy();
  graficoClassificacao = new Chart(ctx1, {
    type: "bar",
    data: {
      labels: ["Excelente", "Bom", "Ruim"],
      datasets: [{
        data: [contagem.excelente, contagem.bom, contagem.ruim],
        backgroundColor: ["#4CAF50", "#FFC107", "#F44336"]
      }]
    },
    options: { responsive: true, plugins: { legend: { display: false } } }
  });

  // Gráfico 2 — Notas gerais
  const ctx2 = document.getElementById("graficoNotas").getContext("2d");
  const notas = Array(11).fill(0);
  questionarios.forEach(q => {
    if (typeof q.notaGeral === "number" && q.notaGeral >= 0) notas[q.notaGeral]++;
  });

  if (graficoNotas) graficoNotas.destroy();

const coresNotas = Array.from({ length: 11 }, (_, i) => {
  if (i <= 3) return "#F44336"; // notas baixas → vermelho
  if (i <= 6) return "#FFC107"; // notas médias → amarelo
  return "#4CAF50";             // notas altas → verde
});

graficoNotas = new Chart(ctx2, {
  type: "bar",
  data: {
    labels: Array.from({ length: 11 }, (_, i) => i.toString()), // notas 0 a 10
    datasets: [{
      label: "Quantidade por Nota Geral",
      data: notas,
      backgroundColor: coresNotas,
      borderRadius: 6
    }]
  },
  options: {
    responsive: true,
    plugins: {
      legend: {
        display: true,
        position: "top"
      },
      title: {
        display: false
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: { display: true, text: "Quantidade" }
      },
      x: {
        title: { display: true, text: "Nota" }
      }
    }
  }
});

  document.getElementById("total-geral").textContent = questionarios.length;
  const media = questionarios.reduce((s, q) => s + (q.notaGeral || 0), 0) / questionarios.length || 0;
  document.getElementById("media-nota").textContent = media.toFixed(2);
}

function renderizarSugestoes(avaliacoes, questionarios) {
  const lista = document.getElementById("lista-sugestoes");
  lista.innerHTML = "";

  const tipoFiltro = document.getElementById("tipoFiltro").value;
  const notaFiltro = document.getElementById("notaFiltro").value;
  const dataFiltro = document.getElementById("dataFiltro").value;

  const filtradas = questionarios.filter(q => {
    // Converte data do questionário para formato yyyy-mm-dd para comparação
    const dataQuestionario = q.data ? q.data.split('T')[0] : '';
    const dataOk = !dataFiltro || dataQuestionario === dataFiltro;
    const notaOk = !notaFiltro || q.notaGeral == notaFiltro;
    
    // Calcula classificação para filtro baseada na nota geral
    let classificacaoQuestionario = "";
    if (q.notaGeral !== null && q.notaGeral !== undefined) {
      if (q.notaGeral <= 3) {
        classificacaoQuestionario = "Ruim";
      } else if (q.notaGeral >= 4 && q.notaGeral <= 6) {
        classificacaoQuestionario = "Bom";
      } else if (q.notaGeral >= 7 && q.notaGeral <= 10) {
        classificacaoQuestionario = "Excelente";
      }
    }
    
    const tipoOk = !tipoFiltro || classificacaoQuestionario === tipoFiltro;
    return dataOk && notaOk && tipoOk;
  });

  if (filtradas.length === 0) {
    lista.innerHTML = "<li>Nenhuma sugestão encontrada.</li>";
    return;
  }

  filtradas.forEach(q => {
    const li = document.createElement("li");
    
    // Calcula classificação baseada na nota geral
    let classificacao = "Sem classificação";
    let classeCSS = "";
    
    if (q.notaGeral !== null && q.notaGeral !== undefined) {
      if (q.notaGeral <= 3) {
        classificacao = "Ruim";
        classeCSS = "ruim";
      } else if (q.notaGeral >= 4 && q.notaGeral <= 6) {
        classificacao = "Bom";
        classeCSS = "bom";
      } else if (q.notaGeral >= 7 && q.notaGeral <= 10) {
        classificacao = "Excelente";
        classeCSS = "excelente";
      }
    }
    
    li.className = `sugestao-item ${classeCSS}`;
    li.innerHTML = `
      <div>
        <strong>${classificacao}</strong><br>
        ${q.sugestao ? `<em>Sugestão:</em> ${q.sugestao}<br>` : ""}
        <small>Nota geral: ${q.notaGeral}</small>
      </div>
      <span class="data">${new Date(q.data).toLocaleString()}</span>
    `;
    lista.appendChild(li);
  });
}

// Função para exportar dados para Excel
function exportarParaExcel() {
  const tipoFiltro = document.getElementById("tipoFiltro").value;
  const notaFiltro = document.getElementById("notaFiltro").value;
  const dataFiltro = document.getElementById("dataFiltro").value;

  // Aplica os mesmos filtros usados na renderização
  const dadosFiltrados = dadosAtuais.filter(q => {
    const dataQuestionario = q.data ? q.data.split('T')[0] : '';
    const dataOk = !dataFiltro || dataQuestionario === dataFiltro;
    const notaOk = !notaFiltro || q.notaGeral == notaFiltro;
    
    let classificacaoQuestionario = "";
    if (q.notaGeral !== null && q.notaGeral !== undefined) {
      if (q.notaGeral <= 3) {
        classificacaoQuestionario = "Ruim";
      } else if (q.notaGeral >= 4 && q.notaGeral <= 6) {
        classificacaoQuestionario = "Bom";
      } else if (q.notaGeral >= 7 && q.notaGeral <= 10) {
        classificacaoQuestionario = "Excelente";
      }
    }
    
    const tipoOk = !tipoFiltro || classificacaoQuestionario === tipoFiltro;
    return dataOk && notaOk && tipoOk;
  });

  // Prepara os dados para exportação
  const dadosExportacao = dadosFiltrados.map(q => {
    let classificacao = "Sem classificação";
    if (q.notaGeral !== null && q.notaGeral !== undefined) {
      if (q.notaGeral <= 3) {
        classificacao = "Ruim";
      } else if (q.notaGeral >= 4 && q.notaGeral <= 6) {
        classificacao = "Bom";
      } else if (q.notaGeral >= 7 && q.notaGeral <= 10) {
        classificacao = "Excelente";
      }
    }

    // Calcula notas derivadas dos campos do questionário
    let notaComida = 'N/A';
    const partesComida = ['qualidade', 'variedade', 'temperatura'].filter(k => typeof q[k] === 'number');
    if (partesComida.length > 0) {
      const soma = partesComida.reduce((acc, k) => acc + (q[k] || 0), 0);
      notaComida = Math.round(soma / partesComida.length); // média arredondada 0-5
    }

    let notaAtendimento = 'N/A';
    if (q.espera === 'Rápido') notaAtendimento = 5;
    else if (q.espera === 'Razoável') notaAtendimento = 3;
    else if (q.espera === 'Demorado') notaAtendimento = 1;

    const notaAmbiente = (typeof q.organizacao === 'number') ? q.organizacao : 'N/A';
    const notaLimpeza = (typeof q.limpeza === 'number') ? q.limpeza : 'N/A';

    return {
      'Data': new Date(q.data).toLocaleString('pt-BR'),
      'Nota Geral': q.notaGeral,
      'Classificação': classificacao,
      'Sugestão': q.sugestao || 'Sem sugestão',
      'Nota Comida': notaComida,
      'Nota Atendimento': notaAtendimento,
      'Nota Ambiente': notaAmbiente,
      'Nota Limpeza': notaLimpeza
    };
  });

  if (dadosExportacao.length === 0) {
    alert('Nenhum dado encontrado para exportar com os filtros aplicados.');
    return;
  }

  // Cria a planilha
  const ws = XLSX.utils.json_to_sheet(dadosExportacao);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Avaliações Refeitório');

  // Gera o nome do arquivo com data atual
  const dataAtual = new Date().toISOString().split('T')[0];
  const nomeArquivo = `avaliacoes_refeitorio_${dataAtual}.xlsx`;

  // Faz o download
  XLSX.writeFile(wb, nomeArquivo);
}

document.getElementById("btnFiltrar").addEventListener("click", carregarDados);
document.getElementById("btnLimpar").addEventListener("click", () => {
  document.getElementById("tipoFiltro").value = "";
  document.getElementById("notaFiltro").value = "";
  document.getElementById("dataFiltro").value = "";
  carregarDados();
});
document.getElementById("btnExportar").addEventListener("click", exportarParaExcel);



// ==========================================
// CONFIGURAÇÃO DO FORMULÁRIO
// ==========================================

let currentQuestions = [];

async function loadFormConfig() {
  try {
    const response = await authenticatedFetch(`${urlBackend}/config/form`);
    if (response.ok) {
      const config = await response.json();
      currentQuestions = config.questions || [];
      renderQuestionsList();
    }
  } catch (error) {
    console.error('Erro ao carregar configuração:', error);
  }
}

function renderQuestionsList() {
  const container = document.getElementById('questionsList');
  if (!container) return;
  container.innerHTML = '';

  currentQuestions.forEach((q, index) => {
    const item = document.createElement('div');
    item.className = 'question-item';
    item.style.border = '1px solid #ddd';
    item.style.padding = '10px';
    item.style.marginBottom = '10px';
    item.style.borderRadius = '5px';
    item.style.backgroundColor = '#f9f9f9';
    // Dark mode support inline (or use classes)
    if (document.body.classList.contains('dark-mode')) {
        item.style.backgroundColor = '#2c2c2c';
        item.style.borderColor = '#444';
    }

    // Header
    const header = document.createElement('div');
    header.style.display = 'flex';
    header.style.justifyContent = 'space-between';
    header.style.marginBottom = '5px';
    header.innerHTML = `<strong>${q.type === 'stars' ? t('typeStars') : t('typeMulti')}</strong> <small style="opacity:0.7">${t('labelId')} ${q.id}</small>`;
    item.appendChild(header);

    // Label
    const labelInput = document.createElement('input');
    labelInput.type = 'text';
    labelInput.value = q.label;
    labelInput.className = 'form-control';
    labelInput.style.width = '100%';
    labelInput.style.marginBottom = '5px';
    labelInput.style.padding = '5px';
    labelInput.onchange = (e) => { currentQuestions[index].label = e.target.value; };
    item.appendChild(labelInput);

    // Options (Radio)
    if (q.type === 'radio') {
      const optionsContainer = document.createElement('div');
      optionsContainer.style.marginLeft = '10px';
      optionsContainer.style.marginBottom = '5px';
      
      (q.options || []).forEach((opt, oIndex) => {
        const optRow = document.createElement('div');
        optRow.style.display = 'flex';
        optRow.style.gap = '5px';
        optRow.style.marginBottom = '2px';
        
        const optInput = document.createElement('input');
        optInput.type = 'text';
        optInput.value = opt;
        optInput.style.flex = '1';
        optInput.style.padding = '2px';
        optInput.onchange = (e) => { currentQuestions[index].options[oIndex] = e.target.value; };
        
        const btnRemoveOpt = document.createElement('button');
        btnRemoveOpt.textContent = 'x';
        btnRemoveOpt.style.padding = '0 6px';
        btnRemoveOpt.style.background = '#ff4444';
        btnRemoveOpt.style.color = 'white';
        btnRemoveOpt.style.border = 'none';
        btnRemoveOpt.style.borderRadius = '3px';
        btnRemoveOpt.onclick = () => {
            currentQuestions[index].options.splice(oIndex, 1);
            renderQuestionsList();
        };
        
        optRow.appendChild(optInput);
        optRow.appendChild(btnRemoveOpt);
        optionsContainer.appendChild(optRow);
      });

      const btnAddOpt = document.createElement('button');
      btnAddOpt.textContent = t('btnAddOption');
      btnAddOpt.style.fontSize = '12px';
      btnAddOpt.style.padding = '2px 8px';
      btnAddOpt.style.marginTop = '5px';
      btnAddOpt.onclick = () => {
          if (!currentQuestions[index].options) currentQuestions[index].options = [];
          currentQuestions[index].options.push('Nova Opção');
          renderQuestionsList();
      };
      optionsContainer.appendChild(btnAddOpt);
      item.appendChild(optionsContainer);
    }

    // Controls
    const controls = document.createElement('div');
    controls.style.display = 'flex';
    controls.style.gap = '10px';
    controls.style.marginTop = '10px';

    const btnToggle = document.createElement('button');
    btnToggle.textContent = q.enabled ? t('btnDisable') : t('btnEnable');
    btnToggle.style.backgroundColor = q.enabled ? '#ffc107' : '#28a745';
    btnToggle.style.color = 'white';
    btnToggle.onclick = () => {
      currentQuestions[index].enabled = !q.enabled;
      renderQuestionsList();
    };

    const btnRemove = document.createElement('button');
    btnRemove.textContent = t('btnRemove');
    btnRemove.style.backgroundColor = '#dc3545';
    btnRemove.style.color = 'white';
    btnRemove.onclick = () => {
      if (confirm(t('confirmRemoveQuestion'))) {
        currentQuestions.splice(index, 1);
        renderQuestionsList();
      }
    };

    controls.appendChild(btnToggle);
    controls.appendChild(btnRemove);
    item.appendChild(controls);

    container.appendChild(item);
  });
}

// Config Event Listeners
const btnAddQuestion = document.getElementById('btnAddQuestion');
if (btnAddQuestion) {
    btnAddQuestion.addEventListener('click', () => {
      currentQuestions.push({
        id: 'q_' + Date.now(),
        type: 'stars',
        label: t('newQuestionLabel'),
        enabled: true
      });
      renderQuestionsList();
    });
}

const btnAddQuestionRadio = document.getElementById('btnAddQuestionRadio');
if (btnAddQuestionRadio) {
    btnAddQuestionRadio.addEventListener('click', () => {
      currentQuestions.push({
        id: 'q_' + Date.now(),
        type: 'radio',
        label: t('newQuestionRadioLabel'),
        enabled: true,
        options: ['Opção A', 'Opção B']
      });
      renderQuestionsList();
    });
}

const btnSaveConfig = document.getElementById('btnSaveConfig');
if (btnSaveConfig) {
    btnSaveConfig.addEventListener('click', async () => {
      try {
        const response = await authenticatedFetch(`${urlBackend}/config/form`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ questions: currentQuestions })
        });
        if (response.ok) alert(t('alertConfigSaved'));
        else alert(t('alertConfigError'));
      } catch (e) {
        alert(t('alertConnectionError'));
      }
    });
}

// ==========================================
// INTERNATIONALIZATION & THEME
// ==========================================

// Translations removidas pois já são importadas de translations.js

function updateLanguage(lang) {
  // Header
  const headerTitle = document.querySelector('.header-actions h1');
  if (headerTitle) headerTitle.textContent = t('dashboardTitle');
  
  const tabOverview = document.querySelector('[data-tab="dashboard-view"]');
  if (tabOverview) tabOverview.textContent = t('tabOverview');
  
  const tabConfig = document.querySelector('[data-tab="config-view"]');
  if (tabConfig) tabConfig.textContent = t('tabConfig');
  
  // Cards
  const cards = document.querySelectorAll('.card h3');
  if (cards[0]) cards[0].textContent = t('cardClassificacao');
  if (cards[1]) cards[1].textContent = t('cardNotas');
  
  // Filters
  const lblFiltro = document.querySelector('label[for="tipoFiltro"]');
  if (lblFiltro) lblFiltro.textContent = t('labelClassificacao');
  const lblInicio = document.querySelector('label[for="dataInicio"]');
  if (lblInicio) lblInicio.textContent = t('labelDataInicio');
  const lblFim = document.querySelector('label[for="dataFim"]');
  if (lblFim) lblFim.textContent = t('labelDataFim');
  
  const btnFiltrar = document.getElementById('btnFiltrar');
  if (btnFiltrar) btnFiltrar.textContent = t('btnFiltrar');
  const btnLimpar = document.getElementById('btnLimpar');
  if (btnLimpar) btnLimpar.textContent = t('btnLimpar');
  const btnExportar = document.getElementById('btnExportar');
  if (btnExportar) btnExportar.textContent = t('exportExcel');
  
  // Summary Labels
  const lblTotal = document.getElementById('label-total');
  if (lblTotal) lblTotal.textContent = t('resumoTotal');
  const lblMedia = document.getElementById('label-media');
  if (lblMedia) lblMedia.textContent = t('resumoMedia');
  const lblNPS = document.getElementById('label-nps');
  if (lblNPS) lblNPS.textContent = t('resumoNPS');

  // Table Headers
  const ths = document.querySelectorAll('#tabela-sugestoes thead th');
  if (ths.length >= 4) {
      ths[0].textContent = t('tableHeaderData');
      ths[1].textContent = t('tableHeaderRefeicao');
      ths[2].textContent = t('tableHeaderNota');
      ths[3].textContent = t('tableHeaderComentario');
  }
  
  // Config
  const configHeader = document.querySelector('#config-view h2');
  if (configHeader) configHeader.textContent = t('configTitle');
  
  const btnAddStars = document.getElementById('btnAddQuestion');
  if (btnAddStars) btnAddStars.textContent = t('btnAddStars');
  
  const btnAddRadio = document.getElementById('btnAddQuestionRadio');
  if (btnAddRadio) btnAddRadio.textContent = t('btnAddRadio');
  
  const btnSave = document.getElementById('btnSaveConfig');
  if (btnSave) btnSave.textContent = t('btnSave');
  
  // Dark Mode Button Title
  const dmToggle = document.getElementById('darkModeToggle');
  if (dmToggle) dmToggle.title = t('darkModeTitle');

  // Re-render questions list to update translations inside it
  renderQuestionsList();
}

// Sobrescreve a função global changeLanguage para atualizar também o dashboard
const originalChangeLanguage = window.changeLanguage;
window.changeLanguage = function(lang) {
    if (typeof originalChangeLanguage === 'function') {
        originalChangeLanguage(lang);
    }
    updateLanguage(lang);
};

// Tab Switching Logic
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.style.display = 'none');
    btn.classList.add('active');
    const targetId = btn.getAttribute('data-tab');
    const targetEl = document.getElementById(targetId);
    if (targetEl) targetEl.style.display = 'block';
    
    if (targetId === 'config-view') {
      loadFormConfig();
    }
  });
});

// Language Selector Event
const langSelect = document.getElementById('languageSelect');
if (langSelect) {
    langSelect.addEventListener('change', (e) => {
      updateLanguage(e.target.value);
      localStorage.setItem('selectedLanguage', e.target.value);
    });
}

// Dark Mode Toggle
const darkModeToggle = document.getElementById('darkModeToggle');
if (darkModeToggle) {
    darkModeToggle.addEventListener('click', () => {
      document.body.classList.toggle('dark-mode');
      const isDark = document.body.classList.contains('dark-mode');
      localStorage.setItem('darkMode', isDark);
      // darkModeToggle.textContent = isDark ? '☀️' : '🌙'; // Desativado para usar SVGs
      renderQuestionsList(); // Update inline styles if needed
    });
}

// Initialize
const savedLang = localStorage.getItem('selectedLanguage') || 'pt';
if (langSelect) langSelect.value = savedLang;

const savedTheme = localStorage.getItem('darkMode') === 'true';
if (savedTheme) {
  document.body.classList.add('dark-mode');
  // if (darkModeToggle) darkModeToggle.textContent = '☀️'; // Desativado
}
updateLanguage(savedLang);

// Refresh data every 60 seconds
setInterval(() => {
  if (typeof carregarDados === 'function') {
    carregarDados();
  }
}, 60000);


const urlBackend = 'http://localhost:3003';
let graficoClassificacao, graficoNotas;
let dadosAtuais = []; // Armazena os dados atuais para exportação

async function carregarDados() {
  try {
    const questionarios = await authenticatedFetch(`${urlBackend}/questionarios`).then(r => r.json());
    dadosAtuais = questionarios; // Armazena os dados para exportação

    atualizarGraficos([], questionarios);
    renderizarSugestoes([], questionarios);
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

    return {
      'Data': new Date(q.data).toLocaleString('pt-BR'),
      'Nota Geral': q.notaGeral,
      'Classificação': classificacao,
      'Sugestão': q.sugestao || 'Sem sugestão',
      'Nota Comida': q.notaComida || 'N/A',
      'Nota Atendimento': q.notaAtendimento || 'N/A',
      'Nota Ambiente': q.notaAmbiente || 'N/A',
      'Nota Limpeza': q.notaLimpeza || 'N/A'
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


carregarDados();
setInterval(carregarDados, 60000);

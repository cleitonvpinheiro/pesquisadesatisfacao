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

// Função para aplicar permissões baseadas no papel do usuário
function applyPermissions() {
    const user = getUserInfo();
    if (!user) return;

    // Exibir informações do usuário
    const userInfoDisplay = document.getElementById('user-info-display');
    if (userInfoDisplay) {
        // Mapa de roles para chaves de tradução
        const roleMap = {
            'admin': 'roleAdmin',
            'manager': 'roleManager',
            'user': 'roleUser'
        };
        // Tenta traduzir o papel usando o mapa, ou usa o original
        const roleKey = roleMap[user.role] || user.role;
        const roleName = (typeof t === 'function' ? t(roleKey) : user.role) || user.role;
        const logoutText = (typeof t === 'function' ? t('logout') : 'Sair');
        
        userInfoDisplay.innerHTML = `
            <div class="header-user-profile">
                <div style="display: flex; flex-direction: column; align-items: flex-end; line-height: 1.2;">
                    <span class="user-name">${user.username}</span>
                    <span class="user-role-badge" style="font-size: 0.75rem; padding: 1px 6px; background-color: var(--cor-primaria); color: white; border-radius: 4px;">${roleName}</span>
                </div>
                <button onclick="logout()" class="btn-logout-icon" title="${logoutText}">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                </button>
            </div>
        `;
    }

    // Permissões para Configuração (Admin ou Gestor)
    if (!isAdmin() && !isManager()) {
        const configTab = document.querySelector('.tab-btn[data-tab="config-view"]');
        if (configTab) configTab.style.display = 'none';
        
        const configView = document.getElementById('config-view');
        if (configView) configView.remove();
    } else {
        const configTab = document.querySelector('.tab-btn[data-tab="config-view"]');
        if (configTab) configTab.style.display = 'block';
    }

    // Permissões para Gerenciamento de Usuários (Apenas Admin)
    if (!isAdmin()) {
        const usersTab = document.querySelector('.tab-btn[data-tab="users-view"]');
        if (usersTab) usersTab.style.display = 'none';
        
        const usersView = document.getElementById('users-view');
        if (usersView) usersView.remove();
    } else {
        // Mostrar aba de usuários para admins
        const usersTab = document.querySelector('.tab-btn[data-tab="users-view"]');
        if (usersTab) usersTab.style.display = 'block';
        
        // Configurar event listener para a aba de usuários
        if (usersTab && !usersTab.hasAttribute('data-initialized')) {
            usersTab.setAttribute('data-initialized', 'true');
            usersTab.addEventListener('click', loadUsers);
        }
    }

    // Permissões de Gestor/Admin
    if (!isAdmin() && !isManager()) {
        // Esconder botão de exportar
        const btnExportar = document.getElementById('btnExportar');
        if (btnExportar) btnExportar.style.display = 'none';
    }
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
// USER MANAGEMENT
// ==========================================

let currentUser = null; // Para edição

async function loadUsers() {
    try {
        const response = await authenticatedFetch(`${urlBackend}/users`);
        if (response.ok) {
            const users = await response.json();
            renderUsersTable(users);
        } else {
            console.error('Erro ao carregar usuários:', response.statusText);
        }
    } catch (error) {
        console.error('Erro ao carregar usuários:', error);
    }
}

function renderUsersTable(users) {
    const tbody = document.querySelector('#usersTable tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    users.forEach(user => {
        const tr = document.createElement('tr');
        
        // Traduz o role
        const roleMap = {
            'admin': 'roleAdmin',
            'manager': 'roleManager',
            'user': 'roleUser'
        };
        const roleKey = roleMap[user.role] || user.role;
        const roleLabel = t(roleKey) || user.role;
        
        const originLabel = user.origin === 'env' ? t('originEnv') : t('originDB');
        const isEnvUser = user.origin === 'env';

        tr.innerHTML = `
            <td>${user.username}</td>
            <td><span class="badge ${user.role === 'admin' ? 'badge-admin' : user.role === 'manager' ? 'badge-manager' : 'badge-user'}">${roleLabel}</span></td>
            <td>${originLabel}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn-icon btn-edit" ${isEnvUser ? 'disabled title="Usuários de sistema não podem ser editados"' : ''} onclick="openUserModal('${user.id}', '${user.username}', '${user.role}')">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                    </button>
                    <button class="btn-icon btn-delete" ${isEnvUser ? 'disabled title="Usuários de sistema não podem ser excluídos"' : ''} onclick="deleteUser('${user.id}')">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

window.openUserModal = function(id, username, role) {
    const modal = document.getElementById('userModal');
    const modalTitle = document.getElementById('modalTitle');
    const form = document.getElementById('userForm');
    
    if (id) {
        // Edit Mode
        currentUser = { id, username, role };
        modalTitle.textContent = t('modalEditUser');
        document.getElementById('username').value = username;
        document.getElementById('role').value = role;
        document.getElementById('password').value = ''; // Senha vazia no edit significa "não alterar"
        document.getElementById('password').placeholder = 'Deixe em branco para manter a atual';
    } else {
        // Create Mode
        currentUser = null;
        modalTitle.textContent = t('modalNewUser');
        form.reset();
        document.getElementById('password').placeholder = 'Senha';
    }
    
    modal.style.display = 'block';
};

window.closeUserModal = function() {
    document.getElementById('userModal').style.display = 'none';
    currentUser = null;
};

window.saveUser = async function() {
    const username = document.getElementById('username').value;
    const role = document.getElementById('role').value;
    const password = document.getElementById('password').value;
    
    if (!username || !role) {
        alert(t('fillAllFields'));
        return;
    }

    const userData = { username, role };
    if (password) userData.password = password;
    else if (!currentUser) {
        alert(t('fillAllFields')); // Reusing fillAllFields or we could add passwordRequired
        return;
    }

    try {
        let url = `${urlBackend}/users`;
        let method = 'POST';
        
        if (currentUser) {
            url += `/${currentUser.id}`;
            method = 'PUT';
        }

        const response = await authenticatedFetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
        });

        if (response.ok) {
            closeUserModal();
            loadUsers();
            alert(t('alertUserSaved'));
        } else {
            const err = await response.json();
            alert(t('alertUserError') + ': ' + (err.error || 'Erro desconhecido'));
        }
    } catch (error) {
        console.error('Erro ao salvar usuário:', error);
        alert(t('alertConnectionError'));
    }
};

window.deleteUser = async function(id) {
    if (!confirm(t('confirmDeleteUser'))) return;

    try {
        const response = await authenticatedFetch(`${urlBackend}/users/${id}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            loadUsers();
        } else {
            const err = await response.json();
            alert('Erro: ' + (err.error || 'Erro desconhecido'));
        }
    } catch (error) {
        console.error('Erro ao excluir usuário:', error);
        alert('Erro de conexão ao excluir usuário');
    }
};

// Event Listeners for User Management
const btnNewUser = document.getElementById('btnNewUser');
if (btnNewUser) {
    btnNewUser.addEventListener('click', () => openUserModal());
}

const btnCancelUser = document.getElementById('btnCancelUser');
if (btnCancelUser) {
    btnCancelUser.addEventListener('click', closeUserModal);
}

const userForm = document.getElementById('userForm');
if (userForm) {
    userForm.addEventListener('submit', function(e) {
        e.preventDefault();
        saveUser();
    });
}

const btnCloseModal = document.querySelector('.close-modal');
if (btnCloseModal) {
    btnCloseModal.addEventListener('click', closeUserModal);
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

  const tabUsers = document.querySelector('[data-tab="users-view"]');
  if (tabUsers) tabUsers.textContent = t('tabUsers');
  
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
  
  // User Management
  const usersHeader = document.querySelector('#users-view h2 span');
  if (usersHeader) usersHeader.textContent = t('usersTitle');
  
  const btnNewUser = document.getElementById('btnNewUser');
  if (btnNewUser) btnNewUser.textContent = t('btnNewUser');
  
  const userThs = document.querySelectorAll('#usersTable thead th');
  if (userThs.length >= 4) {
      userThs[0].textContent = t('userTableUser');
      userThs[1].textContent = t('userTableRole');
      userThs[2].textContent = t('userTableOrigin');
      userThs[3].textContent = t('userTableActions');
  }

  // Dark Mode Button Title
  const dmToggle = document.getElementById('darkModeToggle');
  if (dmToggle) dmToggle.title = t('darkModeTitle');

  // Re-render questions list to update translations inside it
  renderQuestionsList();
  
  // Re-render users table if visible to update translations
  if (document.getElementById('users-view').style.display === 'block') {
      loadUsers();
  }
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

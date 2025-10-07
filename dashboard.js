let grafico = null;

async function carregarDados() {
  try {
    const [estatRes, avalRes] = await Promise.all([
      fetch("http://localhost:3003/estatisticas"),
      fetch("http://localhost:3003/avaliacoes")
    ]);

    const estatisticas = estatRes.ok
      ? await estatRes.json()
      : { excelente: 0, bom: 0, ruim: 0 };

    const avaliacoes = avalRes.ok ? await avalRes.json() : [];

    atualizarGrafico(estatisticas);
    renderizarAvaliacoes(avaliacoes);
  } catch (err) {
    console.error("Erro ao carregar dados:", err);
  }
}

function atualizarGrafico(est) {
  const ctx = document.getElementById("grafico").getContext("2d");

  const data = {
    labels: ["Excelente", "Bom", "Ruim"],
    datasets: [
      {
        label: "Quantidade de Avaliações",
        data: [est.excelente, est.bom, est.ruim],
        backgroundColor: ["#4CAF50", "#FFC107", "#F44336"]
      }
    ]
  };

  if (grafico) {
    grafico.data = data;
    grafico.update();
  } else {
    grafico = new Chart(ctx, {
      type: "bar",
      data,
      options: {
        responsive: true,
        plugins: {
          legend: { position: "bottom" }
        }
      }
    });
  }
}

function renderizarAvaliacoes(avaliacoes) {
  const lista = document.getElementById("lista-avaliacoes");
  lista.innerHTML = "";

  const tipoFiltro = document.getElementById("tipoFiltro")?.value || "";
  const dataFiltro = document.getElementById("dataFiltro")?.value || "";

  let filtradas = avaliacoes;

  if (tipoFiltro) {
    filtradas = filtradas.filter(a => a.avaliacao === tipoFiltro);
  }

  if (dataFiltro) {
    filtradas = filtradas.filter(a => a.data.startsWith(dataFiltro));
  }

  if (filtradas.length === 0) {
    lista.innerHTML = "<li>Nenhuma avaliação encontrada.</li>";
    return;
  }

  filtradas.forEach(a => {
    const item = document.createElement("li");
    item.classList.add(a.avaliacao);
    item.innerHTML = `
      <div>
        <strong style="text-transform:capitalize">${a.avaliacao}</strong>
        <span style="float:right; color:#777;">${new Date(a.data).toLocaleString()}</span>
      </div>
      ${a.sugestao ? `<div style="margin-top:5px;"><em>Sugestão:</em> ${a.sugestao}</div>` : ""}
    `;
    lista.appendChild(item);
  });
}

document.getElementById("btnFiltrar")?.addEventListener("click", carregarDados);
document.getElementById("btnLimpar")?.addEventListener("click", async () => {
  document.getElementById("tipoFiltro").value = "";
  document.getElementById("dataFiltro").value = "";
  carregarDados();
});

// Atualiza ao abrir e a cada 60 segundos
carregarDados();
setInterval(carregarDados, 60000);

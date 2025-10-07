let avaliacaoSelecionada = null

document.querySelectorAll(".options .btn").forEach(btn => {
  btn.addEventListener("click", () => {
    avaliacaoSelecionada = btn.dataset.value;

    document.querySelectorAll(".options .btn").forEach(b => b.classList.remove("ativo"));
    btn.classList.add("ativo");

    const sugestaoInput = document.getElementById("sugestao")
    sugestaoInput.placeholder = ""

    if (avaliacaoSelecionada === "ruim") {
      sugestaoInput.placeholder = "Por favor, nos diga o que podemos melhorar (obrigatório)"
      sugestaoInput.required = true
    } else if (avaliacaoSelecionada == "bom") {
      sugestaoInput.placeholder = "Nos conte como podemos melhorar (opcional)"
      sugestaoInput.required = false
    } else if (avaliacaoSelecionada === "excelente") {
      sugestaoInput.placeholder = "Quer deixar um elogio? (opcional)"
      sugestaoInput.required = false
    }
  });
});

document.getElementById("enviar").addEventListener("click", async () => {
  const sugestao = document.getElementById("sugestao").value;
  const mensagem = document.getElementById("mensagem"); // Corrigido: pegar o elemento

  if (!avaliacaoSelecionada) {
    mensagem.textContent = "Por favor, selecione uma opção!";
    mensagem.style.color = "red";
    mensagem.style.display = "block";
    return;
  }

  if (avaliacaoSelecionada === "ruim" && sugestao === "") {
    mensagem.textContent = "A sugestão é obrigatória quando a avaliação é 'ruim'."
    mensagem.style.color = "red"
    mensagem.style.display = "block"
    return
  }


  let sugestaoFinal = sugestao

  if (avaliacaoSelecionada === "excelente" && sugestao === "") {
    sugestaoFinal = "elogio"
  } else if (avaliacaoSelecionada === "bom" && sugestao === "") {
    sugestaoFinal = "melhoria sugerida"
  }

  const dados = {
    avaliacao: avaliacaoSelecionada,
    sugestao: sugestao
  };

  // Envia os dados para o backend
  try {
    const res = await fetch("http://localhost:3003/avaliacoes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dados)
    });
    const result = await res.json();

    mensagem.textContent = result.message || "Obrigado pela sua avaliação!";
    mensagem.style.color = "green";
    mensagem.style.display = "block";
  } catch (err) {
    mensagem.textContent = "Erro ao enviar avaliação!";
    mensagem.style.color = "red";
    mensagem.style.display = "block";
  }

  // Reset
  avaliacaoSelecionada = null;
  document.getElementById("sugestao").value = "";
  document.querySelectorAll(".options .btn").forEach(b => b.classList.remove("ativo"));

  setTimeout(() => mensagem.style.display = "none", 3000);
});

// Função para buscar estatísticas
async function buscarEstatisticas() {
  try {
    const estatRes = await fetch("http://localhost:3003/estatisticas");
    const estatisticas = await estatRes.json();
    console.log("Estatísticas:", estatisticas);
    // Aqui você pode atualizar o DOM com as estatísticas
  } catch (err) {
    console.error("Erro ao buscar estatísticas:", err);
  }
}

buscarEstatisticas();


// satisfacao.js — Tela inicial da pesquisa
let avaliacaoSelecionada = null;

document.addEventListener('DOMContentLoaded', () => {
  // Carregar idioma salvo e aplicar traduções
  loadSavedLanguage();
  updatePageTexts();
  
  // Captura o clique nas opções de avaliação (excelente, bom, ruim)
  document.querySelectorAll(".options .btn").forEach(btn => {
    btn.addEventListener("click", () => {
      avaliacaoSelecionada = btn.dataset.value;

      // Atualiza o estilo visual
      document.querySelectorAll(".options .btn").forEach(b => b.classList.remove("ativo"));
      btn.classList.add("ativo");
    });
  });

  // Quando clicar em “Responder Pesquisa”
  const enviarBtn = document.getElementById("enviar");
  if (enviarBtn) {
    enviarBtn.addEventListener("click", () => {
      if (!avaliacaoSelecionada) {
        alert(t('selectOption'));
        return;
      }

      // Salva a escolha para a próxima página
      localStorage.setItem("avaliacaoInicial", avaliacaoSelecionada);

      // Redireciona para o formulário completo
      window.location.href = "formulario-refeitorio.html";
    });
  }
});

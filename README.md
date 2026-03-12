# 📊 Sistema de Pesquisa de Satisfação - Família Madalosso

Bem-vindo à documentação oficial do **Sistema de Pesquisa de Satisfação**. Esta plataforma foi desenvolvida para coletar, gerenciar e analisar feedbacks de clientes de forma ágil, intuitiva e segura, integrando totens de autoatendimento, aplicativo móvel e um painel administrativo completo.

---

## 🚀 Visão Geral do Produto

O sistema é composto por três módulos principais integrados:

1.  **Totem de Autoatendimento (Web)**: Interface rápida para clientes registrarem sua satisfação no local.
2.  **Aplicativo Móvel (Android)**: Versão portátil para tablets e celulares, ideal para pesquisas volantes.
3.  **Painel Administrativo (Dashboard)**: Central de controle para gestores visualizarem dados e configurarem o sistema.

---

## ✨ Funcionalidades Principais

### 1. Coleta de Feedback (Totem e Mobile)
*   **Avaliação Rápida**: Interface simplificada com 3 níveis de satisfação (Excelente, Bom, Ruim).
*   **Pesquisa Detalhada**: Formulário completo para avaliar aspectos específicos (Qualidade, Variedade, Temperatura, Limpeza, Atendimento).
*   **Multilíngue**: Suporte instantâneo para **Português**, **Inglês** e **Espanhol**, atendendo turistas e clientes internacionais.
*   **Identidade Visual**: Design moderno e personalizado com a marca Família Madalosso.

### 2. Painel Administrativo (Gestão)
*   **Dashboards em Tempo Real**: Gráficos interativos que mostram a evolução da satisfação dia a dia.
*   **Indicadores de Desempenho (KPIs)**: Acompanhe médias de qualidade, limpeza e atendimento.
*   **Filtros Inteligentes**: Analise dados por data, período ou tipo de refeição (Almoço/Jantar).
*   **Relatórios**: Visualização clara dos comentários e sugestões dos clientes.

### 3. Configuração e Segurança
*   **Gestão de Usuários**: Controle quem acessa o sistema com perfis diferenciados (Administrador, Gestor, Usuário).
*   **Editor de Pesquisas**: Adicione ou remova perguntas do formulário dinamicamente, sem precisar de programação.
*   **Segurança de Dados**:
    *   Senhas criptografadas.
    *   Proteção contra acessos não autorizados.
    *   Sistema de login seguro.

---

## 🧑‍💻 Execução (Desenvolvimento)

Pré-requisitos:
* Node.js instalado
* Rede/host acessível entre front, backend e (se usado) mobile

Comandos (na raiz do projeto):
* Instalar dependências do backend: `npm run setup`
* Subir backend: `npm run start`
* Subir front (arquivos estáticos): `npm run start:front`
* Subir mobile (Expo): `npm run start:mobile`
* Subir tudo junto: `npm run dev`

Observações:
* O backend usa a porta **3003** por padrão.
* O front usa a porta **8000** por padrão.
* No web, as chamadas de API usam o mesmo host do site (e a porta 3003).
* O mobile (Expo) sobe o Metro na porta **8082** (script `start:mobile`).

Endereços úteis (com `npm run start:front`):
* Pesquisa (totem/web): `http://localhost:8000/formulario-refeitorio.html`
* Login do painel: `http://localhost:8000/login.html`
* Painel (após login): `http://localhost:8000/dashboard.html`
* API (backend): `http://localhost:3003`

Notas (Windows/Expo):
* O `start:mobile` usa um `EXPO_HOME` local (`.expo-home/`) e inicia com `--clear` para evitar problemas de permissão/caches no Windows.

Gestão de usuários:
* Usuários de ambiente (`origin=env`) não podem ser editados via interface.
* Para editar um `admin`, crie um usuário `admin` no banco via painel (origem `database`).

---

## 🔐 Produção (Exposto na internet)

Recomendado:
* Publicar com **HTTPS** (TLS) e um reverse proxy (Nginx/Traefik/Caddy) na frente.
* Expor apenas o proxy na internet (porta 443) e manter o Node em rede interna.
* Travar CORS para aceitar somente os domínios reais do front.

Variáveis de ambiente importantes (backend):
* `NODE_ENV=production`
* `TRUST_PROXY=true` (quando houver reverse proxy)
* `ALLOWED_ORIGINS=https://seu-dominio.com,https://painel.seu-dominio.com`
* `BODY_LIMIT=1mb` (opcional)
* Rate limit: `RATE_LIMIT_WINDOW_MS` e `RATE_LIMIT_MAX_REQUESTS` (opcional)

Mobile (produção):
* Definir `EXPO_PUBLIC_API_URL=https://api.seu-dominio.com` para o app apontar para o backend via HTTPS.

---

## 📱 Guia de Instalação (Aplicativo Android)

Para instalar o aplicativo nos tablets ou celulares da equipe:

1.  Solicite o arquivo instalador **APK** à equipe de TI.
2.  No dispositivo Android, autorize a instalação de "Fontes Desconhecidas" (se necessário).
3.  Abra o arquivo e siga as instruções na tela.
4.  Ao abrir o app, conecte-se à rede Wi-Fi interna para sincronizar os dados.

---

## 💻 Acesso ao Painel Administrativo

O painel pode ser acessado conforme o ambiente de publicação (rede interna ou internet):

1.  **Endereço**: Acesse via navegador (Chrome/Edge) no endereço fornecido pela TI.
2.  **Login**: Utilize suas credenciais de acesso.
    *   *Administrador*: Acesso total a configurações e usuários.
    *   *Gestor*: Acesso a relatórios e configuração de formulários.
    *   *Usuário*: Visualização de dashboards.

---

## 📞 Suporte

Em caso de dúvidas, problemas técnicos ou necessidade de novos usuários, entre em contato com o administrador do sistema.

---
*Desenvolvido para Família Madalosso - Excelência em servir.*

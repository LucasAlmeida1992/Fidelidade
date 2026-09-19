// ==========================================
// CONFIGURAÇÕES DA API / URL DO GOOGLE APPS SCRIPT
// ==========================================
const URL_API = "COLOQUE_SUA_URL_DO_GOOGLE_APPS_SCRIPT_AQUI"; 
const LIMITE_CARIMBOS = 2; // Limite para o desconto é 2

// Ícones em SVG configurados para adotar a cor (currentColor) e tamanho ideal (32px)
const SVG_CHECK = `<svg xmlns="http://www.w3.org/2000/svg" height="32px" viewBox="0 -960 960 960" width="32px" fill="currentColor"><path d="m424-312 282-282-56-56-226 226-114-114-56 56 170 170ZM200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h560q33 0 56.5 23.5T840-760v560q0 33-23.5 56.5T760-120H200Z"/></svg>`;
const SVG_CIRCLE = `<svg xmlns="http://www.w3.org/2000/svg" height="32px" viewBox="0 -960 960 960" width="32px" fill="currentColor"><path d="M480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z"/></svg>`;

// ==========================================
// CAPTURA DOS ELEMENTOS DO HTML
// ==========================================
const inputTelefone = document.getElementById("cli-phone");
const inputNome = document.getElementById("cli-name");
const btnAcessar = document.getElementById("btn-acessar");
const btnAdicionarCarimbo = document.getElementById("btn-adicionar-carimbo");
const btnSair = document.getElementById("btn-sair");
const dispNome = document.getElementById("disp-nome");
const dispDesconto = document.getElementById("disp-desconto");

// Telas
const secLogin = document.getElementById("sec-login");
const secCartao = document.getElementById("sec-cartao");
const secAdmin = document.getElementById("sec-admin");

// Botões Admin
const btnAdminToggle = document.getElementById("btn-admin-toggle");
const btnFecharAdmin = document.getElementById("btn-fechar-admin");

// Estado atual da sessão
let clienteAtual = null;

// ==========================================
// EVENT LISTENERS (CLIQUE DOS BOTÕES)
// ==========================================
if (btnAcessar) btnAcessar.addEventListener("click", consultarCliente);
if (btnAdicionarCarimbo) btnAdicionarCarimbo.addEventListener("click", solicitarAdicionarCarimbo);
if (btnSair) btnSair.addEventListener("click", fazerLogout);

// Abrir e fechar Painel Admin
if (btnAdminToggle) btnAdminToggle.addEventListener("click", () => secAdmin.classList.toggle("hidden"));
if (btnFecharAdmin) btnFecharAdmin.addEventListener("click", () => secAdmin.classList.add("hidden"));

// ==========================================
// CONSULTAR CLIENTE (LOGIN)
// ==========================================
function consultarCliente() {
    const telefone = inputTelefone.value.trim();
    const nomeDigitado = inputNome.value.trim();

    if (!telefone) {
        alert("Por favor, digite o seu número de WhatsApp.");
        return;
    }

    btnAcessar.innerText = "Buscando...";
    btnAcessar.disabled = true;

    fetch(`${URL_API}?acao=consultar&telefone=${encodeURIComponent(telefone)}`)
        .then(response => response.json())
        .then(data => {
            btnAcessar.innerText = "Ver Meu Cartão";
            btnAcessar.disabled = false;

            if (data.erro) {
                alert(data.erro);
                return;
            }

            clienteAtual = data;
            
            if (!clienteAtual.nome && nomeDigitado) {
                clienteAtual.nome = nomeDigitado;
            }

            exibirPainelCliente(true);
            atualizarInterfaceCartao(clienteAtual.nome, clienteAtual.carimbos);
        })
        .catch(error => {
            console.error("Erro na consulta:", error);
            btnAcessar.innerText = "Ver Meu Cartão";
            btnAcessar.disabled = false;
            alert("Erro ao conectar com o servidor. Verifique o link do Apps Script.");
        });
}

// ==========================================
// ADICIONAR CARIMBO OU REINICIAR (COM SENHA)
// ==========================================
function solicitarAdicionarCarimbo() {
    if (!clienteAtual) {
        alert("Consulte um cliente primeiro.");
        return;
    }

    const senha = prompt("Digite a senha do Tatuador para autorizar:");
    if (!senha) return; // Cancelado pelo usuário

    btnAdicionarCarimbo.innerText = "Processando...";
    btnAdicionarCarimbo.disabled = true;

    const dadosEnvio = {
        acao: "adicionar",
        telefone: clienteAtual.telefone,
        senha: senha
    };

    fetch(URL_API, {
        method: "POST",
        body: JSON.stringify(dadosEnvio),
        headers: {
            "Content-Type": "text/plain;charset=utf-8"
        }
    })
    .then(response => response.json())
    .then(data => {
        btnAdicionarCarimbo.disabled = false;

        if (data.erro) {
            alert("Erro: " + data.erro);
            atualizarInterfaceCartao(clienteAtual.nome, clienteAtual.carimbos);
            return;
        }

        clienteAtual.carimbos = data.carimbos;
        
        if (data.cicloResetado) {
            alert("🎉 Desconto resgatado com sucesso! O cartão foi reiniciado para a próxima tattoo.");
        } else {
            alert("Carimbo adicionado com sucesso!");
        }

        atualizarInterfaceCartao(clienteAtual.nome, clienteAtual.carimbos);
    })
    .catch(error => {
        console.error("Erro ao adicionar carimbo:", error);
        btnAdicionarCarimbo.disabled = false;
        atualizarInterfaceCartao(clienteAtual.nome, clienteAtual.carimbos);
        alert("Erro ao processar a requisição.");
    });
}

// ==========================================
// ATUALIZAR CARTÃO NA TELA
// ==========================================
function atualizarInterfaceCartao(nome, carimbos) {
    carimbos = Number(carimbos) || 0;

    if (dispNome) dispNome.innerText = nome || "Cliente";

    if (dispDesconto) {
        if (carimbos <= 0) {
            dispDesconto.innerText = "Faça sua 1ª tattoo para iniciar!";
        } else if (carimbos === 1) {
            dispDesconto.innerText = "Falta 1 tattoo para 10% OFF!";
        } else {
            dispDesconto.innerText = "🎉 10% OFF LIBERADO NA PRÓXIMA!";
        }
    }

    // Passamos as constantes SVG agora, em vez dos emojis!
    atualizarSlot("slot-1", carimbos >= 1, SVG_CHECK, SVG_CIRCLE);
    atualizarSlot("slot-2", carimbos >= 2, SVG_CHECK, SVG_CIRCLE);
    
    // O terceiro slot recebe texto/emoji nativo normalmente (O innerHTML suporta ambos)
    atualizarSlot("slot-3", carimbos >= 2, "🏆", "🎁");

    if (btnAdicionarCarimbo) {
        if (carimbos >= LIMITE_CARIMBOS) {
            btnAdicionarCarimbo.innerText = "Reiniciar Cartão";
        } else {
            btnAdicionarCarimbo.innerText = "Adicionar Carimbo";
        }
    }
}

// ==========================================
// ATUALIZAR APENAS O EMOJI/SVG DOS SLOTS
// ==========================================
function atualizarSlot(idElemento, ativo, iconeAtivo, iconeInativo) {
    const slot = document.getElementById(idElemento);
    if (!slot) return;

    slot.className = ativo ? "stamp-slot active" : "stamp-slot";
    
    const numSlot = idElemento.split("-")[1];
    const emojiSpan = document.getElementById("emoji-" + numSlot);
    
    if (emojiSpan) {
        // innerHTML: Permite injetar tags como <svg> no HTML diretamente.
        emojiSpan.innerHTML = ativo ? iconeAtivo : iconeInativo;
    }
}

// ==========================================
// CONTROLES DE VISIBILIDADE (LOGIN / CARTÃO)
// ==========================================
function exibirPainelCliente(mostrar) {
    if (mostrar) {
        if (secLogin) secLogin.classList.add("hidden");
        if (secCartao) secCartao.classList.remove("hidden");
    } else {
        if (secLogin) secLogin.classList.remove("hidden");
        if (secCartao) secCartao.classList.add("hidden");
    }
}

function fazerLogout() {
    clienteAtual = null;
    exibirPainelCliente(false);
    if (inputTelefone) inputTelefone.value = "";
    if (inputNome) inputNome.value = "";
}
// ==========================================
// CONFIGURAÇÃO DA API (GOOGLE APPS SCRIPT)
// CARTÃO FIDELIDADE - LUCAS FRANCA TATTOO
// ==========================================

// Substitua pela URL do seu Web App implantado no Google Sheets
const API_URL = "COLOQUE_SUA_URL_DO_APPS_SCRIPT_AQUI";

// SVGs Configuráveis (Herdam a cor e tamanho do CSS)
const SVG_CHECK = `<svg xmlns="http://www.w3.org/2000/svg" height="32px" viewBox="0 -960 960 960" width="32px" fill="currentColor"><path d="m424-312 282-282-56-56-226 226-114-114-56 56 170 170ZM200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h560q33 0 56.5 23.5T840-760v560q0 33-23.5 56.5T760-120H200Z"/></svg>`;
const SVG_CIRCLE = `<svg xmlns="http://www.w3.org/2000/svg" height="32px" viewBox="0 -960 960 960" width="32px" fill="currentColor"><path d="M480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z"/></svg>`;

// Variáveis Globais
let clienteAtual = null;
let pinAdminAtual = null;
let todosClientes = [];

// ==========================================
// INICIALIZAÇÃO - CARREGA APÓS O HTML ESTAR PRONTO
// ==========================================
window.addEventListener("DOMContentLoaded", () => {

    // Inputs (Garantindo compatibilidade com os nomes dos seus IDs)
    const inputPhone = document.getElementById("cli-phone") || document.getElementById("input-whatsapp");
    const inputName = document.getElementById("cli-name") || document.getElementById("input-nome");

    // Recupera cliente salvo no navegador
    const localPhone = localStorage.getItem("fidelidade_whatsapp");
    const localName = localStorage.getItem("fidelidade_nome");

    if (localPhone) {
        if (inputPhone) inputPhone.value = localPhone;
        if (inputName) inputName.value = localName || "";
        carregarDadosCliente(localPhone, localName || "");
    }

    // Atrelar Botões aos Eventos
    const btnAcessar = document.getElementById("btn-acessar") || document.getElementById("btn-entrar");
    if (btnAcessar) btnAcessar.addEventListener("click", acessarCartao);

    const btnCarimbo = document.getElementById("btn-adicionar-carimbo");
    if (btnCarimbo) btnCarimbo.addEventListener("click", adicionarCarimboComSenha);

    const btnSair = document.getElementById("btn-sair");
    if (btnSair) btnSair.addEventListener("click", sair);

    const btnAdmin = document.getElementById("btn-admin-toggle");
    if (btnAdmin) btnAdmin.addEventListener("click", promptAdmin);

    const btnFecharAdmin = document.getElementById("btn-fechar-admin");
    if (btnFecharAdmin) btnFecharAdmin.addEventListener("click", fecharAdmin);

    const adminSearch = document.getElementById("admin-search");
    if (adminSearch) adminSearch.addEventListener("input", filtrarClientes);
});

// ==========================================
// ACESSAR CARTÃO (LOGIN)
// ==========================================
async function acessarCartao(event) {
    if (event) event.preventDefault();

    const inputPhone = document.getElementById("cli-phone") || document.getElementById("input-whatsapp");
    const inputName = document.getElementById("cli-name") || document.getElementById("input-nome");

    const phone = inputPhone ? inputPhone.value.replace(/\D/g, "") : "";
    const name = inputName ? inputName.value.trim() : "";

    if (!phone) {
        alert("Digite o número do seu WhatsApp.");
        return;
    }

    // Salva no navegador
    localStorage.setItem("fidelidade_whatsapp", phone);
    localStorage.setItem("fidelidade_nome", name);

    await carregarDadosCliente(phone, name);
}

// ==========================================
// BUSCAR DADOS DO CLIENTE NA API
// ==========================================
async function carregarDadosCliente(phone, name = "") {
    const btnAcessar = document.getElementById("btn-acessar") || document.getElementById("btn-entrar");

    try {
        if (btnAcessar) {
            btnAcessar.disabled = true;
            btnAcessar.innerText = "Acessando...";
        }

        const url = `${API_URL}?action=get_client&whatsapp=${encodeURIComponent(phone)}&nome=${encodeURIComponent(name)}`;
        const response = await fetch(url);

        if (!response.ok) throw new Error("HTTP " + response.status);

        const data = await response.json();

        if (data.success === false) {
            alert(data.error || "Erro ao consultar cliente.");
            return;
        }

        // Popula os dados do cliente
        clienteAtual = {
            whatsapp: data.whatsapp || phone,
            nome: data.nome || name || "Cliente",
            carimbos: Number(data.carimbos) || 0
        };

        atualizarInterfaceCartao(clienteAtual.nome, clienteAtual.carimbos);
        alternarSecao("cartao");

    } catch (error) {
        console.error("Erro ao carregar cliente:", error);
        alert("Erro ao conectar com a planilha. Verifique a URL da API.");
    } finally {
        if (btnAcessar) {
            btnAcessar.disabled = false;
            btnAcessar.innerText = "Acessar Cartão";
        }
    }
}

// ==========================================
// ATUALIZAR INTERFACE DO CARTÃO
// ==========================================
function atualizarInterfaceCartao(nome, carimbos) {
    carimbos = Number(carimbos) || 0;

    const dispNome = document.getElementById("disp-nome") || document.getElementById("cli-nome");
    const dispDesconto = document.getElementById("disp-desconto") || document.getElementById("dispDesconto");

    if (dispNome) dispNome.innerText = nome || "Cliente";

    if (dispDesconto) {
        if (carimbos <= 0) {
            dispDesconto.innerText = "Faça sua 1ª tattoo para iniciar o cartão!";
        } else if (carimbos === 1) {
            dispDesconto.innerText = "Falta 1 tattoo para liberar 10% OFF na próxima!";
        } else {
            dispDesconto.innerText = "🎉 10% DE DESCONTO LIBERADO PARA A PRÓXIMA TATTOO!";
        }
    }

    // Injeta os SVGs usando a função abaixo (com innerHTML para rodar a imagem perfeitamente)
    atualizarSlot("slot-1", carimbos >= 1, SVG_CHECK, SVG_CIRCLE);
    atualizarSlot("slot-2", carimbos >= 2, SVG_CHECK, SVG_CIRCLE);
    
    // O 3º slot continua com os Emojis nativos do Windows/Apple
    atualizarSlot("slot-3", carimbos >= 2, "🏆", "🎁");
}

function atualizarSlot(id, ativo, iconeAtivo, iconeInativo) {
    const slot = document.getElementById(id);
    if (!slot) return;

    slot.className = ativo ? "stamp-slot active" : "stamp-slot";

    // Procura pela tag que segura o ícone (funciona se você usou class="icon" ou class="emoji-icon")
    const iconSpan = slot.querySelector(".icon") || slot.querySelector(".emoji-icon");
    if (iconSpan) {
        iconSpan.innerHTML = ativo ? iconeAtivo : iconeInativo;
    }
}

// ==========================================
// ADICIONAR CARIMBO (CLIENTE SOLICITA / TATUADOR LIBERA)
// ==========================================
async function adicionarCarimboComSenha() {
    if (!clienteAtual) {
        alert("Nenhum cliente está carregado.");
        return;
    }

    const pin = prompt("Digite a Senha do Tatuador:");
    if (!pin) return;

    const btnCarimbo = document.getElementById("btn-adicionar-carimbo");

    try {
        if (btnCarimbo) {
            btnCarimbo.disabled = true;
            btnCarimbo.innerText = "Processando...";
        }

        const url = `${API_URL}?action=add_stamp&whatsapp=${encodeURIComponent(clienteAtual.whatsapp)}&nome=${encodeURIComponent(clienteAtual.nome || "")}&pin=${encodeURIComponent(pin)}`;
        const response = await fetch(url);
        
        if (!response.ok) throw new Error("HTTP " + response.status);

        const data = await response.json();

        if (!data.success) {
            alert(data.error || "Senha incorreta!");
            return;
        }

        // Lógica de reset ou apenas avisar do sucesso
        if (data.cicloResetado) {
            alert("🎉 Desconto resgatado!\n\nO cartão foi reiniciado para o próximo ciclo.");
        } else if (data.descontoLiberado) {
            alert("🎉 Carimbo atualizado!\n\nVocê liberou os 10% de desconto para a próxima Tattoo!");
        } else {
            alert("✅ Carimbo adicionado com sucesso!");
        }

        clienteAtual.carimbos = data.carimbos;
        atualizarInterfaceCartao(clienteAtual.nome, clienteAtual.carimbos);

    } catch (error) {
        console.error("Erro ao registrar carimbo:", error);
        alert("Erro ao registrar carimbo.");
    } finally {
        if (btnCarimbo) {
            btnCarimbo.disabled = false;
            btnCarimbo.innerText = "Adicionar Carimbo";
        }
    }
}

// ==========================================
// PAINEL ADMIN - LOGIN
// ==========================================
async function promptAdmin() {
    const pin = prompt("Digite a senha de Administrador:");
    if (!pin) return;

    try {
        const url = `${API_URL}?action=get_all&pin=${encodeURIComponent(pin)}`;
        const response = await fetch(url);
        
        if (!response.ok) throw new Error("HTTP " + response.status);

        const data = await response.json();

        if (!data.success) {
            alert(data.error || "Senha incorreta!");
            return;
        }

        pinAdminAtual = pin;
        todosClientes = Array.isArray(data.clients) ? data.clients : [];
        
        renderizarClientesAdmin(todosClientes);
        
        const secAdmin = document.getElementById("sec-admin");
        if (secAdmin) secAdmin.classList.remove("hidden");

    } catch (error) {
        console.error("Erro painel admin:", error);
        alert("Erro ao buscar dados do painel admin.");
    }
}

// ==========================================
// PAINEL ADMIN - RENDERIZAR LISTA
// ==========================================
function renderizarClientesAdmin(lista) {
    const container = document.getElementById("lista-clientes-admin") || document.getElementById("admin-client-list");
    if (!container) return;

    container.innerHTML = "";

    if (!Array.isArray(lista) || lista.length === 0) {
        container.innerHTML = '<p style="color:#aaa; font-size:14px; text-align:center;">Nenhum cliente cadastrado.</p>';
        return;
    }

    lista.forEach((cliente) => {
        const item = document.createElement("div");
        item.className = "client-item";

        const nome = cliente.nome || "Cliente";
        const whatsapp = String(cliente.whatsapp || "");
        const carimbos = Number(cliente.carimbos) || 0;

        item.innerHTML = `
            <div class="client-info">
                <strong>${escapeHTML(nome)}</strong>
                <span>${escapeHTML(whatsapp)} | ${carimbos}/2 carimbos</span>
            </div>
            <div>
                <button type="button" class="btn-sm btn-add-admin">+ Carimbo</button>
            </div>
        `;

        const botao = item.querySelector(".btn-add-admin");
        if (botao) {
            botao.addEventListener("click", () => {
                carimboDiretoAdmin(whatsapp, nome);
            });
        }

        container.appendChild(item);
    });
}

// ==========================================
// PAINEL ADMIN - CARIMBO DIRETO
// ==========================================
async function carimboDiretoAdmin(whatsapp, nome) {
    let pin = pinAdminAtual;
    if (!pin) {
        pin = prompt("Confirme a senha Admin:");
        if (!pin) return;
    }

    try {
        const url = `${API_URL}?action=add_stamp&whatsapp=${encodeURIComponent(whatsapp)}&nome=${encodeURIComponent(nome)}&pin=${encodeURIComponent(pin)}`;
        const response = await fetch(url);
        
        if (!response.ok) throw new Error("HTTP " + response.status);

        const data = await response.json();

        if (!data.success) {
            alert(data.error || "Senha incorreta!");
            return;
        }

        if (data.cicloResetado) {
            alert("🎉 Desconto resgatado!\n\nO ciclo do cliente foi reiniciado.");
        } else if (data.descontoLiberado) {
            alert("🎉 Carimbo atualizado!\n\n10% de desconto liberado para o cliente.");
        } else {
            alert(`✅ Carimbo adicionado para ${nome}!`);
        }

        await atualizarPainelAdmin();

    } catch (error) {
        console.error("Erro carimbo admin:", error);
        alert("Erro ao registrar carimbo.");
    }
}

async function atualizarPainelAdmin() {
    if (!pinAdminAtual) return;

    try {
        const url = `${API_URL}?action=get_all&pin=${encodeURIComponent(pinAdminAtual)}`;
        const response = await fetch(url);
        
        if (!response.ok) throw new Error("HTTP " + response.status);

        const data = await response.json();
        if (data.success) {
            todosClientes = Array.isArray(data.clients) ? data.clients : [];
            const adminSearch = document.getElementById("admin-search");
            
            if (adminSearch && adminSearch.value.trim() !== "") {
                filtrarClientes();
            } else {
                renderizarClientesAdmin(todosClientes);
            }
        }
    } catch (error) {
        console.error("Erro atualizando admin:", error);
    }
}

// ==========================================
// UTILITÁRIOS
// ==========================================
function filtrarClientes() {
    const adminSearch = document.getElementById("admin-search");
    if (!adminSearch) return;

    const termo = adminSearch.value.toLowerCase().trim();
    const filtrados = todosClientes.filter((cliente) => {
        const nome = String(cliente.nome || "").toLowerCase();
        const whatsapp = String(cliente.whatsapp || "");
        return nome.includes(termo) || whatsapp.includes(termo);
    });

    renderizarClientesAdmin(filtrados);
}

function fecharAdmin() {
    const secAdmin = document.getElementById("sec-admin");
    if (secAdmin) secAdmin.classList.add("hidden");
}

function sair() {
    localStorage.removeItem("fidelidade_whatsapp");
    localStorage.removeItem("fidelidade_nome");
    clienteAtual = null;

    alternarSecao("login");

    const inputPhone = document.getElementById("cli-phone") || document.getElementById("input-whatsapp");
    const inputName = document.getElementById("cli-name") || document.getElementById("input-nome");

    if (inputPhone) inputPhone.value = "";
    if (inputName) inputName.value = "";
}

function alternarSecao(secao) {
    const secLogin = document.getElementById("sec-login");
    const secCartao = document.getElementById("sec-cartao");

    if (secao === "login") {
        if (secLogin) secLogin.classList.remove("hidden");
        if (secCartao) secCartao.classList.add("hidden");
    } else if (secao === "cartao") {
        if (secLogin) secLogin.classList.add("hidden");
        if (secCartao) secCartao.classList.remove("hidden");
    }
}

function escapeHTML(value) {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
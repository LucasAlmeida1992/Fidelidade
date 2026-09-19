// ==========================================
// CARTÃO FIDELIDADE - LUCAS FRANCA TATTOO
// SCRIPT.JS
// ==========================================

// ==========================================
// URL DA API - GOOGLE APPS SCRIPT
// ==========================================

const API_URL = "https://script.google.com/macros/s/AKfycbz-ohIZL5xvFQvPSgtvJw8Js2S71lCW00kFGcmj3TcymFucYbonbNrNRx_Fn7vpdDYF/exec";

// ==========================================
// CONFIGURAÇÕES
// ==========================================

const LIMITE_CARIMBOS = 2;

// ==========================================
// VARIÁVEIS
// ==========================================

let clienteAtual = null;
let todosClientes = [];
let pinAdminAtual = null;

// ==========================================
// ELEMENTOS DO HTML
// ==========================================

const secLogin = document.getElementById("sec-login");
const secCartao = document.getElementById("sec-cartao");
const secAdmin = document.getElementById("sec-admin");
const inputPhone = document.getElementById("cli-phone");
const inputName = document.getElementById("cli-name");
const dispNome = document.getElementById("disp-nome");
const dispDesconto = document.getElementById("disp-desconto");

// ==========================================
// INICIALIZAÇÃO
// ==========================================

window.addEventListener("DOMContentLoaded", () => {

    // Recupera cliente salvo
    const localPhone = localStorage.getItem("fidelidade_whatsapp");
    const localName = localStorage.getItem("fidelidade_nome");

    if (localPhone) {
        if (inputPhone) {
            inputPhone.value = localPhone;
        }

        if (inputName) {
            inputName.value = localName || "";
        }

        carregarDadosCliente(localPhone, localName || "");
    }

    // Botão acessar cartão
    const btnAcessar = document.getElementById("btn-acessar");
    if (btnAcessar) {
        btnAcessar.addEventListener("click", acessarCartao);
    }

    // Botão adicionar carimbo
    const btnCarimbo = document.getElementById("btn-adicionar-carimbo");
    if (btnCarimbo) {
        btnCarimbo.addEventListener("click", adicionarCarimboComSenha);
    }

    // Botão sair
    const btnSair = document.getElementById("btn-sair");
    if (btnSair) {
        btnSair.addEventListener("click", sair);
    }

    // Botão painel admin
    const btnAdmin = document.getElementById("btn-admin-toggle");
    if (btnAdmin) {
        btnAdmin.addEventListener("click", promptAdmin);
    }

    // Fechar painel admin
    const btnFecharAdmin = document.getElementById("btn-fechar-admin");
    if (btnFecharAdmin) {
        btnFecharAdmin.addEventListener("click", fecharAdmin);
    }

    // Campo de busca
    const adminSearch = document.getElementById("admin-search");
    if (adminSearch) {
        adminSearch.addEventListener("input", filtrarClientes);
    }
});

// ==========================================
// CLIENTE - ACESSAR CARTÃO
// ==========================================

async function acessarCartao() {
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
// CLIENTE - CARREGAR DADOS
// ==========================================

async function carregarDadosCliente(phone, name = "") {
    try {
        const url = API_URL + 
            "?action=get_client" + 
            "&whatsapp=" + encodeURIComponent(phone) + 
            "&nome=" + encodeURIComponent(name);

        console.log("Consultando API:", url);

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error("HTTP " + response.status);
        }

        const data = await response.json();
        console.log("Resposta cliente:", data);

        if (data.success === false) {
            alert(data.error || "Erro ao consultar cliente.");
            return;
        }

        // Mostra cartão
        if (secLogin) {
            secLogin.classList.add("hidden");
        }

        if (secCartao) {
            secCartao.classList.remove("hidden");
        }

        // Cliente encontrado
        if (data.found) {
            clienteAtual = {
                whatsapp: data.whatsapp || phone,
                nome: data.nome || name || "Cliente",
                carimbos: Number(data.carimbos) || 0,
                ultimaVisita: data.ultimaVisita || ""
            };

            atualizarInterfaceCartao(clienteAtual.nome, clienteAtual.carimbos);
        } else {
            // Cliente novo
            const clienteNome = name || localStorage.getItem("fidelidade_nome") || "Cliente";

            clienteAtual = {
                whatsapp: phone,
                nome: clienteNome,
                carimbos: 0
            };

            atualizarInterfaceCartao(clienteNome, 0);
        }

    } catch (error) {
        console.error("Erro ao carregar cliente:", error);
        alert("Erro ao conectar ao servidor do Cartão Fidelidade.");
    }
}

// ==========================================
// ATUALIZAR CARTÃO NA TELA
// ==========================================

function atualizarInterfaceCartao(nome, carimbos) {
    carimbos = Number(carimbos) || 0;

    // Nome
    if (dispNome) {
        dispNome.innerText = nome || "Cliente";
    }

    // Mensagem de desconto
    if (dispDesconto) {
        if (carimbos <= 0) {
            dispDesconto.innerText = "Faça sua 1ª tattoo para iniciar o cartão!";
        } else if (carimbos === 1) {
            dispDesconto.innerText = "Falta 1 tattoo para liberar 10% OFF na próxima!";
        } else {
            dispDesconto.innerText = "🎉 10% DE DESCONTO LIBERADO PARA A PRÓXIMA TATTOO!";
        }
    }

    // SLOTS
    atualizarSlot("slot-1", carimbos >= 1, "✅", "⭕");
    atualizarSlot("slot-2", carimbos >= 2, "✅", "⭕");
    atualizarSlot("slot-3", carimbos >= 2, "🏆", "🎁");
}

// ==========================================
// ATUALIZAR SLOT
// ==========================================

function atualizarSlot(id, ativo, iconeAtivo, iconeInativo) {
    const slot = document.getElementById(id);
    if (!slot) return;

    slot.className = ativo ? "stamp-slot active" : "stamp-slot";

    const icon = slot.querySelector(".icon");
    if (icon) {
        icon.innerText = ativo ? iconeAtivo : iconeInativo;
    }
}

// ==========================================
// ADICIONAR CARIMBO
// ==========================================

async function adicionarCarimboComSenha() {
    if (!clienteAtual) {
        alert("Nenhum cliente está carregado.");
        return;
    }

    const pin = prompt("Digite a Senha do Tatuador:");
    if (!pin) return;

    try {
        const url = API_URL + 
            "?action=add_stamp" + 
            "&whatsapp=" + encodeURIComponent(clienteAtual.whatsapp) + 
            "&nome=" + encodeURIComponent(clienteAtual.nome || "") + 
            "&pin=" + encodeURIComponent(pin);

        console.log("Adicionando carimbo:", url);

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error("HTTP " + response.status);
        }

        const data = await response.json();
        console.log("Resposta carimbo:", data);

        if (!data.success) {
            alert(data.error || "Senha incorreta!");
            return;
        }

        if (data.cicloResetado) {
            alert("🎉 Desconto resgatado com sucesso!\n\nO ciclo do cartão foi reiniciado.");
        } else if (data.descontoLiberado) {
            alert("🎉 Carimbo adicionado!\n\n10% de desconto liberado para a próxima tattoo.");
        } else {
            alert("✅ Carimbo adicionado com sucesso!");
        }

        await carregarDadosCliente(clienteAtual.whatsapp, clienteAtual.nome);

    } catch (error) {
        console.error("Erro ao adicionar carimbo:", error);
        alert("Erro ao registrar carimbo.");
    }
}

// ==========================================
// PAINEL ADMIN - LOGIN
// ==========================================

async function promptAdmin() {
    const pin = prompt("Digite a senha de Administrador:");
    if (!pin) return;

    try {
        const url = API_URL + 
            "?action=get_all" + 
            "&pin=" + encodeURIComponent(pin);

        console.log("Consultando painel admin:", url);

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error("HTTP " + response.status);
        }

        const data = await response.json();
        console.log("Resposta admin:", data);

        if (!data.success) {
            alert(data.error || "Senha incorreta!");
            return;
        }

        todosClientes = Array.isArray(data.clients) ? data.clients : [];
        pinAdminAtual = pin;

        renderizarClientesAdmin(todosClientes);

        if (secAdmin) {
            secAdmin.classList.remove("hidden");
        }

    } catch (error) {
        console.error("Erro painel admin:", error);
        alert("Erro ao buscar dados do painel admin.");
    }
}

// ==========================================
// RENDERIZAR CLIENTES NO ADMIN
// ==========================================

function renderizarClientesAdmin(lista) {
    const container = document.getElementById("lista-clientes-admin");

    if (!container) {
        console.error("Elemento lista-clientes-admin não encontrado.");
        return;
    }

    container.innerHTML = "";

    if (!Array.isArray(lista) || lista.length === 0) {
        container.innerHTML = '<p style="color:#aaa; font-size:12px; text-align:center;">Nenhum cliente cadastrado.</p>';
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
// FILTRAR CLIENTES
// ==========================================

function filtrarClientes() {
    const campo = document.getElementById("admin-search");
    const termo = campo ? campo.value.toLowerCase().trim() : "";

    const filtrados = todosClientes.filter((cliente) => {
        const nome = String(cliente.nome || "").toLowerCase();
        const whatsapp = String(cliente.whatsapp || "");

        return nome.includes(termo) || whatsapp.includes(termo);
    });

    renderizarClientesAdmin(filtrados);
}

// ==========================================
// CARIMBO PELO ADMIN
// ==========================================

async function carimboDiretoAdmin(whatsapp, nome) {
    let pin = pinAdminAtual;

    if (!pin) {
        pin = prompt("Confirme a senha Admin:");
        if (!pin) return;
    }

    try {
        const url = API_URL + 
            "?action=add_stamp" + 
            "&whatsapp=" + encodeURIComponent(whatsapp) + 
            "&nome=" + encodeURIComponent(nome || "") + 
            "&pin=" + encodeURIComponent(pin);

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error("HTTP " + response.status);
        }

        const data = await response.json();
        console.log("Resposta carimbo admin:", data);

        if (!data.success) {
            alert(data.error || "Senha incorreta!");
            return;
        }

        if (data.cicloResetado) {
            alert("🎉 Desconto resgatado!\n\nO ciclo do cliente foi reiniciado.");
        } else if (data.descontoLiberado) {
            alert("🎉 Carimbo atualizado!\n\n10% de desconto liberado.");
        } else {
            alert("✅ Carimbo atualizado!");
        }

        await atualizarPainelAdmin();

    } catch (error) {
        console.error("Erro carimbo admin:", error);
        alert("Erro ao registrar carimbo.");
    }
}

// ==========================================
// ATUALIZAR PAINEL ADMIN
// ==========================================

async function atualizarPainelAdmin() {
    if (!pinAdminAtual) {
        return;
    }

    try {
        const url = API_URL + 
            "?action=get_all" + 
            "&pin=" + encodeURIComponent(pinAdminAtual);

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error("HTTP " + response.status);
        }

        const data = await response.json();

        if (!data.success) {
            alert(data.error || "Não foi possível atualizar o painel.");
            return;
        }

        todosClientes = Array.isArray(data.clients) ? data.clients : [];
        renderizarClientesAdmin(todosClientes);

    } catch (error) {
        console.error("Erro atualizando admin:", error);
    }
}

// ==========================================
// FECHAR PAINEL ADMIN
// ==========================================

function fecharAdmin() {
    if (secAdmin) {
        secAdmin.classList.add("hidden");
    }
}

// ==========================================
// SAIR
// ==========================================

function sair() {
    localStorage.removeItem("fidelidade_whatsapp");
    localStorage.removeItem("fidelidade_nome");

    clienteAtual = null;

    if (secCartao) {
        secCartao.classList.add("hidden");
    }

    if (secLogin) {
        secLogin.classList.remove("hidden");
    }

    if (inputPhone) {
        inputPhone.value = "";
    }

    if (inputName) {
        inputName.value = "";
    }
}

// ==========================================
// ESCAPAR HTML
// ==========================================

function escapeHTML(value) {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

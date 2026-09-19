// ==========================================
// CONFIGURAÇÃO DA API (GOOGLE APPS SCRIPT)
// ==========================================
// Substitua pela URL do seu Web App implantado no Google Sheets
const API_URL = "COLOQUE_SUA_URL_DO_APPS_SCRIPT_AQUI";

// Variáveis de controle da sessão atual
let clienteAtual = null;
let pinAdminAtual = null;
let todosClientes = [];

// Elementos do DOM
const secLogin = document.getElementById("sec-login");
const secCartao = document.getElementById("sec-cartao");
const secAdmin = document.getElementById("sec-admin");
const formLogin = document.getElementById("form-login");
const inputNome = document.getElementById("input-nome");
const inputWhatsapp = document.getElementById("input-whatsapp");
const cliNome = document.getElementById("cli-nome");
const dispDesconto = document.getElementById("dispDesconto");
const adminClientList = document.getElementById("admin-client-list");

// Ao carregar a página, verifica se já existe sessão salva no localStorage
document.addEventListener("DOMContentLoaded", () => {
    const clienteSalvo = localStorage.getItem("lucas_franca_cliente");
    if (clienteSalvo) {
        try {
            clienteAtual = JSON.parse(clienteSalvo);
            if (clienteAtual && clienteAtual.whatsapp) {
                carregarDadosCliente(clienteAtual.whatsapp, clienteAtual.nome);
            }
        } catch (e) {
            localStorage.removeItem("lucas_franca_cliente");
        }
    }
});

// ==========================================
// LOGIN / CADASTRO DO CLIENTE
// ==========================================
async function loginCliente(event) {
    event.preventDefault();

    const nome = inputNome.value.trim();
    const whatsapp = limparWhatsApp(inputWhatsapp.value.trim());

    if (!nome || !whatsapp) {
        alert("Preencha o nome e o WhatsApp corretamente.");
        return;
    }

    const btnEntrar = document.getElementById("btn-entrar");
    
    try {
        if (btnEntrar) {
            btnEntrar.disabled = true;
            btnEntrar.innerText = "Acessando...";
        }

        const url = `${API_URL}?action=get_client&whatsapp=${encodeURIComponent(whatsapp)}&nome=${encodeURIComponent(nome)}`;
        const response = await fetch(url);

        if (!response.ok) throw new Error("Erro de comunicação com o servidor.");

        const data = await response.json();

        if (!data.success) {
            alert(data.error || "Não foi possível acessar o cartão.");
            return;
        }

        clienteAtual = {
            whatsapp: data.whatsapp,
            nome: data.nome,
            carimbos: data.carimbos
        };

        // Salva na sessão local
        localStorage.setItem("lucas_franca_cliente", JSON.stringify(clienteAtual));

        atualizarInterfaceCartao(data);
        alternarSecao("cartao");

    } catch (error) {
        console.error("Erro no login:", error);
        alert("Erro ao conectar com a planilha. Verifique a URL da API.");
    } finally {
        if (btnEntrar) {
            btnEntrar.disabled = false;
            btnEntrar.innerText = "Acessar Cartão";
        }
    }
}

// Carregar dados atualizados do cliente
async function carregarDadosCliente(whatsapp, nomePadrao) {
    try {
        const url = `${API_URL}?action=get_client&whatsapp=${encodeURIComponent(whatsapp)}&nome=${encodeURIComponent(nomePadrao || "")}`;
        const response = await fetch(url);
        if (!response.ok) return;

        const data = await response.json();
        if (data.success) {
            clienteAtual = {
                whatsapp: data.whatsapp,
                nome: data.nome,
                carimbos: data.carimbos
            };
            localStorage.setItem("lucas_franca_cliente", JSON.stringify(clienteAtual));
            atualizarInterfaceCartao(data);
            alternarSecao("cartao");
        }
    } catch (error) {
        console.error("Erro ao atualizar dados do cliente:", error);
    }
}

// Sair da conta (Logout)
function sairCliente() {
    localStorage.removeItem("lucas_franca_cliente");
    clienteAtual = null;
    formLogin.reset();
    alternarSecao("login");
}

// ==========================================
// ATUALIZAR INTERFACE DO CARTÃO
// ==========================================
function atualizarInterfaceCartao(data) {
    if (!data) return;

    cliNome.innerText = data.nome;
    const qtdCarimbos = parseInt(data.carimbos) || 0;

    const slot1 = document.getElementById("slot-1");
    const slot2 = document.getElementById("slot-2");
    const slot3 = document.getElementById("slot-3");

    // Limpa estados anteriores
    [slot1, slot2, slot3].forEach(slot => {
        if (slot) slot.classList.remove("active");
    });

    // Slot 1 (1ª Tattoo)
    if (slot1) {
        const icon1 = slot1.querySelector(".icon");
        if (qtdCarimbos >= 1) {
            slot1.classList.add("active");
            if (icon1) icon1.innerText = "✓";
        } else {
            if (icon1) icon1.innerText = "🩸";
        }
    }

    // Slot 2 (2ª Tattoo)
    if (slot2) {
        const icon2 = slot2.querySelector(".icon");
        if (qtdCarimbos >= 2) {
            slot2.classList.add("active");
            if (icon2) icon2.innerText = "✓";
        } else {
            if (icon2) icon2.innerText = "🩸";
        }
    }

    // Slot 3 (Recompensa de Desconto)
    if (slot3) {
        const icon3 = slot3.querySelector(".icon");
        if (qtdCarimbos >= 2) {
            slot3.classList.add("active");
            if (icon3) icon3.innerText = "🎁";
        } else {
            if (icon3) icon3.innerText = "🎁";
        }
    }

    // Texto descritivo do banner de recompensa
    if (dispDesconto) {
        if (qtdCarimbos >= 2) {
            dispDesconto.innerText = "🎉 Parabéns! Você completou o ciclo e tem 10% OFF na próxima tattoo!";
        } else {
            dispDesconto.innerText = `Falta ${2 - qtdCarimbos} tattoo para garantir seu desconto!`;
        }
    }
}

// ==========================================
// ADICIONAR CARIMBO (AÇÃO DO TATUADOR)
// ==========================================
async function adicionarCarimboComSenha() {
    if (!clienteAtual) {
        alert("Nenhum cliente carregado.");
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
        if (!response.ok) throw new Error("Erro HTTP: " + response.status);

        const data = await response.json();

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
    } finally {
        if (btnCarimbo) {
            btnCarimbo.disabled = false;
            btnCarimbo.innerText = "+ Adicionar Carimbo";
        }
    }
}

// ==========================================
// PAINEL ADMINISTRATIVO
// ==========================================
async function abrirModalAdmin() {
    const pin = prompt("Digite a Senha do Administrador:");
    if (!pin) return;

    try {
        const url = `${API_URL}?action=get_all&pin=${encodeURIComponent(pin)}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error("Erro HTTP: " + response.status);

        const data = await response.json();

        if (!data.success) {
            alert(data.error || "Senha incorreta.");
            return;
        }

        pinAdminAtual = pin;
        todosClientes = Array.isArray(data.clients) ? data.clients : [];
        
        renderizarClientesAdmin(todosClientes);
        
        if (secAdmin) secAdmin.classList.remove("hidden");
        const adminSearch = document.getElementById("admin-search");
        if (adminSearch) adminSearch.value = "";

    } catch (error) {
        console.error("Erro ao abrir painel admin:", error);
        alert("Erro ao autenticar painel administrativo.");
    }
}

function fecharAdmin() {
    if (secAdmin) secAdmin.classList.add("hidden");
    pinAdminAtual = null;
}

function renderizarClientesAdmin(lista) {
    if (!adminClientList) return;

    adminClientList.innerHTML = "";

    if (lista.length === 0) {
        adminClientList.innerHTML = `<p style="text-align: center; color: #777; padding: 15px;">Nenhum cliente encontrado.</p>`;
        return;
    }

    lista.forEach(cli => {
        const div = document.createElement("div");
        div.className = "client-item";
        div.innerHTML = `
            <div class="client-info">
                <strong>${escapeHTML(cli.nome)}</strong>
                <span>WhatsApp: ${escapeHTML(cli.whatsapp)} | Carimbos: <strong>${cli.carimbos}/2</strong></span>
                <span style="color: #666; font-size: 10px;">Última visita: ${escapeHTML(cli.ultimaVisita)}</span>
            </div>
            <button class="btn-sm" onclick="adicionarCarimboAdmin('${cli.whatsapp}', '${escapeHTML(cli.nome)}')">+ Carimbo</button>
        `;
        adminClientList.appendChild(div);
    });
}

function filtrarClientes() {
    const adminSearch = document.getElementById("admin-search");
    if (!adminSearch) return;

    const termo = adminSearch.value.toLowerCase().trim();

    const filtrados = todosClientes.filter(cli => {
        const nome = (cli.nome || "").toLowerCase();
        const whats = (cli.whatsapp || "").toLowerCase();
        return nome.includes(termo) || whats.includes(termo);
    });

    renderizarClientesAdmin(filtrados);
}

async function adicionarCarimboAdmin(whatsapp, nome) {
    if (!pinAdminAtual) return;

    try {
        const url = `${API_URL}?action=add_stamp&whatsapp=${encodeURIComponent(whatsapp)}&nome=${encodeURIComponent(nome)}&pin=${encodeURIComponent(pinAdminAtual)}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error("Erro HTTP: " + response.status);

        const data = await response.json();

        if (!data.success) {
            alert(data.error || "Erro ao adicionar carimbo.");
            return;
        }

        alert(`Carimbo adicionado para ${nome}!`);
        await atualizarPainelAdmin();

    } catch (error) {
        console.error("Erro no admin ao adicionar carimbo:", error);
        alert("Erro ao processar solicitação.");
    }
}

async function atualizarPainelAdmin() {
    if (!pinAdminAtual) return;

    try {
        const url = `${API_URL}?action=get_all&pin=${encodeURIComponent(pinAdminAtual)}`;
        const response = await fetch(url);
        if (!response.ok) return;

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
function limparWhatsApp(num) {
    if (!num) return "";
    return String(num).replace(/\D/g, "");
}

function escapeHTML(str) {
    if (!str) return "";
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function alternarSecao(secao) {
    if (secao === "login") {
        if (secLogin) secLogin.classList.remove("hidden");
        if (secCartao) secCartao.classList.add("hidden");
        if (secAdmin) secAdmin.classList.add("hidden");
    } else if (secao === "cartao") {
        if (secLogin) secLogin.classList.add("hidden");
        if (secCartao) secCartao.classList.remove("hidden");
    }
}

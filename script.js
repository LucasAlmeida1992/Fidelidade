// ==========================================
// CONFIGURAÇÃO DA API (GOOGLE APPS SCRIPT)
// CARTÃO FIDELIDADE - LUCAS FRANCA TATTOO
// ==========================================

const API_URL = "https://script.google.com/macros/s/AKfycbyI0svNzI2nIktgvCNTm76FQmBGXk0119W0claQhsf8Jz7XvnXQ9DiT09pZJFoYsgTF/exec";

// SVGs Configuráveis
const SVG_CHECK = `<svg xmlns="http://www.w3.org/2000/svg" height="28px" viewBox="0 -960 960 960" width="28px" fill="currentColor"><path d="m424-312 282-282-56-56-226 226-114-114-56 56 170 170ZM200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h560q33 0 56.5 23.5T840-760v560q0 33-23.5 56.5T760-120H200Z"/></svg>`;

const SVG_CIRCLE = `<svg xmlns="http://www.w3.org/2000/svg" height="28px" viewBox="0 -960 960 960" width="28px" fill="currentColor"><path d="M480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z"/></svg>`;

// ==========================================
// VARIÁVEIS GLOBAIS
// ==========================================

let clienteAtual = null;
let pinAdminAtual = null;
let todosClientes = [];

// ==========================================
// PWA - INSTALAÇÃO DO APLICATIVO
// ==========================================

let deferredInstallPrompt = null;

// Detecta quando o navegador oferece a instalação do PWA
window.addEventListener("beforeinstallprompt", (event) => {

    event.preventDefault();

    deferredInstallPrompt = event;

    const btnInstalar =
        document.getElementById("btn-instalar-app");

    if (btnInstalar) {
        btnInstalar.style.display = "block";
    }
});

// Detecta quando o aplicativo foi instalado
window.addEventListener("appinstalled", () => {

    deferredInstallPrompt = null;

    const btnInstalar =
        document.getElementById("btn-instalar-app");

    if (btnInstalar) {
        btnInstalar.style.display = "none";
    }

    const ajudaIOS =
        document.getElementById("ios-install-help");

    if (ajudaIOS) {
        ajudaIOS.classList.add("hidden");
    }

    console.log("Aplicativo instalado com sucesso.");
});

// Verifica se é iPhone/iPad
function ehIOS() {

    return /iphone|ipad|ipod/i.test(
        navigator.userAgent
    );
}

// Verifica se o site já está aberto como aplicativo
function estaNoModoApp() {

    return (
        window.matchMedia(
            "(display-mode: standalone)"
        ).matches ||
        window.navigator.standalone === true
    );
}

// ==========================================
// INSTALAR APLICATIVO
// ==========================================

async function instalarAplicativo() {

    const btnInstalar =
        document.getElementById("btn-instalar-app");

    const ajudaIOS =
        document.getElementById("ios-install-help");

    // ------------------------------------------
    // IPHONE / IPAD
    // ------------------------------------------

    if (ehIOS()) {

        if (estaNoModoApp()) {

            alert(
                "O cartão já está salvo como aplicativo neste aparelho."
            );

            return;
        }

        if (ajudaIOS) {
            ajudaIOS.classList.remove("hidden");
        }

        return;
    }

    // ------------------------------------------
    // ANDROID / CHROME / NAVEGADORES COMPATÍVEIS
    // ------------------------------------------

    if (!deferredInstallPrompt) {

        alert(
            "A instalação ainda não está disponível neste navegador.\n\n" +
            "Se estiver no celular, tente abrir o site pelo Google Chrome."
        );

        return;
    }

    deferredInstallPrompt.prompt();

    try {

        const resultado =
            await deferredInstallPrompt.userChoice;

        if (resultado.outcome === "accepted") {

            console.log(
                "Usuário aceitou instalar o aplicativo."
            );

        } else {

            console.log(
                "Usuário cancelou a instalação."
            );
        }

    } catch (error) {

        console.error(
            "Erro durante a instalação:",
            error
        );
    }

    deferredInstallPrompt = null;

    if (btnInstalar) {
        btnInstalar.style.display = "none";
    }
}

// ==========================================
// REGISTRO DO SERVICE WORKER
// ==========================================

function registrarServiceWorker() {

    if (!("serviceWorker" in navigator)) {

        console.log(
            "Service Worker não é suportado neste navegador."
        );

        return;
    }

    navigator.serviceWorker.register(
        "./service-worker.js"
    )

        .then((registration) => {

            console.log(
                "Service Worker registrado com sucesso:",
                registration.scope
            );

        })

        .catch((error) => {

            console.error(
                "Erro ao registrar Service Worker:",
                error
            );

        });
}

// ==========================================
// INICIALIZAÇÃO
// ==========================================

window.addEventListener("DOMContentLoaded", () => {

    // Registrar PWA
    registrarServiceWorker();

    const inputPhone =
        document.getElementById("cli-phone");

    const inputName =
        document.getElementById("cli-name");

    const localPhone =
        localStorage.getItem(
            "fidelidade_whatsapp"
        );

    const localName =
        localStorage.getItem(
            "fidelidade_nome"
        );

    if (localPhone) {

        if (inputPhone) {
            inputPhone.value = localPhone;
        }

        if (inputName) {
            inputName.value = localName || "";
        }

        carregarDadosCliente(
            localPhone,
            localName || ""
        );
    }

    // ==========================================
    // BOTÃO ACESSAR
    // ==========================================

    const btnAcessar =
        document.getElementById("btn-acessar");

    if (btnAcessar) {

        btnAcessar.addEventListener(
            "click",
            acessarCartao
        );
    }

    // ==========================================
    // ENTER NO WHATSAPP
    // ==========================================

    if (inputPhone) {

        inputPhone.addEventListener(
            "keydown",
            (event) => {

                if (event.key === "Enter") {

                    event.preventDefault();

                    if (btnAcessar) {
                        btnAcessar.click();
                    }
                }
            }
        );
    }

    // ==========================================
    // ENTER NO NOME
    // ==========================================

    if (inputName) {

        inputName.addEventListener(
            "keydown",
            (event) => {

                if (event.key === "Enter") {

                    event.preventDefault();

                    if (btnAcessar) {
                        btnAcessar.click();
                    }
                }
            }
        );
    }

    // ==========================================
    // BOTÃO SAIR
    // ==========================================

    const btnSair =
        document.getElementById("btn-sair");

    if (btnSair) {

        btnSair.addEventListener(
            "click",
            sair
        );
    }

    // ==========================================
    // BOTÃO ADMIN
    // ==========================================

    const btnAdmin =
        document.getElementById("btn-admin-toggle");

    if (btnAdmin) {

        btnAdmin.addEventListener(
            "click",
            promptAdmin
        );
    }

    // ==========================================
    // FECHAR ADMIN
    // ==========================================

    const btnFecharAdmin =
        document.getElementById("btn-fechar-admin");

    if (btnFecharAdmin) {

        btnFecharAdmin.addEventListener(
            "click",
            fecharAdmin
        );
    }

    // ==========================================
    // BUSCA ADMIN
    // ==========================================

    const adminSearch =
        document.getElementById("admin-search");

    if (adminSearch) {

        adminSearch.addEventListener(
            "input",
            filtrarClientes
        );
    }

    // ==========================================
    // BOTÃO DO MODAL DE RESGATE
    // ==========================================

    const btnAbrirResgate =
        document.getElementById("btn-abrir-resgate");

    if (btnAbrirResgate) {

        btnAbrirResgate.addEventListener(
            "click",
            abrirModalResgate
        );
    }

    const btnCancelarResgate =
        document.getElementById(
            "btn-cancelar-resgate"
        );

    if (btnCancelarResgate) {

        btnCancelarResgate.addEventListener(
            "click",
            fecharModalResgate
        );
    }

    const btnConfirmarResgate =
        document.getElementById(
            "btn-confirmar-resgate"
        );

    if (btnConfirmarResgate) {

        btnConfirmarResgate.addEventListener(
            "click",
            confirmarResgateCodigo
        );
    }

    // ==========================================
    // ENTER NO CÓDIGO DO MODAL
    // ==========================================

    const inputCodigo =
        document.getElementById(
            "input-codigo-resgate"
        );

    if (inputCodigo) {

        inputCodigo.addEventListener(
            "keydown",
            (event) => {

                if (event.key === "Enter") {

                    event.preventDefault();

                    if (btnConfirmarResgate) {
                        btnConfirmarResgate.click();
                    }
                }
            }
        );
    }

    // ==========================================
    // BOTÃO INSTALAR APLICATIVO
    // ==========================================

    const btnInstalarApp =
        document.getElementById(
            "btn-instalar-app"
        );

    if (btnInstalarApp) {

        btnInstalarApp.addEventListener(
            "click",
            instalarAplicativo
        );
    }

});

// ==========================================
// ACESSAR CARTÃO (LOGIN)
// ==========================================

async function acessarCartao(event) {

    if (event) {
        event.preventDefault();
    }

    const inputPhone =
        document.getElementById("cli-phone");

    const inputName =
        document.getElementById("cli-name");

    const phone =
        inputPhone
            ? inputPhone.value.replace(/\D/g, "")
            : "";

    const name =
        inputName
            ? inputName.value.trim()
            : "";

    if (!phone) {

        alert(
            "Digite o número do seu WhatsApp."
        );

        return;
    }

    localStorage.setItem(
        "fidelidade_whatsapp",
        phone
    );

    localStorage.setItem(
        "fidelidade_nome",
        name
    );

    await carregarDadosCliente(
        phone,
        name
    );
}

// ==========================================
// BUSCAR DADOS DO CLIENTE NA API
// ==========================================

async function carregarDadosCliente(
    phone,
    name = ""
) {

    const btnAcessar =
        document.getElementById("btn-acessar");

    try {

        if (btnAcessar) {

            btnAcessar.disabled = true;

            btnAcessar.innerText =
                "Acessando...";
        }

        const url =
            `${API_URL}?action=get_client&whatsapp=${encodeURIComponent(phone)}&nome=${encodeURIComponent(name)}`;

        const response =
            await fetch(url);

        if (!response.ok) {

            throw new Error(
                "HTTP " + response.status
            );
        }

        const data =
            await response.json();

        // ==========================================
        // ERRO DA API
        // ==========================================
        //
        // Não tratamos mais "deleted" como bloqueio.
        // O Backend agora permite novo cadastro após
        // exclusão.
        // ==========================================

        if (data.success === false) {

            alert(
                data.error ||
                "Erro ao consultar cliente."
            );

            return;
        }

        // ==========================================
        // CLIENTE CARREGADO COM SUCESSO
        // ==========================================

        clienteAtual = {

            whatsapp:
                data.whatsapp || phone,

            nome:
                data.nome ||
                name ||
                "Cliente",

            carimbos:
                Number(data.carimbos) || 0
        };

        atualizarInterfaceCartao(
            clienteAtual.nome,
            clienteAtual.carimbos
        );

        alternarSecao("cartao");

    } catch (error) {

        console.error(
            "Erro ao carregar cliente:",
            error
        );

        alert(
            "Erro ao conectar com a planilha. Verifique a URL da API."
        );

    } finally {

        if (btnAcessar) {

            btnAcessar.disabled = false;

            btnAcessar.innerText =
                "Acessar Cartão";
        }
    }
}

// ==========================================
// ATUALIZAR INTERFACE DO CARTÃO
// ==========================================

function atualizarInterfaceCartao(
    nome,
    carimbos
) {

    carimbos =
        Number(carimbos) || 0;

    const dispNome =
        document.getElementById("disp-nome");

    const dispDesconto =
        document.getElementById("disp-desconto");

    if (dispNome) {

        dispNome.innerText =
            nome || "Cliente";
    }

    if (dispDesconto) {

        if (carimbos <= 0) {

            dispDesconto.innerText =
                "Faça sua 1ª tattoo para iniciar o cartão!";

        } else if (carimbos === 1) {

            dispDesconto.innerText =
                "Falta 1 tattoo para liberar 10% OFF na próxima!";

        } else {

            dispDesconto.innerText =
                "🎉 10% DE DESCONTO LIBERADO PARA A PRÓXIMA TATTOO!";
        }
    }

    atualizarSlot(
        "slot-1",
        carimbos >= 1,
        SVG_CHECK,
        SVG_CIRCLE
    );

    atualizarSlot(
        "slot-2",
        carimbos >= 2,
        SVG_CHECK,
        SVG_CIRCLE
    );

    atualizarSlot(
        "slot-3",
        carimbos >= 2,
        "🏆",
        "🎁"
    );
}

function atualizarSlot(
    id,
    ativo,
    iconeAtivo,
    iconeInativo
) {

    const slot =
        document.getElementById(id);

    if (!slot) {
        return;
    }

    slot.className =
        ativo
            ? "stamp-slot active"
            : "stamp-slot";

    const iconSpan =
        slot.querySelector(".icon");

    if (iconSpan) {

        iconSpan.innerHTML =
            ativo
                ? iconeAtivo
                : iconeInativo;
    }
}

// ==========================================
// MODAL DE RESGATE POR CÓDIGO (CLIENTE)
// ==========================================

function abrirModalResgate() {

    const modal =
        document.getElementById(
            "modal-resgate"
        );

    const inputCodigo =
        document.getElementById(
            "input-codigo-resgate"
        );

    if (modal) {

        modal.classList.remove(
            "hidden"
        );
    }

    if (inputCodigo) {

        inputCodigo.value = "";

        inputCodigo.focus();
    }
}

function fecharModalResgate() {

    const modal =
        document.getElementById(
            "modal-resgate"
        );

    if (modal) {

        modal.classList.add(
            "hidden"
        );
    }
}

async function confirmarResgateCodigo() {

    const inputCodigo =
        document.getElementById(
            "input-codigo-resgate"
        );

    const codigo =
        inputCodigo
            ? inputCodigo.value.trim()
            : "";

    if (codigo.length !== 4) {

        alert(
            "Digite o código de 4 dígitos fornecido pelo tatuador."
        );

        return;
    }

    if (
        !clienteAtual ||
        !clienteAtual.whatsapp
    ) {

        alert(
            "Sessão expirada. Faça login novamente."
        );

        return;
    }

    try {

        const url =
            `${API_URL}?action=redeem_token&whatsapp=${encodeURIComponent(clienteAtual.whatsapp)}&codigo=${encodeURIComponent(codigo)}`;

        const response =
            await fetch(url);

        if (!response.ok) {

            throw new Error(
                "HTTP " + response.status
            );
        }

        const data =
            await response.json();

        if (!data.success) {

            alert(
                data.error ||
                "Código inválido ou expirado!"
            );

            return;
        }

        fecharModalResgate();

        if (data.cicloResetado) {

            alert(
                "🎉 Desconto resgatado com sucesso!\n" +
                "O seu cartão foi reiniciado para o próximo ciclo."
            );

        } else if (data.descontoLiberado) {

            alert(
                "🎉 Carimbo adicionado!\n" +
                "Você liberou 10% de desconto para a próxima tattoo!"
            );

        } else {

            alert(
                "✅ Carimbo adicionado com sucesso!"
            );
        }

        clienteAtual.carimbos =
            data.carimbos;

        atualizarInterfaceCartao(
            clienteAtual.nome,
            clienteAtual.carimbos
        );

    } catch (error) {

        console.error(
            "Erro ao resgatar código:",
            error
        );

        alert(
            "Erro ao validar o código."
        );
    }
}

// ==========================================
// PAINEL ADMIN - LOGIN
// ==========================================

async function promptAdmin() {

    const pin =
        prompt(
            "Digite a senha de Administrador:"
        );

    if (!pin) {
        return;
    }

    try {

        const url =
            `${API_URL}?action=get_all&pin=${encodeURIComponent(pin)}`;

        const response =
            await fetch(url);

        if (!response.ok) {

            throw new Error(
                "HTTP " + response.status
            );
        }

        const data =
            await response.json();

        if (!data.success) {

            alert(
                data.error ||
                "Senha incorreta!"
            );

            return;
        }

        pinAdminAtual =
            pin;

        todosClientes =
            Array.isArray(data.clients)
                ? data.clients
                : [];

        renderizarClientesAdmin(
            todosClientes
        );

        const secAdmin =
            document.getElementById(
                "sec-admin"
            );

        if (secAdmin) {

            secAdmin.classList.remove(
                "hidden"
            );
        }

    } catch (error) {

        console.error(
            "Erro painel admin:",
            error
        );

        alert(
            "Erro ao buscar dados do painel admin."
        );
    }
}

// ==========================================
// PAINEL ADMIN - RENDERIZAR LISTA
// ==========================================

function renderizarClientesAdmin(lista) {

    const container =
        document.getElementById(
            "lista-clientes-admin"
        );

    if (!container) {
        return;
    }

    container.innerHTML = "";

    if (
        !Array.isArray(lista) ||
        lista.length === 0
    ) {

        container.innerHTML =
            '<p style="color:#aaa; font-size:13px; text-align:center; padding:12px;">Nenhum cliente cadastrado.</p>';

        return;
    }

    lista.forEach((cliente) => {

        const item =
            document.createElement("div");

        item.className =
            "client-item";

        const nome =
            cliente.nome ||
            "Cliente";

        const whatsapp =
            String(
                cliente.whatsapp || ""
            );

        const carimbos =
            Number(
                cliente.carimbos
            ) || 0;

        item.innerHTML = `
            <div class="client-info">
                <strong>${escapeHTML(nome)}</strong>
                <span>${escapeHTML(whatsapp)} | ${carimbos}/2 carimbos</span>
            </div>

            <div style="display: flex; gap: 4px;">

                <button
                    type="button"
                    class="btn-sm btn-code-admin"
                    title="Gerar código de 60s"
                >
                    🔑 Código
                </button>

                <button
                    type="button"
                    class="btn-sm btn-add-admin"
                    title="Carimbo direto"
                >
                    + Carimbo
                </button>

                <button
                    type="button"
                    class="btn-sm btn-delete-admin"
                    title="Excluir"
                >
                    Excluir
                </button>

            </div>
        `;

        // ==========================================
        // BOTÃO GERAR CÓDIGO
        // ==========================================

        const botaoCodigo =
            item.querySelector(
                ".btn-code-admin"
            );

        if (botaoCodigo) {

            botaoCodigo.addEventListener(
                "click",
                () => {

                    gerarCodigoAdmin(
                        whatsapp,
                        nome
                    );

                }
            );
        }

        // ==========================================
        // BOTÃO CARIMBO DIRETO
        // ==========================================

        const botaoCarimbo =
            item.querySelector(
                ".btn-add-admin"
            );

        if (botaoCarimbo) {

            botaoCarimbo.addEventListener(
                "click",
                () => {

                    carimboDiretoAdmin(
                        whatsapp,
                        nome
                    );

                }
            );
        }

        // ==========================================
        // BOTÃO EXCLUIR
        // ==========================================

        const botaoExcluir =
            item.querySelector(
                ".btn-delete-admin"
            );

        if (botaoExcluir) {

            botaoExcluir.addEventListener(
                "click",
                () => {

                    excluirClienteAdmin(
                        whatsapp,
                        nome
                    );

                }
            );
        }

        container.appendChild(item);
    });
}

// ==========================================
// PAINEL ADMIN - GERAR CÓDIGO TEMPORÁRIO
// ==========================================

async function gerarCodigoAdmin(
    whatsapp,
    nome
) {

    let pin =
        pinAdminAtual;

    if (!pin) {

        pin =
            prompt(
                "Confirme a senha Admin:"
            );

        if (!pin) {
            return;
        }
    }

    try {

        const url =
            `${API_URL}?action=generate_token&whatsapp=${encodeURIComponent(whatsapp)}&pin=${encodeURIComponent(pin)}`;

        const response =
            await fetch(url);

        if (!response.ok) {

            throw new Error(
                "HTTP " + response.status
            );
        }

        const data =
            await response.json();

        if (!data.success) {

            alert(
                data.error ||
                "Erro ao gerar código."
            );

            return;
        }

        alert(
            `🔑 Código gerado para ${nome}:\n\n【 ${data.codigo} 】\n\nEste código expira em 60 segundos.`
        );

        await atualizarPainelAdmin();

    } catch (error) {

        console.error(
            "Erro gerando código:",
            error
        );

        alert(
            "Erro de conexão ao gerar código."
        );
    }
}

// ==========================================
// PAINEL ADMIN - CARIMBO DIRETO
// ==========================================

async function carimboDiretoAdmin(
    whatsapp,
    nome
) {

    let pin =
        pinAdminAtual;

    if (!pin) {

        pin =
            prompt(
                "Confirme a senha Admin:"
            );

        if (!pin) {
            return;
        }
    }

    try {

        const url =
            `${API_URL}?action=add_stamp&whatsapp=${encodeURIComponent(whatsapp)}&nome=${encodeURIComponent(nome)}&pin=${encodeURIComponent(pin)}`;

        const response =
            await fetch(url);

        if (!response.ok) {

            throw new Error(
                "HTTP " + response.status
            );
        }

        const data =
            await response.json();

        if (!data.success) {

            alert(
                data.error ||
                "Senha incorreta!"
            );

            return;
        }

        if (data.cicloResetado) {

            alert(
                `🎉 Desconto resgatado para ${nome}!\n` +
                `O cartão foi reiniciado para o próximo ciclo.`
            );

        } else if (data.descontoLiberado) {

            alert(
                `🎉 Carimbo adicionado para ${nome}!\n` +
                `10% de desconto liberado!`
            );

        } else {

            alert(
                `✅ Carimbo adicionado com sucesso para ${nome}!`
            );
        }

        await atualizarPainelAdmin();

        if (
            clienteAtual &&
            clienteAtual.whatsapp === whatsapp
        ) {

            clienteAtual.carimbos =
                data.carimbos;

            atualizarInterfaceCartao(
                clienteAtual.nome,
                clienteAtual.carimbos
            );
        }

    } catch (error) {

        console.error(
            "Erro carimbo admin:",
            error
        );

        alert(
            "Erro ao registrar carimbo."
        );
    }
}

// ==========================================
// PAINEL ADMIN - EXCLUIR CLIENTE
// ==========================================

async function excluirClienteAdmin(
    whatsapp,
    nome
) {

    if (
        !confirm(
            `Tem certeza que deseja excluir o cliente "${nome}" (${whatsapp})?`
        )
    ) {

        return;
    }

    let pin =
        pinAdminAtual;

    if (!pin) {

        pin =
            prompt(
                "Confirme a senha Admin:"
            );

        if (!pin) {
            return;
        }
    }

    try {

        const url =
            `${API_URL}?action=delete_client&whatsapp=${encodeURIComponent(whatsapp)}&pin=${encodeURIComponent(pin)}`;

        const response =
            await fetch(url);

        if (!response.ok) {

            throw new Error(
                "HTTP " + response.status
            );
        }

        const data =
            await response.json();

        if (!data.success) {

            alert(
                data.error ||
                "Erro ao excluir cliente."
            );

            return;
        }

        // ==========================================
        // LIMPA O CAMPO DE BUSCA DO ADMIN
        // ==========================================

        const adminSearch =
            document.getElementById(
                "admin-search"
            );

        if (adminSearch) {
            adminSearch.value = "";
        }

        // ==========================================
        // VERIFICA SE O CLIENTE EXCLUÍDO
        // É O CLIENTE SALVO NO NAVEGADOR
        // ==========================================

        const whatsappSalvo =
            limparWhatsAppLocal(
                localStorage.getItem(
                    "fidelidade_whatsapp"
                )
            );

        const whatsappExcluido =
            limparWhatsAppLocal(
                whatsapp
            );

        const clienteAberto =
            clienteAtual &&
            limparWhatsAppLocal(
                clienteAtual.whatsapp
            ) === whatsappExcluido;

        const clienteSalvo =
            whatsappSalvo === whatsappExcluido;

        // ==========================================
        // SE O CLIENTE EXCLUÍDO ESTAVA LOGADO,
        // DESLOGA COMPLETAMENTE
        // ==========================================

        if (
            clienteAberto ||
            clienteSalvo
        ) {

            // Limpa memória da sessão
            clienteAtual = null;

            // Limpa dados persistidos
            localStorage.removeItem(
                "fidelidade_whatsapp"
            );

            localStorage.removeItem(
                "fidelidade_nome"
            );

            // Limpa campos do login
            const inputPhone =
                document.getElementById(
                    "cli-phone"
                );

            const inputName =
                document.getElementById(
                    "cli-name"
                );

            if (inputPhone) {
                inputPhone.value = "";
            }

            if (inputName) {
                inputName.value = "";
            }

            // Fecha modal de código caso esteja aberto
            fecharModalResgate();

            // Volta para o login
            alternarSecao("login");
        }

        // ==========================================
        // MENSAGEM DE SUCESSO
        // ==========================================

        alert(
            `🗑️ Cliente ${nome} excluído com sucesso!`
        );

        // ==========================================
        // ATUALIZA LISTA DO PAINEL
        // ==========================================

        await atualizarPainelAdmin();

    } catch (error) {

        console.error(
            "Erro ao excluir cliente:",
            error
        );

        alert(
            "Erro de conexão ao tentar excluir."
        );
    }
}

// ==========================================
// UTILITÁRIO - LIMPAR WHATSAPP LOCAL
// ==========================================

function limparWhatsAppLocal(numero) {

    if (!numero) {
        return "";
    }

    return String(numero)
        .replace(/\D/g, "");
}

// ==========================================
// ATUALIZAR PAINEL ADMIN
// ==========================================

async function atualizarPainelAdmin() {

    if (!pinAdminAtual) {
        return;
    }

    try {

        const url =
            `${API_URL}?action=get_all&pin=${encodeURIComponent(pinAdminAtual)}`;

        const response =
            await fetch(url);

        if (!response.ok) {

            throw new Error(
                "HTTP " + response.status
            );
        }

        const data =
            await response.json();

        if (data.success) {

            todosClientes =
                Array.isArray(data.clients)
                    ? data.clients
                    : [];

            filtrarClientes();
        }

    } catch (error) {

        console.error(
            "Erro atualizando admin:",
            error
        );
    }
}

// ==========================================
// UTILITÁRIOS
// ==========================================

function filtrarClientes() {

    const adminSearch =
        document.getElementById(
            "admin-search"
        );

    if (!adminSearch) {
        return;
    }

    const termo =
        adminSearch.value
            .toLowerCase()
            .trim();

    const filtrados =
        todosClientes.filter(
            (cliente) => {

                const nome =
                    String(
                        cliente.nome || ""
                    ).toLowerCase();

                const whatsapp =
                    String(
                        cliente.whatsapp || ""
                    );

                return (
                    nome.includes(termo) ||
                    whatsapp.includes(termo)
                );
            }
        );

    renderizarClientesAdmin(
        filtrados
    );
}

// ==========================================
// FECHAR PAINEL ADMIN
// ==========================================

function fecharAdmin() {

    const secAdmin =
        document.getElementById(
            "sec-admin"
        );

    if (secAdmin) {

        secAdmin.classList.add(
            "hidden"
        );
    }
}

// ==========================================
// SAIR
// ==========================================

function sair() {

    localStorage.removeItem(
        "fidelidade_whatsapp"
    );

    localStorage.removeItem(
        "fidelidade_nome"
    );

    clienteAtual = null;

    alternarSecao("login");

    const inputPhone =
        document.getElementById(
            "cli-phone"
        );

    const inputName =
        document.getElementById(
            "cli-name"
        );

    if (inputPhone) {
        inputPhone.value = "";
    }

    if (inputName) {
        inputName.value = "";
    }
}

// ==========================================
// ALTERNAR SEÇÕES
// ==========================================

function alternarSecao(secao) {

    const secLogin =
        document.getElementById(
            "sec-login"
        );

    const secCard =
        document.getElementById(
            "sec-cartao"
        );

    if (secao === "login") {

        if (secLogin) {

            secLogin.classList.remove(
                "hidden"
            );
        }

        if (secCard) {

            secCard.classList.add(
                "hidden"
            );
        }

    } else if (secao === "cartao") {

        if (secLogin) {

            secLogin.classList.add(
                "hidden"
            );
        }

        if (secCard) {

            secCard.classList.remove(
                "hidden"
            );
        }
    }
}

// ==========================================
// ESCAPAR HTML
// ==========================================

function escapeHTML(value) {

    return String(value)

        .replace(
            /&/g,
            "&amp;"
        )

        .replace(
            /</g,
            "&lt;"
        )

        .replace(
            />/g,
            "&gt;"
        )

        .replace(
            /"/g,
            "&quot;"
        )

        .replace(
            /'/g,
            "&#039;"
        );
}

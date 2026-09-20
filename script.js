// ==========================================
// CONFIGURAÇÃO DA API
// CARTÃO FIDELIDADE - LUCAS FRANÇA TATTOO
// ==========================================

const API_URL = "https://script.google.com/macros/s/AKfycbyI0svNzI2nIktgvCNTm76FQmBGXk0119W0claQhsf8Jz7XvnXQ9DiT09pZJFoYsgTF/exec";


// ==========================================
// SVGs CONFIGURÁVEIS
// ==========================================

const SVG_CHECK = `<svg xmlns="http://www.w3.org/2000/svg" height="28px" viewBox="0 -960 960 960" width="28px" fill="currentColor"><path d="m424-312 282-282-56-56-226 226-114-114-56 56 170 170ZM200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h560q33 0 56.5 23.5T840-760v560q0 33-23.5 56.5T760-120H200Z"/></svg>`;

const SVG_CIRCLE = `<svg xmlns="http://www.w3.org/2000/svg" height="28px" viewBox="0 -960 960 960" width="28px" fill="currentColor"><path d="M480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z"/></svg>`;


// ==========================================
// VARIÁVEIS GLOBAIS
// ==========================================

let clienteAtual = null;
let pinAdminAtual = null;
let todosClientes = [];


// ==========================================
// MONITORAMENTO AUTOMÁTICO DO CARTÃO
// ==========================================

let monitorCartaoInterval = null;
let monitorCartaoEmAndamento = false;


// ==========================================
// FUNÇÃO CENTRAL PARA LIMPAR SESSÃO
// ==========================================

function limparSessaoCliente() {

    // Para o monitoramento automático
    pararMonitorCartao();

    // Remove todos os dados de login
    localStorage.removeItem("fidelidade_whatsapp");
    localStorage.removeItem("fidelidade_nome");
    localStorage.removeItem("fidelidade_sessao_ativa");

    // Limpa memória da página
    clienteAtual = null;

    // Fecha modal caso esteja aberto
    fecharModalResgate();

    // Volta para a tela de login
    alternarSecao("login");

    // Limpa os campos
    const inputPhone =
        document.getElementById("cli-phone");

    const inputName =
        document.getElementById("cli-name");

    if (inputPhone) {
        inputPhone.value = "";
    }

    if (inputName) {
        inputName.value = "";
    }
}


// ==========================================
// INICIALIZAÇÃO
// ==========================================

window.addEventListener("DOMContentLoaded", () => {

    const inputPhone =
        document.getElementById("cli-phone");

    const inputName =
        document.getElementById("cli-name");


    // ==========================================
    // RECUPERA SESSÃO SALVA
    // ==========================================

    const localPhone =
        localStorage.getItem("fidelidade_whatsapp");

    const localName =
        localStorage.getItem("fidelidade_nome");

    const sessaoAtiva =
        localStorage.getItem("fidelidade_sessao_ativa");


    // ==========================================
    // RESTAURA LOGIN SOMENTE SE A SESSÃO ESTIVER ATIVA
    // ==========================================

    if (
        localPhone &&
        sessaoAtiva === "true"
    ) {

        if (inputPhone) {
            inputPhone.value = localPhone;
        }

        if (inputName) {
            inputName.value = localName || "";
        }

        carregarDadosCliente(
            localPhone,
            localName || "",
            true
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
    // PESQUISA ADMIN
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
    // MODAL DE RESGATE
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
    // ENTER NO LOGIN
    // ==========================================

    configurarEnterLogin();


    // ==========================================
    // ENTER NO CÓDIGO
    // ==========================================

    configurarEnterCodigo();
});


// ==========================================
// ENTER NO LOGIN
// ==========================================

function configurarEnterLogin() {

    const inputPhone =
        document.getElementById("cli-phone");

    const inputName =
        document.getElementById("cli-name");


    if (inputPhone) {

        inputPhone.addEventListener(
            "keydown",
            function(event) {

                if (event.key === "Enter") {

                    event.preventDefault();

                    const btnAcessar =
                        document.getElementById(
                            "btn-acessar"
                        );

                    if (btnAcessar) {
                        btnAcessar.click();
                    }
                }
            }
        );
    }


    if (inputName) {

        inputName.addEventListener(
            "keydown",
            function(event) {

                if (event.key === "Enter") {

                    event.preventDefault();

                    const btnAcessar =
                        document.getElementById(
                            "btn-acessar"
                        );

                    if (btnAcessar) {
                        btnAcessar.click();
                    }
                }
            }
        );
    }
}


// ==========================================
// ENTER NO CÓDIGO DE RESGATE
// ==========================================

function configurarEnterCodigo() {

    const inputCodigo =
        document.getElementById(
            "input-codigo-resgate"
        );


    if (!inputCodigo) {
        return;
    }


    inputCodigo.addEventListener(
        "keydown",
        function(event) {

            if (event.key === "Enter") {

                event.preventDefault();

                const btnConfirmar =
                    document.getElementById(
                        "btn-confirmar-resgate"
                    );

                if (btnConfirmar) {
                    btnConfirmar.click();
                }
            }
        }
    );
}


// ==========================================
// ACESSAR CARTÃO
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


    // ==========================================
    // CARREGA CLIENTE
    // O localStorage só será salvo depois
    // que a API confirmar que o cliente existe.
    // ==========================================

    await carregarDadosCliente(
        phone,
        name,
        false
    );
}


// ==========================================
// BUSCAR DADOS DO CLIENTE NA API
// ==========================================

async function carregarDadosCliente(
    phone,
    name = "",
    restaurandoSessao = false
) {

    const btnAcessar =
        document.getElementById(
            "btn-acessar"
        );


    try {

        if (btnAcessar) {

            btnAcessar.disabled = true;

            btnAcessar.innerText =
                "Acessando...";
        }


        const url =
            `${API_URL}?action=get_client` +
            `&whatsapp=${encodeURIComponent(phone)}` +
            `&nome=${encodeURIComponent(name)}`;


        const response =
            await fetch(
                url,
                {
                    cache: "no-store"
                }
            );


        if (!response.ok) {

            throw new Error(
                "HTTP " + response.status
            );
        }


        const data =
            await response.json();


        // ==========================================
        // CLIENTE NÃO ENCONTRADO / EXCLUÍDO
        // ==========================================

        if (data.success === false) {

            limparSessaoCliente();


            if (restaurandoSessao) {

                alert(
                    data.error ||
                    "Seu cadastro não foi encontrado. Faça o login novamente."
                );

            } else {

                alert(
                    data.error ||
                    "Cliente não encontrado. Faça o cadastro novamente."
                );
            }


            return;
        }


        // ==========================================
        // MONTA CLIENTE ATUAL
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


        // ==========================================
        // AGORA SIM SALVA A SESSÃO
        // ==========================================

        localStorage.setItem(
            "fidelidade_whatsapp",
            clienteAtual.whatsapp
        );

        localStorage.setItem(
            "fidelidade_nome",
            clienteAtual.nome
        );

        localStorage.setItem(
            "fidelidade_sessao_ativa",
            "true"
        );


        // ==========================================
        // ATUALIZA INTERFACE
        // ==========================================

        atualizarInterfaceCartao(
            clienteAtual.nome,
            clienteAtual.carimbos
        );


        alternarSecao("cartao");


        // ==========================================
        // INICIA MONITORAMENTO AUTOMÁTICO
        // ==========================================

        iniciarMonitorCartao();


    } catch (error) {

        console.error(
            "Erro ao carregar cliente:",
            error
        );


        alert(
            "Erro ao conectar com a planilha. Verifique a URL da API."
        );


        // Se estava restaurando uma sessão
        // e deu erro, não deixa sessão quebrada.

        if (restaurandoSessao) {

            localStorage.removeItem(
                "fidelidade_whatsapp"
            );

            localStorage.removeItem(
                "fidelidade_nome"
            );

            localStorage.removeItem(
                "fidelidade_sessao_ativa"
            );

            clienteAtual = null;

            alternarSecao("login");
        }


    } finally {

        if (btnAcessar) {

            btnAcessar.disabled = false;

            btnAcessar.innerText =
                "Acessar Cartão";
        }
    }
}


// ==========================================
// MONITORAMENTO AUTOMÁTICO DO CARTÃO
// ==========================================

function iniciarMonitorCartao() {

    // Evita criar mais de um intervalo
    pararMonitorCartao();


    if (
        !clienteAtual ||
        !clienteAtual.whatsapp
    ) {
        return;
    }


    // Consulta a cada 3 segundos
    monitorCartaoInterval =
        setInterval(
            verificarAlteracaoCartao,
            3000
        );
}


function pararMonitorCartao() {

    if (monitorCartaoInterval) {

        clearInterval(
            monitorCartaoInterval
        );

        monitorCartaoInterval = null;
    }
}


async function verificarAlteracaoCartao() {

    if (
        !clienteAtual ||
        !clienteAtual.whatsapp
    ) {
        return;
    }


    // Evita consultas simultâneas
    if (monitorCartaoEmAndamento) {
        return;
    }


    monitorCartaoEmAndamento = true;


    try {

        const url =
            `${API_URL}?action=get_client` +
            `&whatsapp=${encodeURIComponent(
                clienteAtual.whatsapp
            )}` +
            `&nome=${encodeURIComponent(
                clienteAtual.nome || ""
            )}`;


        const response =
            await fetch(
                url,
                {
                    cache: "no-store"
                }
            );


        if (!response.ok) {
            return;
        }


        const data =
            await response.json();


        // ==========================================
        // CLIENTE FOI EXCLUÍDO
        // ==========================================

        if (data.success === false) {

            pararMonitorCartao();

            limparSessaoCliente();

            alert(
                data.error ||
                "Seu cadastro não foi encontrado."
            );

            return;
        }


        // ==========================================
        // NOVA QUANTIDADE DE CARIMBOS
        // ==========================================

        const novosCarimbos =
            Number(data.carimbos) || 0;


        const carimbosAtuais =
            Number(clienteAtual.carimbos) || 0;


        // ==========================================
        // NADA MUDOU
        // ==========================================

        if (
            novosCarimbos === carimbosAtuais
        ) {
            return;
        }


        // ==========================================
        // ALTERAÇÃO DETECTADA
        // ==========================================

        console.log(
            "Alteração detectada no cartão:",
            carimbosAtuais,
            "->",
            novosCarimbos
        );


        clienteAtual.carimbos =
            novosCarimbos;


        // ==========================================
        // RECARREGA O CELULAR DO CLIENTE
        // ==========================================

        window.location.reload();


    } catch (error) {

        console.error(
            "Erro ao verificar atualização do cartão:",
            error
        );


    } finally {

        monitorCartaoEmAndamento = false;
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
        document.getElementById(
            "disp-nome"
        );


    const dispDesconto =
        document.getElementById(
            "disp-desconto"
        );


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


    // ==========================================
    // TEXTO DO BOTÃO
    // ==========================================

    const btnAbrirResgate =
        document.getElementById(
            "btn-abrir-resgate"
        );


    if (btnAbrirResgate) {

        if (carimbos >= 2) {

            btnAbrirResgate.innerText =
                "🔄 Reiniciar Cartão";

        } else {

            btnAbrirResgate.innerText =
                "🔑 Digitar Código do Estúdio";
        }
    }
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
// MODAL DE RESGATE POR CÓDIGO
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
        modal.classList.remove("hidden");
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


// ==========================================
// CONFIRMAR CÓDIGO DO ESTÚDIO
// ==========================================

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

        limparSessaoCliente();

        return;
    }


    const btnConfirmar =
        document.getElementById(
            "btn-confirmar-resgate"
        );


    try {

        if (btnConfirmar) {
            btnConfirmar.disabled = true;
        }


        const url =
            `${API_URL}?action=redeem_token` +
            `&whatsapp=${encodeURIComponent(
                clienteAtual.whatsapp
            )}` +
            `&codigo=${encodeURIComponent(
                codigo
            )}`;


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


        // ==========================================
        // IMPORTANTE:
        // NÃO RECARREGA A PÁGINA AQUI.
        // O próprio cliente já atualiza a interface.
        // ==========================================

        clienteAtual.carimbos =
            Number(data.carimbos) || 0;


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


    } finally {

        if (btnConfirmar) {
            btnConfirmar.disabled = false;
        }
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
            `${API_URL}?action=get_all` +
            `&pin=${encodeURIComponent(pin)}`;


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


        pinAdminAtual = pin;


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
        // BOTÃO CÓDIGO
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
        // BOTÃO CARIMBO
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
            `${API_URL}?action=generate_token` +
            `&whatsapp=${encodeURIComponent(
                whatsapp
            )}` +
            `&pin=${encodeURIComponent(
                pin
            )}`;


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
            `🔑 Código gerado para ${nome}:\n\n` +
            `【 ${data.codigo} 】\n\n` +
            `Este código expira em 60 segundos.`
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
            `${API_URL}?action=add_stamp` +
            `&whatsapp=${encodeURIComponent(
                whatsapp
            )}` +
            `&nome=${encodeURIComponent(
                nome
            )}` +
            `&pin=${encodeURIComponent(
                pin
            )}`;


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


        // ==========================================
        // MENSAGEM DO CARIMBO
        // ==========================================

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


        // ==========================================
        // ATUALIZA PAINEL DO ADMIN
        // ==========================================

        await atualizarPainelAdmin();


        // ==========================================
        // SE O ADMIN E O CLIENTE ESTIVEREM
        // NA MESMA PÁGINA, ATUALIZA TAMBÉM
        // ==========================================

        if (
            clienteAtual &&
            String(clienteAtual.whatsapp) ===
            String(whatsapp)
        ) {

            clienteAtual.carimbos =
                Number(data.carimbos) || 0;


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

    const confirmar =
        confirm(
            `Tem certeza que deseja excluir o cliente "${nome}" (${whatsapp})?`
        );


    if (!confirmar) {
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
            `${API_URL}?action=delete_client` +
            `&whatsapp=${encodeURIComponent(
                whatsapp
            )}` +
            `&pin=${encodeURIComponent(
                pin
            )}`;


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
        // VERIFICA SE O CLIENTE EXCLUÍDO
        // É O CLIENTE ATUAL
        // ==========================================

        const clienteExcluidoEhAtual =
            clienteAtual &&
            String(clienteAtual.whatsapp) ===
            String(whatsapp);


        if (clienteExcluidoEhAtual) {

            limparSessaoCliente();
        }


        alert(
            `🗑️ Cliente ${nome} excluído com sucesso!`
        );


        // ==========================================
        // ATUALIZA PAINEL ADMIN
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
// ATUALIZAR PAINEL ADMIN
// ==========================================

async function atualizarPainelAdmin() {

    if (!pinAdminAtual) {
        return;
    }


    try {

        const url =
            `${API_URL}?action=get_all` +
            `&pin=${encodeURIComponent(
                pinAdminAtual
            )}`;


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
// FILTRAR CLIENTES
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
                    )
                    .toLowerCase();


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
// FECHAR ADMIN
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

    limparSessaoCliente();
}


// ==========================================
// ALTERNAR SEÇÕES
// ==========================================

function alternarSecao(secao) {

    const secLogin =
        document.getElementById(
            "sec-login"
        );


    const secCartao =
        document.getElementById(
            "sec-cartao"
        );


    if (secao === "login") {

        if (secLogin) {

            secLogin.classList.remove(
                "hidden"
            );
        }


        if (secCartao) {

            secCartao.classList.add(
                "hidden"
            );
        }


    } else if (secao === "cartao") {

        if (secLogin) {

            secLogin.classList.add(
                "hidden"
            );
        }


        if (secCartao) {

            secCartao.classList.remove(
                "hidden"
            );
        }
    }
}


// ==========================================
// ESCAPE HTML
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

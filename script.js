// ==========================================
// LUCAS FRANCA TATTOO
// CARTÃO FIDELIDADE VIP
// ==========================================

const API_URL =
    "https://script.google.com/macros/s/AKfycbyI0svNzI2nIktgvCNTm76FQmBGXk0119W0claQhsf8Jz7XvnXQ9DiT09pZJFoYsgTF/exec";


// ==========================================
// VARIÁVEIS GLOBAIS
// ==========================================

let clienteAtual = null;

let pinAdminAtual = null;

let todosClientes = [];

let monitorCartaoInterval = null;

let monitorCartaoEmAndamento = false;


// ==========================================
// INICIALIZAÇÃO
// ==========================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        const whatsappSalvo =
            localStorage.getItem(
                "fidelidade_whatsapp"
            );

        const nomeSalvo =
            localStorage.getItem(
                "fidelidade_nome"
            );

        const sessaoSalva =
            localStorage.getItem(
                "fidelidade_sessao_ativa"
            );


        // --------------------------------------
        // Restaurar campos
        // --------------------------------------

        const inputTelefone =
            document.getElementById(
                "cli-phone"
            );

        const inputNome =
            document.getElementById(
                "cli-name"
            );


        if (
            inputTelefone &&
            whatsappSalvo
        ) {

            inputTelefone.value =
                whatsappSalvo;
        }


        if (
            inputNome &&
            nomeSalvo
        ) {

            inputNome.value =
                nomeSalvo;
        }


        // --------------------------------------
        // Restaurar sessão
        //
        // Compatibilidade:
        // se o usuário já estava usando a
        // versão antiga, não obrigamos a nova
        // chave de sessão.
        // --------------------------------------

        if (
            whatsappSalvo &&
            (
                sessaoSalva === "true" ||
                sessaoSalva === null
            )
        ) {

            carregarDadosCliente(
                whatsappSalvo,
                nomeSalvo || ""
            );
        }


        // --------------------------------------
        // Enter no telefone
        // --------------------------------------

        if (inputTelefone) {

            inputTelefone.addEventListener(
                "keydown",
                event => {

                    if (
                        event.key === "Enter"
                    ) {

                        event.preventDefault();

                        acessarCartao();
                    }
                }
            );
        }


        // --------------------------------------
        // Enter no nome
        // --------------------------------------

        if (inputNome) {

            inputNome.addEventListener(
                "keydown",
                event => {

                    if (
                        event.key === "Enter"
                    ) {

                        event.preventDefault();

                        acessarCartao();
                    }
                }
            );
        }


        // --------------------------------------
        // Enter no código do estúdio
        // --------------------------------------

        const inputCodigo =
            document.getElementById(
                "input-codigo-resgate"
            );

        if (inputCodigo) {

            inputCodigo.addEventListener(
                "keydown",
                event => {

                    if (
                        event.key === "Enter"
                    ) {

                        event.preventDefault();

                        confirmarResgate();
                    }
                }
            );
        }


        // --------------------------------------
        // Botão acessar
        // --------------------------------------

        const btnAcessar =
            document.getElementById(
                "btn-acessar"
            );

        if (btnAcessar) {

            btnAcessar.addEventListener(
                "click",
                acessarCartao
            );
        }


        // --------------------------------------
        // Botão sair
        // --------------------------------------

        const btnSair =
            document.getElementById(
                "btn-sair"
            );

        if (btnSair) {

            btnSair.addEventListener(
                "click",
                sair
            );
        }


        // --------------------------------------
        // Abrir admin
        // --------------------------------------

        const btnAdmin =
            document.getElementById(
                "btn-admin-toggle"
            );

        if (btnAdmin) {

            btnAdmin.addEventListener(
                "click",
                abrirAdmin
            );
        }


        // --------------------------------------
        // Fechar admin
        // --------------------------------------

        const btnFecharAdmin =
            document.getElementById(
                "btn-fechar-admin"
            );

        if (btnFecharAdmin) {

            btnFecharAdmin.addEventListener(
                "click",
                fecharAdmin
            );
        }


        // --------------------------------------
        // Pesquisa admin
        // --------------------------------------

        const pesquisaAdmin =
            document.getElementById(
                "admin-search"
            );

        if (pesquisaAdmin) {

            pesquisaAdmin.addEventListener(
                "input",
                renderizarClientesAdmin
            );
        }


        // --------------------------------------
        // Abrir resgate
        // --------------------------------------

        const btnAbrirResgate =
            document.getElementById(
                "btn-abrir-resgate"
            );

        if (btnAbrirResgate) {

            btnAbrirResgate.addEventListener(
                "click",
                abrirModalResgate
            );
        }


        // --------------------------------------
        // Cancelar resgate
        // --------------------------------------

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


        // --------------------------------------
        // Confirmar resgate
        // --------------------------------------

        const btnConfirmarResgate =
            document.getElementById(
                "btn-confirmar-resgate"
            );

        if (btnConfirmarResgate) {

            btnConfirmarResgate.addEventListener(
                "click",
                confirmarResgate
            );
        }


        // --------------------------------------
        // Fechar modal clicando fora
        // --------------------------------------

        const modal =
            document.getElementById(
                "modal-resgate"
            );

        if (modal) {

            modal.addEventListener(
                "click",
                event => {

                    if (
                        event.target === modal
                    ) {

                        fecharModalResgate();
                    }
                }
            );
        }
    }
);


// ==========================================
// ACESSAR CARTÃO
// ==========================================

async function acessarCartao() {

    const inputTelefone =
        document.getElementById(
            "cli-phone"
        );

    const inputNome =
        document.getElementById(
            "cli-name"
        );


    const whatsapp =
        limparWhatsApp(
            inputTelefone
                ? inputTelefone.value
                : ""
        );


    const nome =
        inputNome
            ? inputNome.value.trim()
            : "";


    if (!whatsapp) {

        alert(
            "Digite seu WhatsApp."
        );

        if (inputTelefone) {
            inputTelefone.focus();
        }

        return;
    }


    // ------------------------------------------
    // Guardar imediatamente
    // ------------------------------------------

    localStorage.setItem(
        "fidelidade_whatsapp",
        whatsapp
    );

    localStorage.setItem(
        "fidelidade_nome",
        nome
    );

    localStorage.setItem(
        "fidelidade_sessao_ativa",
        "true"
    );


    await carregarDadosCliente(
        whatsapp,
        nome
    );
}


// ==========================================
// CARREGAR DADOS DO CLIENTE
//
// Esta chamada pode criar cliente novo.
// ==========================================

async function carregarDadosCliente(
    whatsapp,
    nome
) {

    whatsapp =
        limparWhatsApp(whatsapp);


    if (!whatsapp) {
        return;
    }


    try {

        const url =
            `${API_URL}` +
            `?action=get_client` +
            `&whatsapp=${encodeURIComponent(whatsapp)}` +
            `&nome=${encodeURIComponent(nome || "")}` +
            `&_ts=${Date.now()}`;


        const response =
            await fetch(
                url,
                {
                    method: "GET",
                    cache: "no-store"
                }
            );


        if (!response.ok) {

            throw new Error(
                "Falha na comunicação com o servidor."
            );
        }


        const data =
            await response.json();


        if (
            data.success === false
        ) {

            limparSessaoCliente();

            alert(
                data.error ||
                "Não foi possível carregar seu cartão."
            );

            alternarSecao(
                "login"
            );

            return;
        }


        clienteAtual = {

            whatsapp:
                data.whatsapp ||
                whatsapp,

            nome:
                data.nome ||
                nome ||
                "Cliente",

            carimbos:
                Number(
                    data.carimbos
                ) || 0,

            ultimaVisita:
                data.ultimaVisita ||
                ""
        };


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


        atualizarInterfaceCartao(
            clienteAtual.nome,
            clienteAtual.carimbos
        );


        alternarSecao(
            "cartao"
        );


        iniciarMonitorCartao();

    } catch (error) {

        console.error(
            "Erro ao carregar cliente:",
            error
        );

        alert(
            "Não foi possível conectar ao cartão agora. Tente novamente."
        );
    }
}


// ==========================================
// MONITORAMENTO AUTOMÁTICO
//
// Consulta o servidor a cada 3 segundos.
//
// IMPORTANTE:
// usa check_client,
// que NÃO cria cliente novo.
// ==========================================

function iniciarMonitorCartao() {

    pararMonitorCartao();


    if (
        !clienteAtual ||
        !clienteAtual.whatsapp
    ) {

        return;
    }


    // Fazer uma verificação imediatamente
    verificarAlteracaoCartao();


    // Depois continuar verificando
    monitorCartaoInterval =
        setInterval(
            verificarAlteracaoCartao,
            3000
        );
}


// ==========================================
// PARAR MONITORAMENTO
// ==========================================

function pararMonitorCartao() {

    if (
        monitorCartaoInterval
    ) {

        clearInterval(
            monitorCartaoInterval
        );

        monitorCartaoInterval =
            null;
    }
}


// ==========================================
// VERIFICAR ALTERAÇÃO DO CARTÃO
// ==========================================

async function verificarAlteracaoCartao() {

    if (
        !clienteAtual ||
        !clienteAtual.whatsapp
    ) {

        return;
    }


    if (
        monitorCartaoEmAndamento
    ) {

        return;
    }


    monitorCartaoEmAndamento =
        true;


    try {

        const url =
            `${API_URL}` +
            `?action=check_client` +
            `&whatsapp=${encodeURIComponent(clienteAtual.whatsapp)}` +
            `&_ts=${Date.now()}`;


        const response =
            await fetch(
                url,
                {
                    method: "GET",
                    cache: "no-store"
                }
            );


        if (!response.ok) {

            return;
        }


        const data =
            await response.json();


        // --------------------------------------
        // Cliente excluído
        // --------------------------------------

        if (
            data.success === false
        ) {

            pararMonitorCartao();

            limparSessaoCliente();


            alert(
                data.error ||
                "Seu cadastro não foi encontrado."
            );


            alternarSecao(
                "login"
            );


            return;
        }


        const novosCarimbos =
            Number(
                data.carimbos
            ) || 0;


        const carimbosAtuais =
            Number(
                clienteAtual.carimbos
            ) || 0;


        // --------------------------------------
        // Atualizar somente se mudou
        // --------------------------------------

        if (
            novosCarimbos !==
            carimbosAtuais
        ) {

            clienteAtual.carimbos =
                novosCarimbos;


            atualizarInterfaceCartao(
                clienteAtual.nome,
                novosCarimbos
            );
        }


        // --------------------------------------
        // Atualizar nome caso tenha mudado
        // --------------------------------------

        if (
            data.nome &&
            data.nome !==
            clienteAtual.nome
        ) {

            clienteAtual.nome =
                data.nome;


            localStorage.setItem(
                "fidelidade_nome",
                data.nome
            );


            atualizarInterfaceCartao(
                data.nome,
                novosCarimbos
            );
        }


        // --------------------------------------
        // Atualizar última visita
        // --------------------------------------

        if (
            data.ultimaVisita
        ) {

            clienteAtual.ultimaVisita =
                data.ultimaVisita;
        }

    } catch (error) {

        // --------------------------------------
        // Não mostrar alerta a cada erro de
        // internet. O monitoramento continuará.
        // --------------------------------------

        console.error(
            "Erro ao verificar atualização do cartão:",
            error
        );

    } finally {

        monitorCartaoEmAndamento =
            false;
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


    if (carimbos < 0) {
        carimbos = 0;
    }


    if (
        carimbos >
        2
    ) {

        carimbos = 2;
    }


    // ------------------------------------------
    // Nome
    // ------------------------------------------

    const displayNome =
        document.getElementById(
            "disp-nome"
        );

    if (displayNome) {

        displayNome.textContent =
            nome ||
            "Cliente";
    }


    // ------------------------------------------
    // Carimbos
    // ------------------------------------------

    for (
        let i = 1;
        i <= 3;
        i++
    ) {

        const slot =
            document.getElementById(
                `slot-${i}`
            );

        if (!slot) {
            continue;
        }


        if (
            i <= carimbos
        ) {

            slot.classList.add(
                "filled"
            );

        } else {

            slot.classList.remove(
                "filled"
            );
        }
    }


    // ------------------------------------------
    // Texto de desconto
    // ------------------------------------------

    const displayDesconto =
        document.getElementById(
            "disp-desconto"
        );


    if (displayDesconto) {

        if (
            carimbos >= 2
        ) {

            displayDesconto.textContent =
                "🎁 Desconto liberado!";

        } else {

            displayDesconto.textContent =
                `Faltam ${
                    2 - carimbos
                } carimbo${
                    (2 - carimbos) === 1
                        ? ""
                        : "s"
                } para liberar o desconto.`;
        }
    }


    // ------------------------------------------
    // Botão principal
    // ------------------------------------------

    const btnResgate =
        document.getElementById(
            "btn-abrir-resgate"
        );


    if (btnResgate) {

        if (
            carimbos >= 2
        ) {

            btnResgate.innerHTML =
                "🔄 Reiniciar Cartão";

        } else {

            btnResgate.innerHTML =
                "🔑 Digitar Código do Estúdio";
        }
    }
}


// ==========================================
// ABRIR MODAL DE RESGATE
// ==========================================

function abrirModalResgate() {

    if (!clienteAtual) {

        alert(
            "Faça login no cartão primeiro."
        );

        return;
    }


    const modal =
        document.getElementById(
            "modal-resgate"
        );


    const titulo =
        document.getElementById(
            "titulo-resgate"
        );


    const descricao =
        modal
            ? modal.querySelector(
                ".modal-description"
            )
            : null;


    const expire =
        modal
            ? modal.querySelector(
                ".modal-expire"
            )
            : null;


    const input =
        document.getElementById(
            "input-codigo-resgate"
        );


    if (!modal) {
        return;
    }


    const carimbos =
        Number(
            clienteAtual.carimbos
        ) || 0;


    // ------------------------------------------
    // Texto do modal
    // ------------------------------------------

    if (
        carimbos >= 2
    ) {

        if (titulo) {

            titulo.textContent =
                "Reiniciar cartão";
        }


        if (descricao) {

            descricao.textContent =
                "Digite o código de 4 dígitos fornecido pelo estúdio para resgatar seu desconto e iniciar um novo ciclo.";
        }

    } else {

        if (titulo) {

            titulo.textContent =
                "Código do Estúdio";
        }


        if (descricao) {

            descricao.textContent =
                "Digite o código de 4 dígitos fornecido pelo estúdio para adicionar um carimbo ao seu cartão.";
        }
    }


    if (expire) {

        expire.textContent =
            "O código é válido por 60 segundos.";
    }


    if (input) {

        input.value = "";

        input.focus();
    }


    modal.classList.add(
        "active"
    );
}


// ==========================================
// FECHAR MODAL
// ==========================================

function fecharModalResgate() {

    const modal =
        document.getElementById(
            "modal-resgate"
        );


    if (modal) {

        modal.classList.remove(
            "active"
        );
    }
}


// ==========================================
// CONFIRMAR RESGATE
// ==========================================

async function confirmarResgate() {

    if (!clienteAtual) {

        alert(
            "Faça login no cartão primeiro."
        );

        return;
    }


    const input =
        document.getElementById(
            "input-codigo-resgate"
        );


    if (!input) {
        return;
    }


    const codigo =
        input.value
            .replace(/\D/g, "")
            .trim();


    if (
        codigo.length !== 4
    ) {

        alert(
            "Digite o código de 4 dígitos."
        );

        input.focus();

        return;
    }


    const btn =
        document.getElementById(
            "btn-confirmar-resgate"
        );


    const textoOriginal =
        btn
            ? btn.textContent
            : "";


    if (btn) {

        btn.disabled = true;

        btn.textContent =
            "Verificando...";
    }


    try {

        const url =
            `${API_URL}` +
            `?action=redeem_token` +
            `&whatsapp=${encodeURIComponent(clienteAtual.whatsapp)}` +
            `&codigo=${encodeURIComponent(codigo)}` +
            `&_ts=${Date.now()}`;


        const response =
            await fetch(
                url,
                {
                    method: "GET",
                    cache: "no-store"
                }
            );


        if (!response.ok) {

            throw new Error(
                "Falha na comunicação com o servidor."
            );
        }


        const data =
            await response.json();


        if (
            data.success === false
        ) {

            alert(
                data.error ||
                "Código inválido ou expirado."
            );

            return;
        }


        // --------------------------------------
        // Atualizar imediatamente
        // sem reload
        // --------------------------------------

        clienteAtual.carimbos =
            Number(
                data.carimbos
            ) || 0;


        if (data.nome) {

            clienteAtual.nome =
                data.nome;

            localStorage.setItem(
                "fidelidade_nome",
                data.nome
            );
        }


        atualizarInterfaceCartao(
            clienteAtual.nome,
            clienteAtual.carimbos
        );


        fecharModalResgate();


        // --------------------------------------
        // Mensagem de acordo com resultado
        // --------------------------------------

        if (
            data.cicloResetado
        ) {

            alert(
                data.mensagem ||
                "Desconto resgatado! Novo ciclo iniciado."
            );

        } else {

            alert(
                "Carimbo adicionado com sucesso!"
            );
        }

    } catch (error) {

        console.error(
            "Erro ao resgatar código:",
            error
        );


        alert(
            "Não foi possível validar o código agora. Tente novamente."
        );

    } finally {

        if (btn) {

            btn.disabled = false;

            btn.textContent =
                textoOriginal;
        }
    }
}


// ==========================================
// SAIR
// ==========================================

function sair() {

    pararMonitorCartao();


    clienteAtual =
        null;


    localStorage.removeItem(
        "fidelidade_whatsapp"
    );

    localStorage.removeItem(
        "fidelidade_nome"
    );

    localStorage.removeItem(
        "fidelidade_sessao_ativa"
    );


    const inputTelefone =
        document.getElementById(
            "cli-phone"
        );

    const inputNome =
        document.getElementById(
            "cli-name"
        );


    if (inputTelefone) {
        inputTelefone.value = "";
    }


    if (inputNome) {
        inputNome.value = "";
    }


    alternarSecao(
        "login"
    );
}


// ==========================================
// LIMPAR SESSÃO DO CLIENTE
// ==========================================

function limparSessaoCliente() {

    pararMonitorCartao();


    clienteAtual =
        null;


    localStorage.removeItem(
        "fidelidade_whatsapp"
    );

    localStorage.removeItem(
        "fidelidade_nome"
    );

    localStorage.removeItem(
        "fidelidade_sessao_ativa"
    );
}


// ==========================================
// ALTERNAR SEÇÕES
// ==========================================

function alternarSecao(
    secao
) {

    const secaoLogin =
        document.getElementById(
            "sec-login"
        );

    const secaoCartao =
        document.getElementById(
            "sec-cartao"
        );

    const secaoAdmin =
        document.getElementById(
            "sec-admin"
        );


    if (secaoLogin) {

        secaoLogin.style.display =
            secao === "login"
                ? ""
                : "none";
    }


    if (secaoCartao) {

        secaoCartao.style.display =
            secao === "cartao"
                ? ""
                : "none";
    }


    if (secaoAdmin) {

        secaoAdmin.style.display =
            secao === "admin"
                ? ""
                : "none";
    }
}


// ==========================================
// ABRIR ADMIN
// ==========================================

async function abrirAdmin() {

    const senha =
        prompt(
            "Digite a senha do estúdio:"
        );


    if (senha === null) {
        return;
    }


    if (
        senha !== "1183"
    ) {

        alert(
            "Senha incorreta."
        );

        return;
    }


    pinAdminAtual =
        senha;


    alternarSecao(
        "admin"
    );


    await carregarClientesAdmin();
}


// ==========================================
// FECHAR ADMIN
// ==========================================

function fecharAdmin() {

    pinAdminAtual =
        null;


    alternarSecao(
        clienteAtual
            ? "cartao"
            : "login"
    );
}


// ==========================================
// CARREGAR CLIENTES ADMIN
// ==========================================

async function carregarClientesAdmin() {

    if (!pinAdminAtual) {
        return;
    }


    const lista =
        document.getElementById(
            "lista-clientes-admin"
        );


    if (lista) {

        lista.innerHTML =
            `
                <div class="admin-loading">
                    Carregando clientes...
                </div>
            `;
    }


    try {

        const url =
            `${API_URL}` +
            `?action=get_all` +
            `&pin=${encodeURIComponent(pinAdminAtual)}` +
            `&_ts=${Date.now()}`;


        const response =
            await fetch(
                url,
                {
                    method: "GET",
                    cache: "no-store"
                }
            );


        if (!response.ok) {

            throw new Error(
                "Erro ao consultar clientes."
            );
        }


        const data =
            await response.json();


        if (
            data.success === false
        ) {

            alert(
                data.error ||
                "Não foi possível carregar os clientes."
            );

            return;
        }


        todosClientes =
            Array.isArray(
                data.clients
            )
                ? data.clients
                : [];


        renderizarClientesAdmin();

    } catch (error) {

        console.error(
            "Erro no painel admin:",
            error
        );


        if (lista) {

            lista.innerHTML =
                `
                    <div class="admin-loading">
                        Não foi possível carregar os clientes.
                    </div>
                `;
        }


        alert(
            "Erro ao carregar a lista de clientes."
        );
    }
}


// ==========================================
// RENDERIZAR CLIENTES ADMIN
// ==========================================

function renderizarClientesAdmin() {

    const lista =
        document.getElementById(
            "lista-clientes-admin"
        );


    if (!lista) {
        return;
    }


    const pesquisa =
        (
            document.getElementById(
                "admin-search"
            )?.value ||
            ""
        )
            .trim()
            .toLowerCase();


    let clientes =
        todosClientes.slice();


    // ------------------------------------------
    // Filtrar
    // ------------------------------------------

    if (pesquisa) {

        clientes =
            clientes.filter(
                cliente => {

                    const nome =
                        String(
                            cliente.nome ||
                            ""
                        )
                            .toLowerCase();


                    const whatsapp =
                        String(
                            cliente.whatsapp ||
                            ""
                        )
                            .toLowerCase();


                    return (
                        nome.includes(
                            pesquisa
                        ) ||
                        whatsapp.includes(
                            pesquisa
                        )
                    );
                }
            );
    }


    // ------------------------------------------
    // Ordenar
    // ------------------------------------------

    clientes.sort(
        (a, b) => {

            const nomeA =
                String(
                    a.nome ||
                    ""
                ).toLowerCase();


            const nomeB =
                String(
                    b.nome ||
                    ""
                ).toLowerCase();


            return nomeA.localeCompare(
                nomeB,
                "pt-BR"
            );
        }
    );


    // ------------------------------------------
    // Nenhum cliente
    // ------------------------------------------

    if (!clientes.length) {

        lista.innerHTML =
            `
                <div class="admin-loading">
                    Nenhum cliente encontrado.
                </div>
            `;

        return;
    }


    // ------------------------------------------
    // Montar lista
    // ------------------------------------------

    lista.innerHTML =
        clientes
            .map(
                cliente =>
                    criarCardAdmin(
                        cliente
                    )
            )
            .join("");
}


// ==========================================
// CRIAR CARD ADMIN
// ==========================================

function criarCardAdmin(
    cliente
) {

    const whatsapp =
        String(
            cliente.whatsapp ||
            ""
        );


    const nome =
        cliente.nome ||
        "Cliente";


    const carimbos =
        Number(
            cliente.carimbos
        ) || 0;


    const ultimaVisita =
        cliente.ultimaVisita ||
        "Primeira visita";


    return `
        <div class="admin-client-card">

            <div class="admin-client-info">

                <div class="admin-client-name">
                    ${escapeHTML(nome)}
                </div>

                <div class="admin-client-phone">
                    ${escapeHTML(
                        formatarWhatsApp(
                            whatsapp
                        )
                    )}
                </div>

                <div class="admin-client-visit">
                    Última visita:
                    ${escapeHTML(
                        ultimaVisita
                    )}
                </div>

            </div>


            <div class="admin-client-stamps">

                <div class="admin-stamp-count">
                    ${carimbos}/2
                </div>

                <div class="admin-stamp-label">
                    carimbos
                </div>

            </div>


            <div class="admin-client-actions">

                <button
                    type="button"
                    class="admin-action-btn"
                    onclick="gerarCodigoAdmin('${escapeJS(whatsapp)}')"
                >
                    Código
                </button>


                <button
                    type="button"
                    class="admin-action-btn"
                    onclick="carimboDiretoAdmin('${escapeJS(whatsapp)}', '${escapeJS(nome)}')"
                >
                    + Carimbo
                </button>


                <button
                    type="button"
                    class="admin-action-btn danger"
                    onclick="excluirClienteAdmin('${escapeJS(whatsapp)}')"
                >
                    Excluir
                </button>

            </div>

        </div>
    `;
}


// ==========================================
// GERAR CÓDIGO PELO ADMIN
// ==========================================

async function gerarCodigoAdmin(
    whatsapp
) {

    if (!pinAdminAtual) {

        alert(
            "Painel administrativo não está autenticado."
        );

        return;
    }


    try {

        const url =
            `${API_URL}` +
            `?action=generate_token` +
            `&whatsapp=${encodeURIComponent(whatsapp)}` +
            `&pin=${encodeURIComponent(pinAdminAtual)}` +
            `&_ts=${Date.now()}`;


        const response =
            await fetch(
                url,
                {
                    method: "GET",
                    cache: "no-store"
                }
            );


        if (!response.ok) {

            throw new Error(
                "Erro ao gerar código."
            );
        }


        const data =
            await response.json();


        if (
            data.success === false
        ) {

            alert(
                data.error ||
                "Não foi possível gerar o código."
            );

            return;
        }


        // --------------------------------------
        // Mostrar código
        // --------------------------------------

        alert(
            `Código do estúdio: ${data.codigo}\n\n` +
            `Válido por 60 segundos.`
        );

    } catch (error) {

        console.error(
            "Erro ao gerar código:",
            error
        );


        alert(
            "Não foi possível gerar o código."
        );
    }
}


// ==========================================
// CARIMBO DIRETO PELO ADMIN
// ==========================================

async function carimboDiretoAdmin(
    whatsapp,
    nome
) {

    if (!pinAdminAtual) {

        alert(
            "Painel administrativo não está autenticado."
        );

        return;
    }


    const confirmar =
        confirm(
            `Adicionar carimbo para ${nome}?`
        );


    if (!confirmar) {
        return;
    }


    try {

        const url =
            `${API_URL}` +
            `?action=add_stamp` +
            `&whatsapp=${encodeURIComponent(whatsapp)}` +
            `&nome=${encodeURIComponent(nome || "")}` +
            `&pin=${encodeURIComponent(pinAdminAtual)}` +
            `&_ts=${Date.now()}`;


        const response =
            await fetch(
                url,
                {
                    method: "GET",
                    cache: "no-store"
                }
            );


        if (!response.ok) {

            throw new Error(
                "Erro ao adicionar carimbo."
            );
        }


        const data =
            await response.json();


        if (
            data.success === false
        ) {

            alert(
                data.error ||
                "Não foi possível adicionar o carimbo."
            );

            return;
        }


        // --------------------------------------
        // Atualizar lista admin imediatamente
        // --------------------------------------

        const cliente =
            todosClientes.find(
                item =>
                    limparWhatsApp(
                        item.whatsapp
                    ) ===
                    limparWhatsApp(
                        whatsapp
                    )
            );


        if (cliente) {

            cliente.carimbos =
                Number(
                    data.carimbos
                ) || 0;

            cliente.ultimaVisita =
                data.ultimaVisita ||
                cliente.ultimaVisita;
        }


        renderizarClientesAdmin();


        // --------------------------------------
        // Se for o mesmo cliente neste navegador,
        // atualizar imediatamente também.
        // --------------------------------------

        if (
            clienteAtual &&
            limparWhatsApp(
                clienteAtual.whatsapp
            ) ===
            limparWhatsApp(
                whatsapp
            )
        ) {

            clienteAtual.carimbos =
                Number(
                    data.carimbos
                ) || 0;


            atualizarInterfaceCartao(
                clienteAtual.nome,
                clienteAtual.carimbos
            );
        }


        // --------------------------------------
        // Mensagem
        // --------------------------------------

        if (
            data.cicloResetado
        ) {

            alert(
                data.mensagem ||
                "Desconto resgatado! Novo ciclo iniciado."
            );

        } else {

            alert(
                "Carimbo adicionado com sucesso!"
            );
        }

    } catch (error) {

        console.error(
            "Erro ao adicionar carimbo:",
            error
        );


        alert(
            "Não foi possível adicionar o carimbo."
        );
    }
}


// ==========================================
// EXCLUIR CLIENTE PELO ADMIN
// ==========================================

async function excluirClienteAdmin(
    whatsapp
) {

    if (!pinAdminAtual) {

        alert(
            "Painel administrativo não está autenticado."
        );

        return;
    }


    const cliente =
        todosClientes.find(
            item =>
                limparWhatsApp(
                    item.whatsapp
                ) ===
                limparWhatsApp(
                    whatsapp
                )
        );


    const nome =
        cliente?.nome ||
        "este cliente";


    const confirmar =
        confirm(
            `Tem certeza que deseja excluir ${nome}?\n\n` +
            `O cliente não será recriado automaticamente ao atualizar a página.`
        );


    if (!confirmar) {
        return;
    }


    try {

        const url =
            `${API_URL}` +
            `?action=delete_client` +
            `&whatsapp=${encodeURIComponent(whatsapp)}` +
            `&pin=${encodeURIComponent(pinAdminAtual)}` +
            `&_ts=${Date.now()}`;


        const response =
            await fetch(
                url,
                {
                    method: "GET",
                    cache: "no-store"
                }
            );


        if (!response.ok) {

            throw new Error(
                "Erro ao excluir cliente."
            );
        }


        const data =
            await response.json();


        if (
            data.success === false
        ) {

            alert(
                data.error ||
                "Não foi possível excluir o cliente."
            );

            return;
        }


        // --------------------------------------
        // Remover da lista local
        // --------------------------------------

        todosClientes =
            todosClientes.filter(
                item =>
                    limparWhatsApp(
                        item.whatsapp
                    ) !==
                    limparWhatsApp(
                        whatsapp
                    )
            );


        renderizarClientesAdmin();


        // --------------------------------------
        // Se era o cliente logado neste navegador,
        // encerrar sessão.
        // --------------------------------------

        if (
            clienteAtual &&
            limparWhatsApp(
                clienteAtual.whatsapp
            ) ===
            limparWhatsApp(
                whatsapp
            )
        ) {

            limparSessaoCliente();

            alternarSecao(
                "login"
            );
        }


        alert(
            "Cliente excluído com sucesso."
        );

    } catch (error) {

        console.error(
            "Erro ao excluir cliente:",
            error
        );


        alert(
            "Não foi possível excluir o cliente."
        );
    }
}


// ==========================================
// LIMPAR WHATSAPP
// ==========================================

function limparWhatsApp(
    valor
) {

    if (!valor) {
        return "";
    }

    return String(valor)
        .replace(/\D/g, "");
}


// ==========================================
// FORMATAR WHATSAPP
// ==========================================

function formatarWhatsApp(
    valor
) {

    const numero =
        limparWhatsApp(
            valor
        );


    if (
        numero.length === 11
    ) {

        return (
            "(" +
            numero.substring(0, 2) +
            ") " +
            numero.substring(2, 7) +
            "-" +
            numero.substring(7)
        );
    }


    if (
        numero.length === 10
    ) {

        return (
            "(" +
            numero.substring(0, 2) +
            ") " +
            numero.substring(2, 6) +
            "-" +
            numero.substring(6)
        );
    }


    return numero;
}


// ==========================================
// ESCAPE HTML
// ==========================================

function escapeHTML(
    value
) {

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


// ==========================================
// ESCAPE PARA JAVASCRIPT INLINE
// ==========================================

function escapeJS(
    value
) {

    return String(value)
        .replace(
            /\\/g,
            "\\\\"
        )
        .replace(
            /'/g,
            "\\'"
        )
        .replace(
            /"/g,
            '\\"'
        )
        .replace(
            /\r/g,
            "\\r"
        )
        .replace(
            /\n/g,
            "\\n"
        );
}

// ==========================================
// CONFIGURAÇÃO DA API (GOOGLE APPS SCRIPT)
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
// FUNÇÃO CENTRAL PARA LIMPAR SESSÃO
// ==========================================

function limparSessaoCliente() {

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
    const inputPhone = document.getElementById("cli-phone");
    const inputName = document.getElementById("cli-name");

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

    const inputPhone = document.getElementById("cli-phone");
    const inputName = document.getElementById("cli-name");

    const localPhone = localStorage.getItem("fidelidade_whatsapp");
    const localName = localStorage.getItem("fidelidade_nome");
    const sessaoAtiva = localStorage.getItem("fidelidade_sessao_ativa");

    // =====================================================
    // RESTAURA LOGIN SOMENTE SE A SESSÃO ESTIVER ATIVA
    // =====================================================

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
    // LOGIN
    // ==========================================

    const btnAcessar = document.getElementById("btn-acessar");

    if (btnAcessar) {

        btnAcessar.addEventListener(
            "click",
            acessarCartao
        );
    }


    // ==========================================
    // SAIR
    // ==========================================

    const btnSair = document.getElementById("btn-sair");

    if (btnSair) {

        btnSair.addEventListener(
            "click",
            sair
        );
    }


    // ==========================================
    // ADMIN
    // ==========================================

    const btnAdmin = document.getElementById("btn-admin-toggle");

    if (btnAdmin) {

        btnAdmin.addEventListener(
            "click",
            promptAdmin
        );
    }


    const btnFecharAdmin = document.getElementById(
        "btn-fechar-admin"
    );

    if (btnFecharAdmin) {

        btnFecharAdmin.addEventListener(
            "click",
            fecharAdmin
        );
    }


    const adminSearch = document.getElementById(
        "admin-search"
    );

    if (adminSearch) {

        adminSearch.addEventListener(
            "input",
            filtrarClientes
        );
    }


    // ==========================================
    // MODAL DE CÓDIGO
    // ==========================================

    const btnAbrirResgate = document.getElementById(
        "btn-abrir-resgate"
    );

    if (btnAbrirResgate) {

        btnAbrirResgate.addEventListener(
            "click",
            abrirModalResgate
        );
    }


    const btnCancelarResgate = document.getElementById(
        "btn-cancelar-resgate"
    );

    if (btnCancelarResgate) {

        btnCancelarResgate.addEventListener(
            "click",
            fecharModalResgate
        );
    }


    const btnConfirmarResgate = document.getElementById(
        "btn-confirmar-resgate"
    );

    if (btnConfirmarResgate) {

        btnConfirmarResgate.addEventListener(
            "click",
            confirmarResgateCodigo
        );
    }

});


// ==========================================
// ACESSAR CARTÃO
// ==========================================

async function acessarCartao(event) {

    if (event) {
        event.preventDefault();
    }

    const inputPhone = document.getElementById(
        "cli-phone"
    );

    const inputName = document.getElementById(
        "cli-name"
    );


    const phone = inputPhone
        ? inputPhone.value.replace(/\D/g, "")
        : "";


    const name = inputName
        ? inputName.value.trim()
        : "";


    if (!phone) {

        alert(
            "Digite o número do seu WhatsApp."
        );

        return;
    }


    // =====================================================
    // NÃO SALVA A SESSÃO AINDA.
    //
    // Primeiro a API precisa confirmar que o cliente existe.
    // =====================================================

    await carregarDadosCliente(
        phone,
        name,
        false
    );
}


// ==========================================
// BUSCAR DADOS DO CLIENTE
// ==========================================

async function carregarDadosCliente(
    phone,
    name = "",
    restaurandoSessao = false
) {

    const btnAcessar = document.getElementById(
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


        const response = await fetch(url);


        if (!response.ok) {

            throw new Error(
                "HTTP " + response.status
            );
        }


        const data = await response.json();


        // ==========================================
        // CLIENTE NÃO ENCONTRADO
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
        // CLIENTE ENCONTRADO
        // ==========================================

        clienteAtual = {

            whatsapp:
                data.whatsapp ||
                phone,

            nome:
                data.nome ||
                name ||
                "Cliente",

            carimbos:
                Number(data.carimbos) || 0
        };


        // ==========================================
        // AGORA SIM A SESSÃO É SALVA
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


        // ==========================================
        // MOSTRA CARTÃO
        // ==========================================

        alternarSecao(
            "cartao"
        );


    } catch (error) {

        console.error(
            "Erro ao carregar cliente:",
            error
        );


        // Se foi uma tentativa de restaurar
        // uma sessão antiga e houve erro,
        // não deixa uma sessão quebrada presa.

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

            alternarSecao(
                "login"
            );
        }


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
        document.getElementById(
            "disp-nome"
        );


    const dispDesconto =
        document.getElementById(
            "disp-desconto"
        );


    const btnCodigo =
        document.getElementById(
            "btn-abrir-resgate"
        );


    if (dispNome) {

        dispNome.innerText =
            nome || "Cliente";
    }


    // ==========================================
    // O MESMO BOTÃO MUDA CONFORME O CICLO
    //
    // 0 ou 1 carimbo:
    // 🔑 Digitar Código do Estúdio
    //
    // 2 carimbos:
    // 🔄 Reiniciar Cartão
    // ==========================================

    if (btnCodigo) {

        if (carimbos >= 2) {

            btnCodigo.innerText =
                "🔄 Reiniciar Cartão";

            btnCodigo.title =
                "Digite o código do estúdio para resgatar o desconto e reiniciar o cartão";

        } else {

            btnCodigo.innerText =
                "🔑 Digitar Código do Estúdio";

            btnCodigo.title =
                "Digite o código temporário fornecido pelo tatuador";
        }
    }


    // ==========================================
    // STATUS DO BENEFÍCIO
    // ==========================================

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


    // ==========================================
    // SLOTS
    // ==========================================

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


// ==========================================
// ATUALIZAR SLOT
// ==========================================

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
        slot.querySelector(
            ".icon"
        );


    if (iconSpan) {

        iconSpan.innerHTML =
            ativo
                ? iconeAtivo
                : iconeInativo;
    }
}


// ==========================================
// MODAL DE CÓDIGO
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


    const aviso =
        modal
            ? modal.querySelector(
                ".modal-expire"
            )
            : null;


    const botaoConfirmar =
        document.getElementById(
            "btn-confirmar-resgate"
        );


    const cicloCompleto =
        !!clienteAtual &&
        Number(clienteAtual.carimbos) >= 2;


    // ==========================================
    // TÍTULO
    // ==========================================

    if (titulo) {

        titulo.innerText =
            cicloCompleto
                ? "Reiniciar Cartão"
                : "Código do Estúdio";
    }


    // ==========================================
    // DESCRIÇÃO
    // ==========================================

    if (descricao) {

        descricao.innerText =
            cicloCompleto

                ? "Digite o código de 4 dígitos fornecido pelo tatuador para resgatar seu desconto e reiniciar o cartão."

                : "Digite o código de 4 dígitos fornecido pelo tatuador para registrar sua tattoo.";
    }


    // ==========================================
    // AVISO
    // ==========================================

    if (aviso) {

        aviso.innerText =
            "O código é temporário e pode ser usado uma única vez.";
    }


    // ==========================================
    // BOTÃO DO MODAL
    // ==========================================

    if (botaoConfirmar) {

        botaoConfirmar.innerText =
            cicloCompleto
                ? "Reiniciar Cartão"
                : "Confirmar Código";
    }


    // ==========================================
    // ABRIR MODAL
    // ==========================================

    if (modal) {

        modal.classList.remove(
            "hidden"
        );


        modal.setAttribute(
            "aria-hidden",
            "false"
        );
    }


    // ==========================================
    // LIMPAR E FOCAR INPUT
    // ==========================================

    if (inputCodigo) {

        inputCodigo.value = "";

        inputCodigo.focus();
    }
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

        modal.classList.add(
            "hidden"
        );


        modal.setAttribute(
            "aria-hidden",
            "true"
        );
    }
}


// ==========================================
// CONFIRMAR CÓDIGO
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

            btnConfirmar.innerText =
                "Validando...";
        }


        const url =
            `${API_URL}?action=redeem_token` +
            `&whatsapp=${encodeURIComponent(clienteAtual.whatsapp)}` +
            `&codigo=${encodeURIComponent(codigo)}`;


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


        // ==========================================
        // RESET DO CICLO
        // ==========================================

        if (data.cicloResetado) {

            alert(
                "🎉 Desconto resgatado com sucesso!\n\n" +
                "O seu cartão foi reiniciado para o próximo ciclo."
            );
        }


        // ==========================================
        // LIBEROU DESCONTO
        // ==========================================

        else if (data.descontoLiberado) {

            alert(
                "🎉 Carimbo adicionado!\n\n" +
                "Você liberou 10% de desconto para a próxima tattoo!"
            );
        }


        // ==========================================
        // CARIMBO NORMAL
        // ==========================================

        else {

            alert(
                "✅ Carimbo adicionado com sucesso!"
            );
        }


        // ==========================================
        // ATUALIZA CARTÃO
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


            if (clienteAtual) {

                btnConfirmar.innerText =
                    Number(clienteAtual.carimbos) >= 2
                        ? "Reiniciar Cartão"
                        : "Confirmar Código";
            }
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
// PAINEL ADMIN - RENDERIZAR CLIENTES
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


    lista.forEach(
        (cliente) => {

            const item =
                document.createElement(
                    "div"
                );


            item.className =
                "client-item";


            const nome =
                cliente.nome ||
                "Cliente";


            const whatsapp =
                String(
                    cliente.whatsapp ||
                    ""
                );


            const carimbos =
                Number(
                    cliente.carimbos
                ) || 0;


            item.innerHTML = `
                <div class="client-info">

                    <strong>
                        ${escapeHTML(nome)}
                    </strong>

                    <span>
                        ${escapeHTML(whatsapp)}
                        |
                        ${carimbos}/2 carimbos
                    </span>

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
            // GERAR CÓDIGO
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
            // CARIMBO DIRETO
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
            // EXCLUIR
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


            container.appendChild(
                item
            );
        }
    );
}


// ==========================================
// ADMIN - GERAR CÓDIGO TEMPORÁRIO
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
            `&whatsapp=${encodeURIComponent(whatsapp)}` +
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
// ADMIN - CARIMBO DIRETO
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
            `&whatsapp=${encodeURIComponent(whatsapp)}` +
            `&nome=${encodeURIComponent(nome)}` +
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


        // ==========================================
        // SE FOR O CLIENTE ATUAL
        // ATUALIZA O CARTÃO TAMBÉM
        // ==========================================

        if (
            clienteAtual &&
            String(clienteAtual.whatsapp) === String(whatsapp)
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
// ADMIN - EXCLUIR CLIENTE
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
            `${API_URL}?action=delete_client` +
            `&whatsapp=${encodeURIComponent(whatsapp)}` +
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
            String(clienteAtual.whatsapp) === String(whatsapp);


        if (clienteExcluidoEhAtual) {

            // ==========================================
            // LIMPA COMPLETAMENTE A SESSÃO
            // ==========================================

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
// ADMIN - ATUALIZAR PAINEL
// ==========================================

async function atualizarPainelAdmin() {

    if (!pinAdminAtual) {

        return;
    }


    try {

        const url =
            `${API_URL}?action=get_all` +
            `&pin=${encodeURIComponent(pinAdminAtual)}`;


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

function alternarSecao(
    secao
) {

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


    } else if (
        secao === "cartao"
    ) {

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

// ==========================================
// CONFIGURAÇÃO DA API
// CARTÃO FIDELIDADE - LUCAS FRANCA TATTOO
// ==========================================

const API_URL =
    "https://script.google.com/macros/s/AKfycbyI0svNzI2nIktgvCNTm76FQmBGXk0119W0claQhsf8Jz7XvnXQ9DiT09pZJFoYsgTF/exec";


// ==========================================
// CONFIGURAÇÕES
// ==========================================

// Verifica a existência do cliente e atualiza
// os carimbos a cada 5 segundos.
const INTERVALO_MONITORAMENTO =
    10000;


// ==========================================
// SVGs
// ==========================================

const SVG_CHECK =
    `<svg xmlns="http://www.w3.org/2000/svg" height="28px" viewBox="0 -960 960 960" width="28px" fill="currentColor"><path d="m424-312 282-282-56-56-226 226-114-114-56 56 170 170ZM200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h560q33 0 56.5 23.5T840-760v560q0 33-23.5 56.5T760-120H200Z"/></svg>`;

const SVG_CIRCLE =
    `<svg xmlns="http://www.w3.org/2000/svg" height="28px" viewBox="0 -960 960 960" width="28px" fill="currentColor"><path d="M480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z"/></svg>`; 
 
 
// ========================================== 
// VARIÁVEIS GLOBAIS 
// ========================================== 
 
let clienteAtual = null; 
let pinAdminAtual = null; 
let todosClientes = []; 
 
let monitoramentoCliente = null; 
let verificacaoEmAndamento = false; 
 
// ========================================== 
// INSTALAÇÃO PWA 
// ========================================== 
 
let deferredPrompt = null; 
 
 
window.addEventListener( 
    "beforeinstallprompt", 
    (event) => { 
 
        event.preventDefault(); 
 
        deferredPrompt = event; 
    } 
); 
 
 
window.addEventListener( 
    "appinstalled", 
    () => { 
 
        deferredPrompt = null; 
    } 
); 
 
 
// ========================================== 
// INICIALIZAÇÃO 
// ========================================== 
 
window.addEventListener( 
    "DOMContentLoaded", 
    () => { 
 
        const inputPhone = 
            document.getElementById( 
                "cli-phone" 
            ); 
 
        const inputName = 
            document.getElementById( 
                "cli-name" 
            ); 
 
 
        if (inputPhone) { 
 
            inputPhone.setAttribute( 
                "autocomplete", 
                "off" 
            ); 
        } 
 
 
        if (inputName) { 
 
            inputName.setAttribute( 
                "autocomplete", 
                "off" 
            ); 
        } 


        // ==========================================
        // ENTER / IR NOS CAMPOS DE LOGIN
        // ==========================================

        const enviarLoginComEnter =
            (event) => {

                if (
                    event.key ===
                    "Enter"
                ) {

                    event.preventDefault();

                    const btnAcessar =
                        document.getElementById(
                            "btn-acessar"
                        );


                    if (
                        btnAcessar &&
                        !btnAcessar.disabled
                    ) {

                        acessarCartao(
                            event
                        );
                    }
                }
            };


        if (inputPhone) {

            inputPhone.addEventListener(
                "keydown",
                enviarLoginComEnter
            );
        }


        if (inputName) {

            inputName.addEventListener(
                "keydown",
                enviarLoginComEnter
            );
        }
 
 
        // ========================================== 
        // RESTAURAR SESSÃO 
        // ========================================== 
        // Não apagamos o localStorage. 
        // 
        // Se o cliente existe: 
        // -> continua logado. 
        // 
        // Se foi excluído: 
        // -> backend informa. 
        // -> sessão é apagada. 
        // ========================================== 
 
        const localPhone = 
            localStorage.getItem( 
                "fidelidade_whatsapp" 
            ); 
 
        const localName = 
            localStorage.getItem( 
                "fidelidade_nome" 
            ) || ""; 
 
 
        if (localPhone) { 
 
            if (inputPhone) { 
 
                inputPhone.value = 
                    localPhone; 
            } 
 
            if (inputName) { 
 
                inputName.value = 
                    localName; 
            } 
 
 
            restaurarSessaoSalva( 
                localPhone, 
                localName 
            ); 
 
        } else { 
 
            alternarSecao( 
                "login" 
            ); 
        } 
 
 
        // ========================================== 
        // BOTÃO ACESSAR 
        // ========================================== 
 
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
 
 
        // ========================================== 
        // BOTÃO SAIR 
        // ========================================== 
 
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
 
 
        // ========================================== 
        // BOTÃO ADMIN 
        // ========================================== 
 
        const btnAdmin = 
            document.getElementById( 
                "btn-admin-toggle" 
            ); 
 
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
            document.getElementById( 
                "btn-fechar-admin" 
            ); 
 
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
            document.getElementById( 
                "admin-search" 
            ); 
 
        if (adminSearch) { 
 
            adminSearch.addEventListener( 
                "input", 
                filtrarClientes 
            ); 
        } 
 
 
        // ========================================== 
        // MODAL 
        // ========================================== 
 
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
        // ENTER / IR NO CÓDIGO DO POPUP
        // ==========================================

        const inputCodigoResgate =
            document.getElementById(
                "input-codigo-resgate"
            );


        if (inputCodigoResgate) {

            inputCodigoResgate.addEventListener(
                "keydown",
                (event) => {

                    if (
                        event.key ===
                        "Enter"
                    ) {

                        event.preventDefault();

                        const btnConfirmar =
                            document.getElementById(
                                "btn-confirmar-resgate"
                            );


                        if (
                            btnConfirmar &&
                            !btnConfirmar.disabled
                        ) {

                            confirmarResgateCodigo();
                        }
                    }
                }
            );
        }
 
 
        // ========================================== 
        // BOTÃO INSTALAR APP 
        // ========================================== 
 
        const btnInstalarApp = 
            document.getElementById( 
                "btn-instalar-app" 
            ); 
 
        const iosInstallHelp = 
            document.getElementById( 
                "ios-install-help" 
            ); 
 
 
        if (btnInstalarApp) { 
 
            btnInstalarApp.addEventListener( 
                "click", 
                async () => { 
 
                    // ========================================== 
                    // IPHONE / IPAD 
                    // ========================================== 
 
                    const isIOS = 
                        /iPad|iPhone|iPod/.test( 
                            navigator.userAgent 
                        ) || 
                        ( 
                            navigator.platform === 
                            "MacIntel" && 
                            navigator.maxTouchPoints > 1 
                        ); 
 
 
                    if (isIOS) { 
 
                        if (iosInstallHelp) { 
 
                            iosInstallHelp.classList.remove( 
                                "hidden" 
                            ); 
                        } 
 
                        return; 
                    } 
 
 
                    // ========================================== 
                    // ANDROID / CHROME / EDGE 
                    // ========================================== 
 
                    if (!deferredPrompt) { 
 
                        alert( 
                            "A instalação ainda não está disponível neste momento. Tente novamente em alguns segundos ou use o menu do navegador para instalar o app." 
                        ); 
 
                        return; 
                    } 
 
 
                    const promptEvent = 
                        deferredPrompt; 
 
 
                    deferredPrompt = 
                        null; 
 
 
                    try { 
 
                        await promptEvent.prompt(); 
 
 
                        const resultado = 
                            await promptEvent.userChoice; 
 
 
                        console.log( 
                            "Resultado da instalação:", 
                            resultado.outcome 
                        ); 
 
                    } catch (error) { 
 
                        console.error( 
                            "Erro ao abrir instalação:", 
                            error 
                        ); 
                    } 
                } 
            ); 
        } 
 
 
        // ========================================== 
        // QUANDO VOLTA PARA A ABA 
        // ========================================== 
 
        document.addEventListener( 
            "visibilitychange", 
            () => { 
 
                if ( 
                    document.visibilityState === 
                    "visible" 
                ) { 
 
                    verificarClienteAtual(); 
                } 
            } 
        ); 
 
 
        // ========================================== 
        // PAGESHOW 
        // ========================================== 
 
        window.addEventListener( 
            "pageshow", 
            () => { 
 
                verificarClienteAtual(); 
            } 
        ); 
    } 
); 
 
 
// ========================================== 
// LOGIN MANUAL 
// ========================================== 
 
async function acessarCartao( 
    event 
) { 
 
    if (event) { 
 
        event.preventDefault(); 
    } 
 
 
    const inputPhone = 
        document.getElementById( 
            "cli-phone" 
        ); 
 
    const inputName = 
        document.getElementById( 
            "cli-name" 
        ); 
 
 
    const phone = 
        inputPhone 
            ? inputPhone.value.replace( 
                /\D/g, 
                "" 
            ) 
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
 
 
    await carregarDadosCliente( 
        phone, 
        name, 
        true 
    ); 
} 
 
 
// ========================================== 
// CARREGAR CLIENTE 
// ========================================== 
 
async function carregarDadosCliente( 
    phone, 
    name = "", 
    cadastrar = true 
) { 
 
    const btnAcessar = 
        document.getElementById( 
            "btn-acessar" 
        ); 
 
 
    try { 
 
        if (btnAcessar) { 
 
            btnAcessar.disabled = 
                true; 
 
            btnAcessar.innerText = 
                "Acessando..."; 
        } 
 
 
        const data = 
            await consultarCliente( 
                phone, 
                name, 
                cadastrar 
            ); 
 
 
        if (!data) { 
 
            alert( 
                "Erro ao conectar com a planilha." 
            ); 
 
            return; 
        } 
 
 
        // ========================================== 
        // CLIENTE EXCLUÍDO 
        // ========================================== 
 
        if ( 
            data.deleted === true 
        ) { 
 
            limparSessaoCliente(); 
 
            alert( 
                "🗑️ Este cadastro foi excluído pelo estúdio." 
            ); 
 
            return; 
        } 
 
 
        // ========================================== 
        // ERRO 
        // ========================================== 
 
        if ( 
            data.success === false 
        ) { 
 
            alert( 
                data.error || 
                "Erro ao consultar cliente." 
            ); 
 
            return; 
        } 
 
 
        // ========================================== 
        // NÃO ENCONTRADO 
        // ========================================== 
 
        if ( 
            data.found === false 
        ) { 
 
            alert( 
                data.message || 
                "Cliente não encontrado." 
            ); 
 
            return; 
        } 
 
 
        // ========================================== 
        // ATUALIZAR CLIENTE 
        // ========================================== 
 
        atualizarClienteAtual( 
            data, 
            phone, 
            name 
        ); 
 
 
        atualizarInterfaceCartao( 
            clienteAtual.nome, 
            clienteAtual.carimbos 
        ); 
 
 
        alternarSecao( 
            "cartao" 
        ); 
 
 
        iniciarMonitoramentoCliente(); 
 
 
    } catch (error) { 
 
        console.error( 
            "Erro ao carregar cliente:", 
            error 
        ); 
 
        alert( 
            "Erro ao conectar com a planilha." 
        ); 
 
    } finally { 
 
        if (btnAcessar) { 
 
            btnAcessar.disabled = 
                false; 
 
            btnAcessar.innerText = 
                "Ver Meu Cartão"; 
        } 
    } 
} 
 
 
// ========================================== 
// CONSULTAR API 
// ========================================== 
 
async function consultarCliente( 
    phone, 
    name = "", 
    cadastrar = false 
) { 
 
    try { 
 
        const url = 
            `${API_URL}` + 
            `?action=get_client` + 
            `&whatsapp=${encodeURIComponent(phone)}` + 
            `&nome=${encodeURIComponent(name)}` + 
            `&cadastrar=${cadastrar ? "true" : "false"}` + 
            `&_=${Date.now()}`; 
 
 
        const response = 
            await fetch( 
                url, 
                { 
                    cache: "no-store" 
                } 
            ); 
 
 
        if (!response.ok) { 
 
            throw new Error( 
                "HTTP " + 
                response.status 
            ); 
        } 
 
 
        return await response.json(); 
 
    } catch (error) { 
 
        console.error( 
            "Erro consultando API:", 
            error 
        ); 
 
        return null; 
    } 
} 
 
 
// ========================================== 
// ATUALIZAR CLIENTE ATUAL 
// ========================================== 
 
function atualizarClienteAtual( 
    data, 
    phone, 
    name 
) { 
 
    clienteAtual = { 
 
        whatsapp: 
            data.whatsapp || 
            phone, 
 
        nome: 
            data.nome || 
            name || 
            "Cliente", 
 
        carimbos: 
            Number( 
                data.carimbos 
            ) || 0 
    }; 
 
 
    // ========================================== 
    // SALVAR SESSÃO 
    // ========================================== 
 
    localStorage.setItem( 
        "fidelidade_whatsapp", 
        normalizarWhatsApp( 
            clienteAtual.whatsapp 
        ) 
    ); 
 
 
    localStorage.setItem( 
        "fidelidade_nome", 
        clienteAtual.nome 
    ); 
} 
 
 
// ========================================== 
// RESTAURAR SESSÃO APÓS REFRESH 
// ========================================== 
 
async function restaurarSessaoSalva( 
    phone, 
    name = "" 
) { 
 
    const data = 
        await consultarCliente( 
            phone, 
            name, 
            false 
        ); 
 
 
    // ========================================== 
    // ERRO DE CONEXÃO 
    // ========================================== 
    // Não derruba a sessão se a internet falhar. 
    // ========================================== 
 
    if (!data) { 
 
        clienteAtual = { 
 
            whatsapp: phone, 
 
            nome: 
                name || 
                "Cliente", 
 
            carimbos: 0 
        }; 
 
 
        atualizarInterfaceCartao( 
            clienteAtual.nome, 
            clienteAtual.carimbos 
        ); 
 
 
        alternarSecao( 
            "cartao" 
        ); 
 
 
        iniciarMonitoramentoCliente(); 
 
        return; 
    } 
 
 
    // ========================================== 
    // EXCLUÍDO 
    // ========================================== 
 
    if ( 
        data.deleted === true || 
        data.found === false 
    ) { 
 
        limparSessaoCliente(); 
 
        return; 
    } 
 
 
    // ========================================== 
    // ERRO 
    // ========================================== 
 
    if ( 
        data.success === false 
    ) { 
 
        console.error( 
            "Erro restaurando sessão:", 
            data.error 
        ); 
 
        return; 
    } 
 
 
    // ========================================== 
    // CLIENTE EXISTE 
    // ========================================== 
 
    atualizarClienteAtual( 
        data, 
        phone, 
        name 
    ); 
 
 
    atualizarInterfaceCartao( 
        clienteAtual.nome, 
        clienteAtual.carimbos 
    ); 
 
 
    alternarSecao( 
        "cartao" 
    ); 
 
 
    iniciarMonitoramentoCliente(); 
} 
 
 
// ========================================== 
// MONITORAMENTO 
// ========================================== 
 
function iniciarMonitoramentoCliente() { 
 
    pararMonitoramentoCliente(); 
 
 
    if ( 
        !clienteAtual || 
        !clienteAtual.whatsapp 
    ) { 
 
        return; 
    } 
 
 
    monitoramentoCliente = 
        setInterval( 
            verificarClienteAtual, 
            INTERVALO_MONITORAMENTO 
        ); 
} 
 
 
// ========================================== 
// PARAR MONITORAMENTO 
// ========================================== 
 
function pararMonitoramentoCliente() { 
 
    if ( 
        monitoramentoCliente 
    ) { 
 
        clearInterval( 
            monitoramentoCliente 
        ); 
 
 
        monitoramentoCliente = 
            null; 
    } 
} 
 
 
// ========================================== 
// VERIFICAR CLIENTE ATUAL 
// ========================================== 
 
async function verificarClienteAtual() { 
 
    if ( 
        !clienteAtual || 
        !clienteAtual.whatsapp 
    ) { 
 
        return; 
    } 
 
 
    if ( 
        verificacaoEmAndamento 
    ) { 
 
        return; 
    } 
 
 
    verificacaoEmAndamento = 
        true; 
 
 
    try { 
 
        const data = 
            await consultarCliente( 
                clienteAtual.whatsapp, 
                clienteAtual.nome || "", 
                false 
            ); 
 
 
        // ========================================== 
        // ERRO DE REDE 
        // ========================================== 
        // Continua logado. 
        // ========================================== 
 
        if (!data) { 
 
            return; 
        } 
 
 
        // ========================================== 
        // EXCLUÍDO 
        // ========================================== 
 
        if ( 
            data.deleted === true || 
            data.found === false 
        ) { 
 
            pararMonitoramentoCliente(); 
 
            limparSessaoCliente(); 
 
 
            alert( 
                "🗑️ Seu cadastro foi excluído pelo estúdio.\nVocê foi desconectado." 
            ); 
 
            return; 
        } 
 
 
        // ========================================== 
        // ERRO DA API 
        // ========================================== 
 
        if ( 
            data.success === false 
        ) { 
 
            console.error( 
                "Erro verificando cliente:", 
                data.error 
            ); 
 
            return; 
        } 
 
 
        // ========================================== 
        // CLIENTE CONTINUA EXISTINDO 
        // ========================================== 
 
        const novosCarimbos = 
            Number( 
                data.carimbos 
            ) || 0; 
 
 
        const novoNome = 
            data.nome || 
            clienteAtual.nome || 
            "Cliente"; 
 
 
        const carimbosMudaram = 
            novosCarimbos !== 
            Number( 
                clienteAtual.carimbos 
            ); 
 
 
        const nomeMudou = 
            novoNome !== 
            clienteAtual.nome; 
 
 
        if ( 
            carimbosMudaram || 
            nomeMudou 
        ) { 
 
            clienteAtual.carimbos = 
                novosCarimbos; 
 
 
            clienteAtual.nome = 
                novoNome; 
 
 
            localStorage.setItem( 
                "fidelidade_nome", 
                novoNome 
            ); 
 
 
            atualizarInterfaceCartao( 
                clienteAtual.nome, 
                clienteAtual.carimbos 
            ); 
        } 
 
    } catch (error) { 
 
        // Não desloga por erro de rede. 
 
        console.error( 
            "Erro no monitoramento:", 
            error 
        ); 
 
    } finally { 
 
        verificacaoEmAndamento = 
            false; 
    } 
} 
 
 
// ========================================== 
// INTERFACE DO CARTÃO 
// ========================================== 
 
function atualizarInterfaceCartao( 
    nome, 
    carimbos 
) { 
 
    carimbos = 
        Number( 
            carimbos 
        ) || 0; 
 
 
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
            nome || 
            "Cliente"; 
    } 
 
 
    // ========================================== 
    // BOTÃO 
    // ========================================== 
 
    if (btnCodigo) { 
 
        if ( 
            carimbos >= 2 
        ) { 
 
            btnCodigo.innerText = 
                "🔄 Reiniciar Cartão"; 
 
 
            btnCodigo.title = 
                "Digite o código do estúdio para resgatar o desconto e reiniciar o cartão."; 
 
        } else { 
 
            btnCodigo.innerText = 
                "🔑 Digitar Código do Estúdio"; 
 
 
            btnCodigo.title = 
                "Digite o código temporário fornecido pelo tatuador."; 
        } 
    } 
 
 
    // ========================================== 
    // STATUS 
    // ========================================== 
 
    if (dispDesconto) { 
 
        if ( 
            carimbos <= 0 
        ) { 
 
            dispDesconto.innerText = 
                "Faça sua 1ª tattoo para iniciar o cartão!"; 
 
        } else if ( 
            carimbos === 1 
        ) { 
 
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
// SLOT 
// ========================================== 
 
function atualizarSlot( 
    id, 
    ativo, 
    iconeAtivo, 
    iconeInativo 
) { 
 
    const slot = 
        document.getElementById( 
            id 
        ); 
 
 
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
// MODAL DE RESGATE 
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
        Number( 
            clienteAtual.carimbos 
        ) >= 2; 
 
 
    if (titulo) { 
 
        titulo.innerText = 
            cicloCompleto 
                ? "Reiniciar Cartão" 
                : "Código do Estúdio"; 
    } 
 
 
    if (descricao) { 
 
        descricao.innerText = 
            cicloCompleto 
 
                ? "Digite o código de 4 dígitos fornecido pelo tatuador para resgatar seu desconto e reiniciar o cartão." 
 
                : "Digite o código de 4 dígitos fornecido pelo tatuador para registrar sua tattoo."; 
    } 
 
 
    if (aviso) { 
 
        aviso.innerText = 
            "O código é temporário e pode ser usado uma única vez."; 
    } 
 
 
    if (botaoConfirmar) { 
 
        botaoConfirmar.innerText = 
            cicloCompleto 
                ? "Reiniciar Cartão" 
                : "Confirmar Código"; 
    } 
 
 
    if (modal) { 
 
        modal.classList.remove( 
            "hidden" 
        ); 
 
 
        modal.setAttribute( 
            "aria-hidden", 
            "false" 
        ); 
    } 
 
 
    if (inputCodigo) { 
 
        inputCodigo.value = 
            ""; 
 
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
// CONFIRMAR RESGATE 
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
 
 
    if ( 
        codigo.length !== 4 
    ) { 
 
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
            `${API_URL}` + 
            `?action=redeem_token` + 
            `&whatsapp=${encodeURIComponent(clienteAtual.whatsapp)}` + 
            `&codigo=${encodeURIComponent(codigo)}` + 
            `&_=${Date.now()}`; 
 
 
        const response = 
            await fetch( 
                url, 
                { 
                    cache: "no-store" 
                } 
            ); 
 
 
        if (!response.ok) { 
 
            throw new Error( 
                "HTTP " + 
                response.status 
            ); 
        } 
 
 
        const data = 
            await response.json(); 
 
 
        if (!data.success) { 
 
            if (data.deleted) { 
 
                limparSessaoCliente(); 
 
                alert( 
                    "🗑️ Seu cadastro foi excluído pelo estúdio." 
                ); 
 
                return; 
            } 
 
 
            alert( 
                data.error || 
                "Código inválido ou expirado!" 
            ); 
 
            return; 
        } 
 
 
        fecharModalResgate(); 
 
 
        if ( 
            data.cicloResetado 
        ) { 
 
            alert( 
                "🎉 Desconto resgatado com sucesso!\nO seu cartão foi reiniciado para o próximo ciclo." 
            ); 
 
        } else if ( 
            data.descontoLiberado 
        ) { 
 
            alert( 
                "🎉 Carimbo adicionado!\nVocê liberou 10% de desconto para a próxima tattoo!" 
            ); 
 
        } else { 
 
            alert( 
                "✅ Carimbo adicionado com sucesso!" 
            ); 
        } 
 
 
        clienteAtual.carimbos = 
            Number( 
                data.carimbos 
            ) || 0; 
 
 
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
// ADMIN - LOGIN 
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
            `${API_URL}` + 
            `?action=get_all` + 
            `&pin=${encodeURIComponent(pin)}` + 
            `&_=${Date.now()}`; 
 
 
        const response = 
            await fetch( 
                url, 
                { 
                    cache: "no-store" 
                } 
            ); 
 
 
        if (!response.ok) { 
 
            throw new Error( 
                "HTTP " + 
                response.status 
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
            Array.isArray( 
                data.clients 
            ) 
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
// ADMIN - RENDERIZAR CLIENTES 
// ========================================== 
 
function renderizarClientesAdmin( 
    lista 
) { 
 
    const container = 
        document.getElementById( 
            "lista-clientes-admin" 
        ); 
 
 
    if (!container) { 
 
        return; 
    } 
 
 
    container.innerHTML = 
        ""; 
 
 
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
// ADMIN - GERAR CÓDIGO 
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
            `${API_URL}` + 
            `?action=generate_token` + 
            `&whatsapp=${encodeURIComponent(whatsapp)}` + 
            `&pin=${encodeURIComponent(pin)}` + 
            `&_=${Date.now()}`; 
 
 
        const response = 
            await fetch( 
                url, 
                { 
                    cache: "no-store" 
                } 
            ); 
 
 
        if (!response.ok) { 
 
            throw new Error( 
                "HTTP " + 
                response.status 
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
            `${API_URL}` + 
            `?action=add_stamp` + 
            `&whatsapp=${encodeURIComponent(whatsapp)}` + 
            `&nome=${encodeURIComponent(nome)}` + 
            `&pin=${encodeURIComponent(pin)}` + 
            `&_=${Date.now()}`; 
 
 
        const response = 
            await fetch( 
                url, 
                { 
                    cache: "no-store" 
                } 
            ); 
 
 
        if (!response.ok) { 
 
            throw new Error( 
                "HTTP " + 
                response.status 
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
 
 
        if ( 
            data.cicloResetado 
        ) { 
 
            alert( 
                `🎉 Desconto resgatado para ${nome}!\nO cartão foi reiniciado para o próximo ciclo.` 
            ); 
 
        } else if ( 
            data.descontoLiberado 
        ) { 
 
            alert( 
                `🎉 Carimbo adicionado para ${nome}!\n10% de desconto liberado!` 
            ); 
 
        } else { 
 
            alert( 
                `✅ Carimbo adicionado com sucesso para ${nome}!` 
            ); 
        } 
 
 
        await atualizarPainelAdmin(); 
 
 
        // ========================================== 
        // ATUALIZAR CARTÃO ABERTO 
        // ========================================== 
 
        if ( 
            clienteAtual && 
            normalizarWhatsApp( 
                clienteAtual.whatsapp 
            ) === 
            normalizarWhatsApp( 
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
            `${API_URL}` + 
            `?action=delete_client` + 
            `&whatsapp=${encodeURIComponent(whatsapp)}` + 
            `&pin=${encodeURIComponent(pin)}` + 
            `&_=${Date.now()}`; 
 
 
        const response = 
            await fetch( 
                url, 
                { 
                    cache: "no-store" 
                } 
            ); 
 
 
        if (!response.ok) { 
 
            throw new Error( 
                "HTTP " + 
                response.status 
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
        // VERIFICAR SE É O CLIENTE ABERTO 
        // ========================================== 
 
        const whatsappExcluido = 
            normalizarWhatsApp( 
                whatsapp 
            ); 
 
 
        const whatsappAtual = 
            clienteAtual && 
            clienteAtual.whatsapp 
                ? normalizarWhatsApp( 
                    clienteAtual.whatsapp 
                ) 
                : ""; 
 
 
        const mesmoCliente = 
            whatsappExcluido !== "" && 
            whatsappExcluido === 
                whatsappAtual; 
 
 
        if (mesmoCliente) { 
 
            limparSessaoCliente(); 
 
            alert( 
                `🗑️ Cliente ${nome} excluído com sucesso!\n\nA sessão foi encerrada e os campos foram apagados.` 
            ); 
 
        } else { 
 
            alert( 
                `🗑️ Cliente ${nome} excluído com sucesso!` 
            ); 
        } 
 
 
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
            `${API_URL}` + 
            `?action=get_all` + 
            `&pin=${encodeURIComponent(pinAdminAtual)}` + 
            `&_=${Date.now()}`; 


        const response = 
            await fetch( 
                url, 
                { 
                    cache: "no-store" 
                } 
            ); 


        if (!response.ok) { 

            throw new Error( 
                "HTTP " + 
                response.status 
            ); 
        } 


        const data = 
            await response.json(); 


        if (data.success) { 

            todosClientes = 
                Array.isArray( 
                    data.clients 
                ) 
                    ? data.clients 
                    : []; 


            filtrarClientes(); 
        } 

    } catch (error) { 

        console.error( 
            "Erro atualizando painel:", 
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
                        cliente.nome || 
                        "" 
                    ).toLowerCase(); 


                const whatsapp = 
                    String( 
                        cliente.whatsapp || 
                        "" 
                    ); 


                return ( 
                    nome.includes( 
                        termo 
                    ) || 
                    whatsapp.includes( 
                        termo 
                    ) 
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
// SAIR MANUALMENTE 
// ==========================================

function sair() { 

    limparSessaoCliente(); 
} 


// ========================================== 
// LIMPAR SESSÃO 
// ==========================================

function limparSessaoCliente() { 

    // ========================================== 
    // PARAR MONITORAMENTO 
    // ==========================================

    pararMonitoramentoCliente(); 


    // ========================================== 
    // LIMPAR VARIÁVEL 
    // ==========================================

    clienteAtual = 
        null; 


    // ========================================== 
    // APAGAR SESSÃO SALVA 
    // ==========================================

    localStorage.removeItem( 
        "fidelidade_whatsapp" 
    ); 


    localStorage.removeItem( 
        "fidelidade_nome" 
    ); 


    // ========================================== 
    // APAGAR SESSÕES ANTIGAS 
    // ==========================================

    sessionStorage.removeItem( 
        "fidelidade_whatsapp" 
    ); 


    sessionStorage.removeItem( 
        "fidelidade_nome" 
    ); 


    // ========================================== 
    // FECHAR MODAL 
    // ==========================================

    fecharModalResgate(); 


    // ========================================== 
    // LIMPAR INPUTS 
    // ==========================================

    const inputPhone = 
        document.getElementById( 
            "cli-phone" 
        ); 


    const inputName = 
        document.getElementById( 
            "cli-name" 
        ); 


    if (inputPhone) { 

        inputPhone.value = 
            ""; 

        inputPhone.blur(); 
    } 


    if (inputName) { 

        inputName.value = 
            ""; 

        inputName.blur(); 
    } 


    // ========================================== 
    // VOLTAR PARA LOGIN 
    // ==========================================

    alternarSecao( 
        "login" 
    ); 
} 


// ========================================== 
// NORMALIZAR WHATSAPP 
// ==========================================

function normalizarWhatsApp( 
    numero 
) { 

    return String( 
        numero || "" 
    ).replace( 
        /\D/g, 
        "" 
    ); 
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


    if ( 
        secao === "login" 
    ) { 

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
// ESCAPAR HTML 
// ==========================================

function escapeHTML( 
    value 
) { 

    return String( 
        value 
    ) 

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
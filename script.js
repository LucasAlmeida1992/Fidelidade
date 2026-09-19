// ==========================================
// CONFIGURAÇÕES DA API / URL DO GOOGLE APPS SCRIPT
// ==========================================
const URL_API = "COLOQUE_SUA_URL_DO_GOOGLE_APPS_SCRIPT_AQUI"; 
const LIMITE_CARIMBOS = 2; // O limite para este cartão de fidelidade é 2

// Elementos do DOM (Certifique-se de que os IDs no seu HTML coincidem com estes)
const inputTelefone = document.getElementById("telefone");
const btnConsultar = document.getElementById("btn-consultar");
const btnAdicionarCarimbo = document.getElementById("btn-adicionar-carimbo");
const infoCliente = document.getElementById("info-cliente");
const dispNome = document.getElementById("disp-nome");
const dispDesconto = document.getElementById("disp-desconto");

// Estado atual da sessão
let clienteAtual = null;

// ==========================================
// EVENT LISTENERS
// ==========================================
if (btnConsultar) {
    btnConsultar.addEventListener("click", consultarCliente);
}

if (btnAdicionarCarimbo) {
    btnAdicionarCarimbo.addEventListener("click", solicitarAdicionarCarimbo);
}

// ==========================================
// CONSULTAR CLIENTE
// ==========================================
function consultarCliente() {
    const telefone = inputTelefone.value.trim();

    if (!telefone) {
        alert("Por favor, digite o número de telefone.");
        return;
    }

    btnConsultar.innerText = "Buscando...";
    btnConsultar.disabled = true;

    fetch(`${URL_API}?acao=consultar&telefone=${encodeURIComponent(telefone)}`)
        .then(response => response.json())
        .then(data => {
            btnConsultar.innerText = "Consultar";
            btnConsultar.disabled = false;

            if (data.erro) {
                alert(data.erro);
                return;
            }

            clienteAtual = data;
            exibirPainelCliente(true);
            atualizarInterfaceCartao(data.nome, data.carimbos);
        })
        .catch(error => {
            console.error("Erro na consulta:", error);
            btnConsultar.innerText = "Consultar";
            btnConsultar.disabled = false;
            alert("Erro ao conectar com o servidor.");
        });
}

// ==========================================
// SOLICITAR ADICIONAR CARIMBO (COM SENHA)
// ==========================================
function solicitarAdicionarCarimbo() {
    if (!clienteAtual) {
        alert("Consulte um cliente primeiro.");
        return;
    }

    const senha = prompt("Digite a senha de administrador/tatuador:");
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
            "Content-Type": "text/plain;charset=utf-8" // Usar text/plain evita bloqueios de CORS pré-flight no Apps Script
        }
    })
    .then(response => response.json())
    .then(data => {
        btnAdicionarCarimbo.disabled = false;

        if (data.erro) {
            alert("Erro: " + data.erro);
            // Restaura o texto correto dependendo de quantos carimbos ele tem
            atualizarInterfaceCartao(clienteAtual.nome, clienteAtual.carimbos);
            return;
        }

        // Atualiza o estado local com os dados retornados do servidor
        clienteAtual.carimbos = data.carimbos;
        
        if (data.cicloResetado) {
            alert("🎉 Desconto resgatado com sucesso! O cartão foi reiniciado para um novo ciclo.");
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

    // Atualiza Nome do Cliente
    if (dispNome) {
        dispNome.innerText = nome || "Cliente";
    }

    // Mensagens de status / desconto
    if (dispDesconto) {
        if (carimbos <= 0) {
            dispDesconto.innerText = "Faça sua 1ª tattoo para iniciar o cartão!";
        } else if (carimbos === 1) {
            dispDesconto.innerText = "Falta 1 tattoo para liberar 10% OFF na próxima!";
        } else {
            dispDesconto.innerText = "🎉 10% DE DESCONTO LIBERADO PARA A PRÓXIMA TATTOO!";
        }
    }

    // Atualiza os Slots visuais (Garante que os IDs HTML sejam 'slot-1', 'slot-2', 'slot-3')
    atualizarSlot("slot-1", carimbos >= 1, "✅", "⭕");
    atualizarSlot("slot-2", carimbos >= 2, "✅", "⭕");
    atualizarSlot("slot-3", carimbos >= 2, "🏆", "🎁");

    // Altera o texto do botão caso o cartão esteja completo (limite atingido)
    if (btnAdicionarCarimbo) {
        if (carimbos >= LIMITE_CARIMBOS) {
            btnAdicionarCarimbo.innerText = "Reiniciar Cartão";
        } else {
            btnAdicionarCarimbo.innerText = "Adicionar Carimbo";
        }
    }
}

// ==========================================
// FUNÇÃO AUXILIAR PARA OS SLOTS
// ==========================================
function atualizarSlot(idElemento, ativo, iconeAtivo, iconeInativo) {
    const slot = document.getElementById(idElemento);
    if (!slot) return;

    // Aplica a classe CSS 'active' para acionar o vermelho intenso e brilho
    slot.className = ativo ? "stamp-slot active" : "stamp-slot";
    
    // Altera o ícone interno se o elemento possuir tag de texto/ícone
    slot.innerText = ativo ? iconeAtivo : iconeInativo;
}

// ==========================================
// CONTROLAR VISIBILIDADE DO PAINEL
// ==========================================
function exibirPainelCliente(mostrar) {
    if (infoCliente) {
        infoCliente.style.display = mostrar ? "block" : "none";
    }
}
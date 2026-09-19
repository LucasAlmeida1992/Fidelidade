// 🚨 SUBSTITUA ABAIXO PELA URL DA SUA API NO GOOGLE APPS SCRIPT
const API_URL = "https://script.google.com/macros/s/AKfycbz-ohIZL5xvFQvPSgtvJw8Js2S71lCW00kFGcmj3TcymFucYbonbNrNRx_Fn7vpdDYF/exec";

let clienteAtual = null;
let todosClientes = [];

// ELEMENTOS DOM
const secLogin = document.getElementById('sec-login');
const secCartao = document.getElementById('sec-cartao');
const secAdmin = document.getElementById('sec-admin');

const inputPhone = document.getElementById('cli-phone');
const inputName = document.getElementById('cli-name');

const dispNome = document.getElementById('disp-nome');
const dispDesconto = document.getElementById('disp-desconto');

// INICIALIZAÇÃO
window.addEventListener('DOMContentLoaded', () => {
    const localPhone = localStorage.getItem('fidelidade_whatsapp');
    if (localPhone) {
        inputPhone.value = localPhone;
        carregarDadosCliente(localPhone);
    }

    // Event Listeners
    document.getElementById('btn-acessar').addEventListener('click', acessarCartao);
    document.getElementById('btn-adicionar-carimbo').addEventListener('click', adicionarCarimboComSenha);
    document.getElementById('btn-sair').addEventListener('click', sair);
    document.getElementById('btn-admin-toggle').addEventListener('click', promptAdmin);
    document.getElementById('btn-fechar-admin').addEventListener('click', fecharAdmin);
    document.getElementById('admin-search').addEventListener('keyup', filtrarClientes);
});

// LÓGICA DO CLIENTE
async function acessarCartao() {
    const phone = inputPhone.value.replace(/\D/g, '');
    const name = inputName.value;

    if (!phone) {
        alert("Digite o número do seu WhatsApp.");
        return;
    }

    localStorage.setItem('fidelidade_whatsapp', phone);
    localStorage.setItem('fidelidade_nome', name);

    await carregarDadosCliente(phone, name);
}

async function carregarDadosCliente(phone, name = '') {
    try {
        const res = await fetch(`${API_URL}?action=get_client&whatsapp=${phone}`);
        const data = await res.json();

        secLogin.classList.add('hidden');
        secCartao.classList.remove('hidden');

        if (data.found) {
            clienteAtual = data;
            atualizarInterfaceCartao(data.nome, data.carimbos);
        } else {
            const clienteNome = name || localStorage.getItem('fidelidade_nome') || 'Cliente';
            clienteAtual = { whatsapp: phone, nome: clienteNome, carimbos: 0 };
            atualizarInterfaceCartao(clienteNome, 0);
        }
    } catch (e) {
        alert("Erro ao conectar ao servidor do Cartão Fidelidade.");
    }
}

function atualizarInterfaceCartao(nome, carimbos) {
    dispNome.innerText = nome;

    // Mensagens de Status baseadas nos carimbos
    if (carimbos === 0) {
        dispDesconto.innerText = "Faça sua 1ª tattoo para iniciar o cartão!";
    } else if (carimbos === 1) {
        dispDesconto.innerText = "Falta 1 tattoo para liberar 10% OFF na próxima!";
    } else if (carimbos >= 2) {
        dispDesconto.innerText = "🎉 10% DE DESCONTO LIBERADO PARA A PRÓXIMA TATTOO!";
    }

    // Atualiza Slot 1
    const slot1 = document.getElementById('slot-1');
    slot1.className = carimbos >= 1 ? 'stamp-slot active' : 'stamp-slot';
    slot1.querySelector('.icon').innerText = carimbos >= 1 ? '✅' : '⭕';

    // Atualiza Slot 2
    const slot2 = document.getElementById('slot-2');
    slot2.className = carimbos >= 2 ? 'stamp-slot active' : 'stamp-slot';
    slot2.querySelector('.icon').innerText = carimbos >= 2 ? '✅' : '⭕';

    // Atualiza Slot 3 (Trofeu / Desconto Ativo)
    const slot3 = document.getElementById('slot-3');
    slot3.className = carimbos >= 2 ? 'stamp-slot active' : 'stamp-slot';
    slot3.querySelector('.icon').innerText = carimbos >= 2 ? '🏆' : '🎁';
}

async function adicionarCarimboComSenha() {
    const pin = prompt("Digite a Senha do Tatuador:");
    if (!pin) return;

    try {
        const res = await fetch(`${API_URL}?action=add_stamp&whatsapp=${clienteAtual.whatsapp}&nome=${encodeURIComponent(clienteAtual.nome)}&pin=${pin}`);
        const data = await res.json();

        if (data.error) {
            alert("Senha incorreta!");
        } else {
            if (data.carimbos === 0) {
                alert("Desconto resgatado com sucesso! Ciclo do cartão reiniciado.");
            } else {
                alert("Carimbo adicionado com sucesso!");
            }
            carregarDadosCliente(clienteAtual.whatsapp);
        }
    } catch (e) {
        alert("Erro ao registrar carimbo.");
    }
}

// LÓGICA DO PAINEL ADMIN
async function promptAdmin() {
    const pin = prompt("Digite a senha de Administrador:");
    if (!pin) return;

    try {
        const res = await fetch(`${API_URL}?action=get_all&pin=${pin}`);
        const data = await res.json();

        if (data.error) {
            alert("Senha incorreta!");
        } else {
            todosClientes = data;
            renderizarClientesAdmin(data, pin);
            secAdmin.classList.remove('hidden');
        }
    } catch (e) {
        alert("Erro ao buscar dados do painel admin.");
    }
}

function renderizarClientesAdmin(lista, pin) {
    const container = document.getElementById('lista-clientes-admin');
    container.innerHTML = '';

    if (lista.length === 0) {
        container.innerHTML = '<p style="color:#aaa; font-size:12px; text-align:center;">Nenhum cliente cadastrado.</p>';
        return;
    }

    lista.forEach(c => {
        const item = document.createElement('div');
        item.className = 'client-item';
        item.innerHTML = `
            <div class="client-info">
                <strong>${c.nome}</strong>
                <span>${c.whatsapp} | ${c.carimbos}/2 carimbos</span>
            </div>
            <div>
                <button class="btn-sm btn-add-admin" data-phone="${c.whatsapp}" data-nome="${c.nome}">+ Carimbo</button>
            </div>
        `;
        container.appendChild(item);
    });

    document.querySelectorAll('.btn-add-admin').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const phone = e.target.getAttribute('data-phone');
            const nome = e.target.getAttribute('data-nome');
            carimboDiretoAdmin(phone, nome, pin);
        });
    });
}

function filtrarClientes() {
    const termo = document.getElementById('admin-search').value.toLowerCase();
    const filtrados = todosClientes.filter(c => 
        (c.nome && c.nome.toLowerCase().includes(termo)) || 
        (c.whatsapp && String(c.whatsapp).includes(termo))
    );
    renderizarClientesAdmin(filtrados, null);
}

async function carimboDiretoAdmin(whatsapp, nome, pinAtual) {
    const pin = pinAtual || prompt("Confirme a senha Admin:");
    if (!pin) return;

    try {
        const res = await fetch(`${API_URL}?action=add_stamp&whatsapp=${whatsapp}&nome=${encodeURIComponent(nome)}&pin=${pin}`);
        const data = await res.json();

        if (data.error) {
            alert("Senha Incorreta!");
        } else {
            alert("Carimbo Atualizado!");
            promptAdmin();
        }
    } catch (e) {
        alert("Erro ao registrar carimbo.");
    }
}

function fecharAdmin() {
    secAdmin.classList.add('hidden');
}

function sair() {
    localStorage.clear();
    location.reload();
}

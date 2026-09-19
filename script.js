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

        // ADICIONADO O BOTÃO DE EXCLUIR AO LADO DO DE CARIMBO
        item.innerHTML = `
            <div class="client-info">
                <strong>${escapeHTML(nome)}</strong>
                <span>${escapeHTML(whatsapp)} | ${carimbos}/2 carimbos</span>
            </div>
            <div style="display: flex; gap: 6px;">
                <button type="button" class="btn-sm btn-add-admin">+ Carimbo</button>
                <button type="button" class="btn-sm btn-delete-admin" style="background:#2a1114; border-color:#fb0532; color:#ff6b81;">Excluir</button>
            </div>
        `;

        const botaoCarimbo = item.querySelector(".btn-add-admin");
        if (botaoCarimbo) {
            botaoCarimbo.addEventListener("click", () => {
                carimboDiretoAdmin(whatsapp, nome);
            });
        }

        const botaoExcluir = item.querySelector(".btn-delete-admin");
        if (botaoExcluir) {
            botaoExcluir.addEventListener("click", () => {
                excluirClienteAdmin(whatsapp, nome);
            });
        }

        container.appendChild(item);
    });
}

// FUNÇÃO PARA EXCLUIR O CLIENTE
async function excluirClienteAdmin(whatsapp, nome) {
    if (!confirm(`Tem certeza que deseja excluir o cliente "${nome}" (${whatsapp})?`)) {
        return;
    }

    let pin = pinAdminAtual;
    if (!pin) {
        pin = prompt("Confirme a senha Admin:");
        if (!pin) return;
    }

    try {
        const url = API_URL + 
            "?action=delete_client" + 
            "&whatsapp=" + encodeURIComponent(whatsapp) + 
            "&pin=" + encodeURIComponent(pin);

        const response = await fetch(url);
        const data = await response.json();

        if (!data.success) {
            alert(data.error || "Erro ao excluir cliente.");
            return;
        }

        alert("🗑️ Cliente excluído com sucesso!");
        await atualizarPainelAdmin();

    } catch (error) {
        console.error("Erro ao excluir cliente:", error);
        alert("Erro de conexão ao tentar excluir.");
    }
}

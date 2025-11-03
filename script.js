// SISTEMA DE AUTENTICACAO E GESTAO
// Versao: 4.2 - Sistema Corrigido Completo

// VARIAVEIS GLOBAIS
let usuarioLogado = null;
let todosOsDados = [];
let dadosFiltrados = [];
let usuarios = [];

// DADOS INICIAIS - USUARIO ADMIN REAL
const usuariosIniciais = [
    { id: 1, matricula: '12282', nome: 'Gustavo - Administrador', senha: 'admin123', perfil: 'admin' }
];

const dadosDemo = `N1,N2,N3,N4,N5,Centro de custo,Regional,Responsável N1,Responsável N2,Responsável N3,Valor
DIREX,Medicina Diagnóstica,Gerência Operacional,Área Técnica,Fleury SP,CC001,São Paulo,João Silva,Maria Santos,Pedro Costa,2500.00
DIREX,Medicina Diagnóstica,Gerência Comercial,Área Vendas,Fleury SP,CC002,São Paulo,João Silva,Ana Oliveira,Carlos Lima,1800.00
DIREX,Medicina Diagnóstica,Gerência Qualidade,Área Controle,Fleury SP,CC003,São Paulo,João Silva,Luiza Ferreira,Rafael Souza,3200.00
DIREX,Saúde Ocupacional,Gerência Clínica,Área Médica,Fleury RJ,CC004,Rio de Janeiro,José Santos,Marina Silva,Bruno Alves,1500.00
DIREX,Saúde Ocupacional,Gerência Administrativa,Área RH,Fleury RJ,CC005,Rio de Janeiro,José Santos,Patricia Costa,Diego Rocha,2100.00
DIREX,Digital Health,Gerência Tecnologia,Área TI,Fleury Digital,CC006,São Paulo,Roberto Lima,Fernanda Dias,Lucas Martins,2800.00
DIREX,Digital Health,Gerência Produto,Área Desenvolvimento,Fleury Digital,CC007,São Paulo,Roberto Lima,Juliana Pereira,Marcos Oliveira,2200.00
DIREX,Medicina Diagnóstica,Gerência Logística,Área Transporte,Fleury MG,CC008,Belo Horizonte,João Silva,Ricardo Gomes,Amanda Silva,1900.00
DIREX,Medicina Diagnóstica,Gerência Financeira,Área Contábil,Fleury SP,CC009,São Paulo,João Silva,Carla Mendes,Thiago Reis,2600.00
DIREX,Saúde Ocupacional,Gerência Operacional,Área Exames,Fleury RJ,CC010,Rio de Janeiro,José Santos,Renata Lima,Gustavo Almeida,1700.00`;

// INICIALIZACAO DO SISTEMA
document.addEventListener('DOMContentLoaded', function() {
    console.log('Sistema de Certificado de Verba iniciado!');
    console.log('Versao: 4.2 - Sistema Completo Corrigido');
    
    // Verifica bibliotecas
    if (typeof Papa === 'undefined' || typeof window.jspdf === 'undefined') {
        alert('Erro: Bibliotecas não carregadas. Recarregue a página.');
        return;
    }
    
    console.log('Bibliotecas carregadas com sucesso!');
    
    // Inicializa dados
    inicializarSistema();
    
    // Verifica se há usuário logado
    verificarSessao();
    
    // Configura eventos do formulário de login
    configurarEventosLogin();
});

// CONFIGURAR EVENTOS DO LOGIN
function configurarEventosLogin() {
    const formLogin = document.getElementById('formLogin');
    const matriculaInput = document.getElementById('matricula');
    const senhaInput = document.getElementById('senha');
    
    // Enter no formulário
    if (matriculaInput) {
        matriculaInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                senhaInput.focus();
            }
        });
    }
    
    if (senhaInput) {
        senhaInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                fazerLogin();
            }
        });
    }
}

// INICIALIZAR SISTEMA
function inicializarSistema() {
    try {
        // Carrega usuários do localStorage ou usa dados iniciais
        const usuariosSalvos = localStorage.getItem('fleury-usuarios');
        if (usuariosSalvos) {
            usuarios = JSON.parse(usuariosSalvos);
            console.log('Usuários carregados do localStorage:', usuarios.length);
        } else {
            usuarios = [...usuariosIniciais];
            salvarUsuarios();
            console.log('Usuários iniciais criados:', usuarios.length);
        }
        
        // Carrega dados CSV se existirem
        const dadosSalvos = localStorage.getItem('fleury-dados-csv');
        if (dadosSalvos) {
            processarDadosCSV(dadosSalvos, 'dados-salvos.csv', false);
            console.log('Dados CSV carregados do localStorage');
        }
        
        console.log('Sistema inicializado com sucesso!');
        
    } catch (erro) {
        console.error('Erro ao inicializar sistema:', erro);
        // Se houver erro, recria os dados iniciais
        usuarios = [...usuariosIniciais];
        salvarUsuarios();
    }
}

// SALVAR USUARIOS NO LOCALSTORAGE
function salvarUsuarios() {
    try {
        localStorage.setItem('fleury-usuarios', JSON.stringify(usuarios));
        console.log('Usuários salvos no localStorage');
    } catch (erro) {
        console.error('Erro ao salvar usuários:', erro);
    }
}

// VERIFICAR SESSAO
function verificarSessao() {
    try {
        const sessao = localStorage.getItem('fleury-sessao');
        if (sessao) {
            const dadosSessao = JSON.parse(sessao);
            const usuario = usuarios.find(u => u.id === dadosSessao.userId);
            if (usuario) {
                usuarioLogado = usuario;
                mostrarSistema();
                return;
            }
        }
    } catch (erro) {
        console.error('Erro ao verificar sessão:', erro);
        localStorage.removeItem('fleury-sessao');
    }
    
    mostrarLogin();
}

// MOSTRAR TELA DE LOGIN
function mostrarLogin() {
    document.getElementById('loginScreen').style.display = 'flex';
    document.getElementById('mainSystem').style.display = 'none';
    
    // Foca no campo matrícula
    setTimeout(() => {
        const matriculaInput = document.getElementById('matricula');
        if (matriculaInput) {
            matriculaInput.focus();
        }
    }, 100);
}

// MOSTRAR SISTEMA PRINCIPAL
function mostrarSistema() {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('mainSystem').style.display = 'block';
    
    // Atualiza informações do usuário
    const userInfoElement = document.getElementById('userInfo');
    if (userInfoElement) {
        userInfoElement.textContent = 
            `${usuarioLogado.nome} (${usuarioLogado.matricula}) - ${usuarioLogado.perfil === 'admin' ? 'Administrador' : 'Usuário'}`;
    }
    
    // Mostra botão admin se for administrador
    const btnPainel = document.getElementById('btnPainel');
    if (btnPainel) {
        if (usuarioLogado.perfil === 'admin') {
            btnPainel.style.display = 'inline-flex';
        } else {
            btnPainel.style.display = 'none';
        }
    }
    
    // Configura eventos se ainda não foram configurados
    configurarEventos();
    
    // Se for admin e não há dados, abre o painel automaticamente
    if (usuarioLogado.perfil === 'admin' && todosOsDados.length === 0) {
        setTimeout(() => {
            abrirPainel();
            mostrarStatusUpload('uploadStatusDados', 
                'Bem-vindo! Como administrador, você precisa carregar os dados do sistema primeiro.', 
                'info');
        }, 1000);
    } else if (todosOsDados.length > 0) {
        // Se há dados, preenche os filtros
        preencherFiltros();
    } else {
        // Se é usuário comum e não há dados
        mostrarMensagemSemDados();
    }
}

// MOSTRAR MENSAGEM SEM DADOS
function mostrarMensagemSemDados() {
    const selects = ['listaN2', 'listaN3', 'listaCC'];
    selects.forEach(id => {
        const select = document.getElementById(id);
        if (select) {
            select.innerHTML = '<option>Aguardando administrador carregar dados...</option>';
        }
    });
    
    const listaCentros = document.getElementById('listaCentros');
    if (listaCentros) {
        listaCentros.innerHTML = 
            '<div style="text-align: center; padding: 2rem; color: #7f8c8d;">' +
            '<h4>📋 Sistema em Configuração</h4>' +
            '<p>O administrador ainda não carregou os dados do sistema.</p>' +
            '<p>Entre em contato com o administrador para liberar o acesso.</p>' +
            '</div>';
    }
}

// FAZER LOGIN
function fazerLogin() {
    const matriculaInput = document.getElementById('matricula');
    const senhaInput = document.getElementById('senha');
    
    if (!matriculaInput || !senhaInput) {
        mostrarStatusLogin('Erro interno: Campos de login não encontrados.', 'error');
        return;
    }
    
    const matricula = matriculaInput.value.trim();
    const senha = senhaInput.value.trim();
    
    if (!matricula || !senha) {
        mostrarStatusLogin('Por favor, preencha todos os campos.', 'error');
        matriculaInput.focus();
        return;
    }
    
    console.log('Tentativa de login:', matricula);
    console.log('Usuários disponíveis:', usuarios.map(u => u.matricula));
    
    const usuario = usuarios.find(u => 
        u.matricula.toLowerCase() === matricula.toLowerCase() && 
        u.senha === senha
    );
    
    if (usuario) {
        usuarioLogado = usuario;
        console.log('Login bem-sucedido:', usuario.nome);
        
        // Salva sessão
        try {
            localStorage.setItem('fleury-sessao', JSON.stringify({
                userId: usuario.id,
                timestamp: Date.now()
            }));
        } catch (erro) {
            console.error('Erro ao salvar sessão:', erro);
        }
        
        mostrarStatusLogin('Login realizado com sucesso! Redirecionando...', 'success');
        
        setTimeout(() => {
            mostrarSistema();
            limparFormLogin();
        }, 1500);
        
    } else {
        console.log('Login falhou para:', matricula);
        mostrarStatusLogin('Matrícula ou senha incorretos. Tente novamente.', 'error');
        senhaInput.value = '';
        senhaInput.focus();
    }
}

// FAZER LOGOUT
function fazerLogout() {
    if (confirm('Deseja realmente sair do sistema?')) {
        usuarioLogado = null;
        localStorage.removeItem('fleury-sessao');
        limparFormLogin();
        fecharPainel();
        mostrarLogin();
        console.log('Logout realizado');
    }
}

// MOSTRAR STATUS LOGIN
function mostrarStatusLogin(mensagem, tipo) {
    const statusDiv = document.getElementById('loginStatus');
    if (statusDiv) {
        statusDiv.className = 'login-status status-' + tipo;
        statusDiv.textContent = mensagem;
        
        if (tipo === 'error') {
            setTimeout(() => {
                statusDiv.textContent = '';
                statusDiv.className = 'login-status';
            }, 4000);
        }
    }
    
    console.log('[LOGIN ' + tipo.toUpperCase() + ']', mensagem);
}

// LIMPAR FORM LOGIN
function limparFormLogin() {
    const matriculaInput = document.getElementById('matricula');
    const senhaInput = document.getElementById('senha');
    const statusDiv = document.getElementById('loginStatus');
    
    if (matriculaInput) matriculaInput.value = '';
    if (senhaInput) senhaInput.value = '';
    if (statusDiv) {
        statusDiv.textContent = '';
        statusDiv.className = 'login-status';
    }
}

// CONFIGURAR EVENTOS DO SISTEMA
function configurarEventos() {
    // Eventos dos checkboxes (só configura uma vez)
    const checkbox1 = document.getElementById('usarN2');
    const checkbox2 = document.getElementById('usarN3');
    const checkbox3 = document.getElementById('usarCC');
    
    if (checkbox1 && !checkbox1.hasAttribute('data-configured')) {
        checkbox1.addEventListener('change', function() {
            const select = document.getElementById('listaN2');
            if (select) {
                select.disabled = !this.checked;
                if (!this.checked) select.value = '';
            }
        });
        checkbox1.setAttribute('data-configured', 'true');
    }
    
    if (checkbox2 && !checkbox2.hasAttribute('data-configured')) {
        checkbox2.addEventListener('change', function() {
            const select = document.getElementById('listaN3');
            if (select) {
                select.disabled = !this.checked;
                if (!this.checked) select.value = '';
            }
        });
        checkbox2.setAttribute('data-configured', 'true');
    }
    
    if (checkbox3 && !checkbox3.hasAttribute('data-configured')) {
        checkbox3.addEventListener('change', function() {
            const select = document.getElementById('listaCC');
            if (select) {
                select.disabled = !this.checked;
                if (!this.checked) select.value = '';
            }
        });
        checkbox3.setAttribute('data-configured', 'true');
    }
}

// ABRIR PAINEL ADMIN
function abrirPainel() {
    if (!usuarioLogado || usuarioLogado.perfil !== 'admin') {
        alert('Acesso negado. Apenas administradores podem acessar este painel.');
        return;
    }
    
    const painelAdmin = document.getElementById('painelAdmin');
    if (painelAdmin) {
        painelAdmin.style.display = 'flex';
        atualizarEstatisticasDados();
        atualizarListaUsuarios();
        configurarUploadAdmin();
    }
}

// FECHAR PAINEL ADMIN
function fecharPainel() {
    const painelAdmin = document.getElementById('painelAdmin');
    if (painelAdmin) {
        painelAdmin.style.display = 'none';
    }
}

// ABRIR TAB
function abrirTab(tabId) {
    // Remove active de todas as tabs
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    // Ativa a tab selecionada
    const btnId = 'btn' + tabId.charAt(0).toUpperCase() + tabId.slice(1);
    const btnElement = document.getElementById(btnId);
    const tabElement = document.getElementById(tabId);
    
    if (btnElement) btnElement.classList.add('active');
    if (tabElement) tabElement.classList.add('active');
}

// CONFIGURAR UPLOAD ADMIN
function configurarUploadAdmin() {
    // Upload de dados
    const uploadAreaDados = document.getElementById('uploadAreaAdmin');
    const fileInputDados = document.getElementById('fileInputDados');
    
    if (uploadAreaDados && fileInputDados) {
        uploadAreaDados.onclick = () => fileInputDados.click();
        fileInputDados.onchange = (e) => {
            if (e.target.files[0]) {
                processarArquivoDados(e.target.files[0]);
            }
        };
        
        // Drag and drop para dados
        uploadAreaDados.ondragover = (e) => {
            e.preventDefault();
            uploadAreaDados.style.borderColor = '#27ae60';
        };
        
        uploadAreaDados.ondragleave = (e) => {
            e.preventDefault();
            uploadAreaDados.style.borderColor = '#3498db';
        };
        
        uploadAreaDados.ondrop = (e) => {
            e.preventDefault();
            uploadAreaDados.style.borderColor = '#3498db';
            if (e.dataTransfer.files[0]) {
                processarArquivoDados(e.dataTransfer.files[0]);
            }
        };
    }
    
    // Upload de usuários
    const uploadAreaUsuarios = document.getElementById('uploadAreaUsuarios');
    const fileInputUsuarios = document.getElementById('fileInputUsuarios');
    
    if (uploadAreaUsuarios && fileInputUsuarios) {
        uploadAreaUsuarios.onclick = () => fileInputUsuarios.click();
        fileInputUsuarios.onchange = (e) => {
            if (e.target.files[0]) {
                processarArquivoUsuarios(e.target.files[0]);
            }
        };
    }
}

// SELECIONAR ARQUIVO DADOS
function selecionarArquivoDados() {
    const fileInput = document.getElementById('fileInputDados');
    if (fileInput) {
        fileInput.click();
    }
}

// SELECIONAR ARQUIVO USUARIOS
function selecionarArquivoUsuarios() {
    const fileInput = document.getElementById('fileInputUsuarios');
    if (fileInput) {
        fileInput.click();
    }
}

// USAR DADOS DEMO
function usarDadosDemo() {
    mostrarStatusUpload('uploadStatusDados', 'Carregando dados de demonstração...', 'info');
    processarDadosCSV(dadosDemo, 'dados-demo.csv', true);
}

// PROCESSAR ARQUIVO DADOS
function processarArquivoDados(arquivo) {
    if (!arquivo.name.toLowerCase().endsWith('.csv')) {
        mostrarStatusUpload('uploadStatusDados', 'Por favor, selecione um arquivo CSV.', 'error');
        return;
    }
    
    mostrarStatusUpload('uploadStatusDados', 'Processando arquivo: ' + arquivo.name, 'info');
    
    const reader = new FileReader();
    reader.onload = function(e) {
        processarDadosCSV(e.target.result, arquivo.name, true);
    };
    reader.onerror = function() {
        mostrarStatusUpload('uploadStatusDados', 'Erro ao ler o arquivo.', 'error');
    };
    reader.readAsText(arquivo, 'UTF-8');
}

// PROCESSAR DADOS CSV
function processarDadosCSV(csvData, nomeArquivo, salvar = true) {
    try {
        Papa.parse(csvData, {
            header: true,
            skipEmptyLines: true,
            encoding: 'UTF-8',
            complete: function(resultado) {
                if (resultado.errors.length > 0) {
                    console.warn('Avisos no processamento:', resultado.errors);
                }
                
                // Filtra dados válidos
                todosOsDados = resultado.data.filter(linha => {
                    return linha['Centro de custo'] && 
                           linha['Centro de custo'].trim() !== '' &&
                           linha['Valor'] && 
                           !isNaN(parseFloat(linha['Valor']));
                });
                
                if (todosOsDados.length === 0) {
                    mostrarStatusUpload('uploadStatusDados', 'Nenhum dado válido encontrado no arquivo.', 'error');
                    return;
                }
                
                // Salva dados se solicitado
                if (salvar) {
                    try {
                        localStorage.setItem('fleury-dados-csv', csvData);
                    } catch (erro) {
                        console.error('Erro ao salvar dados:', erro);
                    }
                }
                
                // Sucesso!
                const stats = calcularEstatisticas();
                mostrarStatusUpload('uploadStatusDados',
                    `✅ Arquivo "${nomeArquivo}" carregado com sucesso!\n` +
                    `📊 ${stats.total} registros • ${stats.diretorias} diretorias • ${stats.centros} centros de custo\n` +
                    `💰 Valor total: R$ ${stats.valorTotal.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`,
                    'success'
                );
                
                atualizarEstatisticasDados();
                preencherFiltros();
                
                console.log('Dados CSV processados com sucesso:', todosOsDados.length, 'registros');
                
            },
            error: function(erro) {
                mostrarStatusUpload('uploadStatusDados', 'Erro ao processar CSV: ' + erro.message, 'error');
            }
        });
    } catch (erro) {
        mostrarStatusUpload('uploadStatusDados', 'Erro interno no processamento: ' + erro.message, 'error');
    }
}

// MOSTRAR STATUS UPLOAD
function mostrarStatusUpload(elementId, mensagem, tipo) {
    const statusDiv = document.getElementById(elementId);
    if (statusDiv) {
        statusDiv.className = 'upload-status status-' + tipo;
        statusDiv.innerHTML = mensagem.replace(/\n/g, '<br>');
    }
    
    console.log('[UPLOAD ' + tipo.toUpperCase() + ']', mensagem);
}

// CALCULAR ESTATISTICAS
function calcularEstatisticas() {
    return {
        total: todosOsDados.length,
        diretorias: extrairValoresUnicos('N2').length,
        gerencias: extrairValoresUnicos('N3').length,
        centros: extrairValoresUnicos('Centro de custo').length,
        valorTotal: todosOsDados.reduce((sum, linha) => {
            return sum + (parseFloat(linha['Valor']) || 0);
        }, 0)
    };
}

// ATUALIZAR ESTATISTICAS DADOS
function atualizarEstatisticasDados() {
    const estatisticasDiv = document.getElementById('estatisticasDados');
    if (!estatisticasDiv) return;
    
    if (todosOsDados.length === 0) {
        estatisticasDiv.innerHTML = 'Nenhum dado carregado';
        return;
    }
    
    const stats = calcularEstatisticas();
    estatisticasDiv.innerHTML = `
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
            <div style="background: #e3f2fd; padding: 1rem; border-radius: 8px; text-align: center;">
                <strong style="color: #1976d2; font-size: 1.5rem;">${stats.total}</strong><br>
                <span style="color: #1976d2;">Total de Registros</span>
            </div>
            <div style="background: #e8f5e8; padding: 1rem; border-radius: 8px; text-align: center;">
                <strong style="color: #388e3c; font-size: 1.5rem;">${stats.diretorias}</strong><br>
                <span style="color: #388e3c;">Diretorias</span>
            </div>
            <div style="background: #fff3e0; padding: 1rem; border-radius: 8px; text-align: center;">
                <strong style="color: #f57c00; font-size: 1.5rem;">${stats.centros}</strong><br>
                <span style="color: #f57c00;">Centros de Custo</span>
            </div>
            <div style="background: #fce4ec; padding: 1rem; border-radius: 8px; text-align: center;">
                <strong style="color: #c2185b; font-size: 1.5rem;">R$ ${stats.valorTotal.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</strong><br>
                <span style="color: #c2185b;">Valor Total</span>
            </div>
        </div>
    `;
}

// EXTRAIR VALORES UNICOS
function extrairValoresUnicos(nomeColuna) {
    const valores = todosOsDados
        .map(linha => linha[nomeColuna])
        .filter(valor => valor && valor.trim() !== '')
        .map(valor => valor.trim());
    
    return [...new Set(valores)].sort();
}

// PREENCHER FILTROS
function preencherFiltros() {
    console.log('Preenchendo filtros...');
    
    try {
        const valoresN2 = extrairValoresUnicos('N2');
        const valoresN3 = extrairValoresUnicos('N3');
        const valoresCC = extrairValoresUnicos('Centro de custo');
        
        preencherDropdown('listaN2', valoresN2, 'Selecione uma Diretoria/Marca');
        preencherDropdown('listaN3', valoresN3, 'Selecione uma Gerência');
        preencherDropdown('listaCC', valoresCC, 'Selecione um Centro de Custo');
        
        console.log('Filtros preenchidos com sucesso!');
        console.log('- N2 (Diretorias):', valoresN2.length);
        console.log('- N3 (Gerências):', valoresN3.length);
        console.log('- Centros de Custo:', valoresCC.length);
        
    } catch (erro) {
        console.error('Erro ao preencher filtros:', erro);
    }
}

// PREENCHER DROPDOWN
function preencherDropdown(idSelect, valores, textoPlaceholder) {
    const select = document.getElementById(idSelect);
    if (!select) return;
    
    select.innerHTML = '<option value="">' + textoPlaceholder + '</option>';
    
    valores.forEach(valor => {
        const opcao = document.createElement('option');
        opcao.value = valor;
        opcao.textContent = valor;
        select.appendChild(opcao);
    });
}

// APLICAR FILTROS
function aplicarFiltros() {
    console.log('Aplicando filtros...');
    
    if (todosOsDados.length === 0) {
        alert('Nenhum dado disponível. Entre em contato com o administrador.');
        return;
    }
    
    try {
        const filtroN2Ativo = document.getElementById('usarN2').checked;
        const filtroN3Ativo = document.getElementById('usarN3').checked;
        const filtroCCAtivo = document.getElementById('usarCC').checked;
        
        if (!filtroN2Ativo && !filtroN3Ativo && !filtroCCAtivo) {
            alert('Selecione pelo menos um filtro para continuar!');
            return;
        }
        
        dadosFiltrados = todosOsDados.filter(linha => {
            let incluir = true;
            
            if (filtroN2Ativo) {
                const valorSelecionado = document.getElementById('listaN2').value;
                if (valorSelecionado && linha['N2'] !== valorSelecionado) {
                    incluir = false;
                }
            }
            
            if (filtroN3Ativo) {
                const valorSelecionado = document.getElementById('listaN3').value;
                if (valorSelecionado && linha['N3'] !== valorSelecionado) {
                    incluir = false;
                }
            }
            
            if (filtroCCAtivo) {
                const valorSelecionado = document.getElementById('listaCC').value;
                if (valorSelecionado && linha['Centro de custo'] !== valorSelecionado) {
                    incluir = false;
                }
            }
            
            return incluir;
        });
        
        console.log('Filtros aplicados:', dadosFiltrados.length, 'registros encontrados');
        mostrarResultados();
        
    } catch (erro) {
        console.error('Erro ao aplicar filtros:', erro);
        alert('Erro ao aplicar filtros. Tente novamente.');
    }
}

// MOSTRAR RESULTADOS
function mostrarResultados() {
    const containerLista = document.getElementById('listaCentros');
    const elementoTotal = document.getElementById('valorTotal');
    const botaoGerar = document.getElementById('botaoGerar');
    
    if (!containerLista || !elementoTotal || !botaoGerar) return;
    
    if (dadosFiltrados.length === 0) {
        containerLista.innerHTML = '<p style="text-align: center; color: #6c757d;">😕 Nenhum centro encontrado com os filtros selecionados.</p>';
        elementoTotal.textContent = '0,00';
        botaoGerar.disabled = true;
        return;
    }
    
    let total = 0;
    let html = '<ul>';
    
    dadosFiltrados.forEach((linha, index) => {
        const valor = parseFloat(linha['Valor']) || 0;
        total += valor;
        
        html += '<li>';
        html += '<div style="display: flex; justify-content: space-between; align-items: center;">';
        html += '<div>';
        html += '<strong>' + linha['Centro de custo'] + '</strong><br>';
        html += '<small>' + linha['N2'] + ' → ' + linha['N3'] + '</small>';
        html += '</div>';
        html += '<div style="text-align: right;">';
        html += '<strong style="color: #27ae60; font-size: 1.1em;">';
        html += 'R$ ' + valor.toLocaleString('pt-BR', {minimumFractionDigits: 2});
        html += '</strong>';
        html += '</div>';
        html += '</div>';
        html += '</li>';
    });
    
    html += '</ul>';
    containerLista.innerHTML = html;
    elementoTotal.textContent = total.toLocaleString('pt-BR', {minimumFractionDigits: 2});
    botaoGerar.disabled = false;
    
    console.log('Total calculado: R$', total.toFixed(2));
}

// LIMPAR FILTROS
function limparFiltros() {
    console.log('Limpando filtros...');
    
    try {
        // Desmarca checkboxes
        document.getElementById('usarN2').checked = false;
        document.getElementById('usarN3').checked = false;
        document.getElementById('usarCC').checked = false;
        
        // Desabilita e limpa selects
        const selects = ['listaN2', 'listaN3', 'listaCC'];
        selects.forEach(id => {
            const select = document.getElementById(id);
            if (select) {
                select.disabled = true;
                select.value = '';
            }
        });
        
        // Limpa resultados
        const containerLista = document.getElementById('listaCentros');
        const elementoTotal = document.getElementById('valorTotal');
        const botaoGerar = document.getElementById('botaoGerar');
        
        if (containerLista) {
            containerLista.innerHTML = '<p style="text-align: center; color: #6c757d;">👆 Use os filtros acima para selecionar centros</p>';
        }
        if (elementoTotal) {
            elementoTotal.textContent = '0,00';
        }
        if (botaoGerar) {
            botaoGerar.disabled = true;
        }
        
        dadosFiltrados = [];
        console.log('Filtros limpos com sucesso!');
        
    } catch (erro) {
        console.error('Erro ao limpar filtros:', erro);
    }
}

// GERAR PDF
function gerarPDF() {
    if (dadosFiltrados.length === 0) {
        alert('Nenhum dado selecionado para gerar o certificado.');
        return;
    }
    
    console.log('Iniciando geração do PDF...');
    
    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        const margemEsquerda = 20;
        let posicaoY = 30;
        
        // Cabeçalho
        doc.setFontSize(22);
        doc.setFont(undefined, 'bold');
        doc.text('CERTIFICADO DE VERBA', 105, posicaoY, { align: 'center' });
        
        posicaoY += 15;
        doc.setFontSize(16);
        doc.setFont(undefined, 'normal');
        doc.text('Grupo Fleury', 105, posicaoY, { align: 'center' });
        
        posicaoY += 20;
        doc.setFontSize(12);
        const hoje = new Date().toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        doc.text('Data de Emissao: ' + hoje, margemEsquerda, posicaoY);
        
        posicaoY += 10;
        doc.text('Solicitante: ' + usuarioLogado.nome, margemEsquerda, posicaoY);
        
        posicaoY += 20;
        doc.setFont(undefined, 'bold');
        doc.text('CENTROS DE CUSTO AUTORIZADOS:', margemEsquerda, posicaoY);
        
        posicaoY += 15;
        doc.setFont(undefined, 'normal');
        
        // Lista de centros
        let total = 0;
        dadosFiltrados.forEach((linha, index) => {
            const valor = parseFloat(linha['Valor']) || 0;
            total += valor;
            
            if (posicaoY > 250) {
                doc.addPage();
                posicaoY = 30;
            }
            
            const texto = (index + 1) + '. ' + linha['Centro de custo'];
            const valorTexto = 'R$ ' + valor.toLocaleString('pt-BR', {minimumFractionDigits: 2});
            
            doc.text(texto, margemEsquerda, posicaoY);
            doc.text(valorTexto, 190, posicaoY, { align: 'right' });
            
            posicaoY += 6;
            doc.setFontSize(10);
            doc.text('   ' + linha['N2'] + ' → ' + linha['N3'], margemEsquerda, posicaoY);
            posicaoY += 10;
            doc.setFontSize(12);
        });
        
        // Total
        posicaoY += 10;
        doc.setFont(undefined, 'bold');
        doc.setFontSize(16);
        doc.text('VALOR TOTAL AUTORIZADO: R$ ' + total.toLocaleString('pt-BR', {minimumFractionDigits: 2}), margemEsquerda, posicaoY);
        
        // Assinatura
        posicaoY += 40;
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        doc.text('_________________________________', margemEsquerda, posicaoY);
        doc.text('Assinatura do Responsavel', margemEsquerda, posicaoY + 10);
        doc.text(usuarioLogado.nome, margemEsquerda, posicaoY + 20);
        
        doc.text('Documento gerado automaticamente em ' + hoje, margemEsquerda, posicaoY + 35);
        
        // Salva o arquivo
        const nomeArquivo = 'certificado-verba-' + hoje.replace(/[\/\s:]/g, '-') + '.pdf';
        doc.save(nomeArquivo);
        
        console.log('PDF gerado com sucesso:', nomeArquivo);
        alert('🎉 Certificado gerado com sucesso!\n\nO arquivo foi baixado para sua pasta de Downloads.');
        
    } catch (erro) {
        console.error('Erro ao gerar PDF:', erro);
        alert('Erro ao gerar o PDF. Tente usar o navegador Chrome ou Edge.');
    }
}

// GESTAO DE USUARIOS (FUNCOES BASICAS)
function atualizarListaUsuarios() {
    const listaDiv = document.getElementById('listaUsuarios');
    if (!listaDiv) return;
    
    if (usuarios.length === 0) {
        listaDiv.innerHTML = '<p style="text-align: center; color: #6c757d;">Nenhum usuário cadastrado</p>';
        return;
    }
    
    let html = '';
    usuarios.forEach(usuario => {
        html += `
            <div class="usuario-item">
                <div class="usuario-info">
                    <strong>${usuario.nome}</strong>
                    <small>Matrícula: ${usuario.matricula} | Perfil: ${usuario.perfil === 'admin' ? 'Administrador' : 'Usuário'}</small>
                </div>
                <div class="usuario-actions">
                    <button onclick="editarUsuario(${usuario.id})" class="btn btn-info">✏️ Editar</button>
                    <button onclick="excluirUsuario(${usuario.id})" class="btn btn-danger">🗑️ Excluir</button>
                </div>
            </div>
        `;
    });
    
    listaDiv.innerHTML = html;
}

function adicionarUsuario() {
    // Implementar modal de adicionar usuário
    alert('Funcionalidade em desenvolvimento');
}

function editarUsuario(id) {
    // Implementar edição de usuário
    alert('Funcionalidade em desenvolvimento');
}

function excluirUsuario(id) {
    if (confirm('Deseja realmente excluir este usuário?')) {
        usuarios = usuarios.filter(u => u.id !== id);
        salvarUsuarios();
        atualizarListaUsuarios();
    }
}

function processarArquivoUsuarios(arquivo) {
    // Implementar upload de usuários CSV
    alert('Funcionalidade em desenvolvimento');
}

function baixarTemplateUsuarios() {
    // Implementar download de template
    alert('Funcionalidade em desenvolvimento');
}

// LOG DE INICIALIZACAO
console.log('Script carregado completamente!');

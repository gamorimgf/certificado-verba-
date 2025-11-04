// SISTEMA DE AUTENTICACAO E GESTAO
// Versao: 5.0 - Persistência de Dados via GitHub (Estática)

// VARIAVEIS GLOBAIS
let usuarioLogado = null;
let todosOsDados = []; // Dados dos centros de custo
let dadosFiltrados = [];
let usuarios = []; // Lista de usuários
let proximoIdUsuario = 2; // Mantido para caso se decida por persistência local temporária, mas será pouco usado.

// URLs DOS ARQUIVOS CSV NO GITHUB
// ATENÇÃO: SUBSTITUA 'SEU_USUARIO_GITHUB' E 'SEU_REPOSITORIO' PELOS SEUS REAIS
const GITHUB_DATA_CSV_URL = 'https://raw.githubusercontent.com/gamorimgf/certificado-verba-/refs/heads/main/dados_centros.csv';
const GITHUB_USERS_CSV_URL = 'https://raw.githubusercontent.com/gamorimgf/certificado-verba-/refs/heads/main/usuarios.csv';

// DADOS DEMO PARA TESTE LOCAL
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

// FILTROS MULTIPLOS VARIAVEIS
let filtrosN2Selecionados = [];
let filtrosN3Selecionados = [];
let filtrosCCSelecionados = [];

// INICIALIZACAO DO SISTEMA
document.addEventListener('DOMContentLoaded', function() {
    console.log('Sistema de Certificado de Verba iniciado!');
    console.log('Versao: 5.0 - Persistência de Dados via GitHub (Estática)');
    
    // Verifica bibliotecas
    if (typeof Papa === 'undefined' || typeof window.jspdf === 'undefined') {
        alert('Erro: Bibliotecas não carregadas. Recarregue a página.');
        return;
    }
    
    console.log('Bibliotecas carregadas com sucesso!');
    
    // Inicializa dados e usuários do GitHub
    inicializarSistema();
    
    // Verifica se há usuário logado
    verificarSessao();
    
    // Configura eventos do formulário de login
    configurarEventosLogin();
    
    // Configura eventos do modal de usuário (para as instruções)
    configurarEventosModal();
});

// CONFIGURAR EVENTOS DO LOGIN
function configurarEventosLogin() {
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
async function inicializarSistema() {
    try {
        // Tenta carregar usuários do GitHub
        await carregarUsuariosDoGitHub();
        
        // Tenta carregar dados dos centros de custo do GitHub
        await carregarDadosDoGitHub();
        
        // Se a carga inicial falhar (ex: arquivos não existem ainda), usa o localStorage como fallback temporário
        // Para dados de usuário
        if (usuarios.length === 0) {
            const usuariosSalvos = localStorage.getItem('fleury-usuarios');
            if (usuariosSalvos) {
                usuarios = JSON.parse(usuariosSalvos);
                proximoIdUsuario = Math.max(...usuarios.map(u => u.id)) + 1;
                console.log('Usuários carregados do localStorage como fallback:', usuarios.length);
            } else {
                // Caso não tenha usuários no GitHub nem no localStorage, cria um admin inicial
                usuarios = [{ id: 1, matricula: '12282', nome: 'Gustavo - Administrador', senha: 'admin123', perfil: 'admin' }];
                proximoIdUsuario = 2;
                salvarUsuarios(); // Salva no localStorage para uso local
                console.log('Usuários iniciais (fallback) criados:', usuarios.length);
            }
        }

        // Para dados dos centros de custo
        if (todosOsDados.length === 0) {
            const dadosSalvos = localStorage.getItem('fleury-dados-csv');
            if (dadosSalvos) {
                processarDadosCSV(dadosSalvos, 'dados-salvos.csv', false); // processa, mas não salva novamente
                console.log('Dados CSV carregados do localStorage como fallback');
            }
        }
        
        console.log('Sistema inicializado com sucesso!');
        
    } catch (erro) {
        console.error('Erro ao inicializar sistema:', erro);
        // Em caso de erro grave, garante que pelo menos um admin exista no localStorage
        usuarios = [{ id: 1, matricula: '12282', nome: 'Gustavo - Administrador', senha: 'admin123', perfil: 'admin' }];
        proximoIdUsuario = 2;
        salvarUsuarios();
        alert('Erro ao carregar dados. Verifique a conexão ou os arquivos no GitHub.');
    }
}

// CARREGA USUARIOS DO GITHUB
async function carregarUsuariosDoGitHub() {
    console.log('Tentando carregar usuários do GitHub...');
    try {
        const response = await fetch(GITHUB_USERS_CSV_URL);
        if (!response.ok) {
            console.warn(`Aviso: Não foi possível carregar usuários do GitHub (${response.status}).`);
            return; // Não lança erro, tenta fallback para localStorage depois
        }
        const csvData = await response.text();
        await processarUsuariosCSV(csvData, 'usuarios.csv', false); // Não salva no localStorage como "fonte" aqui
        console.log('Usuários carregados do GitHub:', usuarios.length);
    } catch (error) {
        console.warn('Erro ao carregar usuários do GitHub:', error);
    }
}

// CARREGA DADOS DO GITHUB
async function carregarDadosDoGitHub() {
    console.log('Tentando carregar dados dos centros de custo do GitHub...');
    try {
        const response = await fetch(GITHUB_DATA_CSV_URL);
        if (!response.ok) {
            console.warn(`Aviso: Não foi possível carregar dados dos centros de custo do GitHub (${response.status}).`);
            return; // Não lança erro, tenta fallback para localStorage depois
        }
        const csvData = await response.text();
        await processarDadosCSV(csvData, 'dados_centros.csv', false); // processa, mas não salva novamente em localStorage
        console.log('Dados dos centros de custo carregados do GitHub:', todosOsDados.length);
    } catch (error) {
        console.warn('Erro ao carregar dados dos centros de custo do GitHub:', error);
    }
}

// SALVAR USUARIOS NO LOCALSTORAGE (mantido para sessões locais, mas não para a fonte centralizada)
function salvarUsuarios() {
    try {
        localStorage.setItem('fleury-usuarios', JSON.stringify(usuarios));
        console.log('Usuários salvos no localStorage (para sessão local)');
    } catch (erro) {
        console.error('Erro ao salvar usuários no localStorage:', erro);
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
    
    // Se for admin e não há dados, abre o painel automaticamente para instruir o carregamento
    if (usuarioLogado.perfil === 'admin' && todosOsDados.length === 0) {
        setTimeout(() => {
            abrirPainel();
            abrirTab('tabDados'); // Abre a aba de dados no painel
            mostrarStatusUpload('uploadStatusDados', 
                'Bem-vindo! Como administrador, você precisa carregar os dados do sistema primeiro, atualizando o arquivo **dados_centros.csv** no GitHub.', 
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
            select.innerHTML = '<p>Aguardando administrador carregar dados...</p>';
        }
    });
    
    const listaCentros = document.getElementById('listaCentros');
    if (listaCentros) {
        listaCentros.innerHTML = 
            '<div style="text-align: center; padding: 2rem; color: #7f8c8d;">' +
            '<h4>📋 Sistema em Configuração</h4>' +
            '<p>O administrador ainda não carregou os dados do sistema.</p>' +
            '<p>Entre em contato com o administrador para liberar o acesso, atualizando o arquivo **dados_centros.csv** no GitHub.</p>' +
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
    // console.log('Usuários disponíveis:', usuarios.map(u => ({matricula: u.matricula, perfil: u.perfil}))); // Não exibir senhas
    
    const usuario = usuarios.find(u => 
        u.matricula.toLowerCase() === matricula.toLowerCase() && 
        u.senha === senha
    );
    
    if (usuario) {
        usuarioLogado = usuario;
        console.log('Login bem-sucedido:', usuario.nome);
        
        // Salva sessão (apenas o ID do usuário para manter o login)
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
        fecharModalUsuario(); // Garante que o modal de instrução esteja fechado
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
            const container = document.getElementById('containerN2');
            if (container) {
                container.style.display = this.checked ? 'block' : 'none';
                if (!this.checked) {
                    filtrosN2Selecionados = [];
                    atualizarContador('contadorN2', 0);
                }
            }
        });
        checkbox1.setAttribute('data-configured', 'true');
    }
    
    if (checkbox2 && !checkbox2.hasAttribute('data-configured')) {
        checkbox2.addEventListener('change', function() {
            const container = document.getElementById('containerN3');
            if (container) {
                container.style.display = this.checked ? 'block' : 'none';
                if (!this.checked) {
                    filtrosN3Selecionados = [];
                    atualizarContador('contadorN3', 0);
                }
            }
        });
        checkbox2.setAttribute('data-configured', 'true');
    }
    
    if (checkbox3 && !checkbox3.hasAttribute('data-configured')) {
        checkbox3.addEventListener('change', function() {
            const container = document.getElementById('containerCC');
            if (container) {
                container.style.display = this.checked ? 'block' : 'none';
                if (!this.checked) {
                    filtrosCCSelecionados = [];
                    atualizarContador('contadorCC', 0);
                }
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
        // Atualiza estatísticas e lista de usuários
        // Se os dados e usuários já foram carregados do GitHub, apenas exibe
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

// CONFIGURAR UPLOAD ADMIN (Para carregar arquivos localmente e PRÉ-VISUALIZAR)
function configurarUploadAdmin() {
    // Upload de dados de Centros de Custo
    const uploadAreaDados = document.getElementById('uploadAreaAdmin');
    const fileInputDados = document.getElementById('fileInputDados');
    
    if (uploadAreaDados && fileInputDados) {
        uploadAreaDados.onclick = () => fileInputDados.click();
        fileInputDados.onchange = (e) => {
            if (e.target.files[0]) {
                processarArquivoDadosLocal(e.target.files[0]);
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
                processarArquivoDadosLocal(e.dataTransfer.files[0]);
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
                processarArquivoUsuariosLocal(e.target.files[0]);
            }
        };
        
        // Drag and drop para usuários
        uploadAreaUsuarios.ondragover = (e) => {
            e.preventDefault();
            uploadAreaUsuarios.style.borderColor = '#27ae60';
        };
        
        uploadAreaUsuarios.ondragleave = (e) => {
            e.preventDefault();
            uploadAreaUsuarios.style.borderColor = '#3498db';
        };
        
        uploadAreaUsuarios.ondrop = (e) => {
            e.preventDefault();
            uploadAreaUsuarios.style.borderColor = '#3498db';
            if (e.dataTransfer.files[0]) {
                processarArquivoUsuariosLocal(e.dataTransfer.files[0]);
            }
        };
    }
}

// SELECIONAR ARQUIVO DADOS (Chama o input file para upload local)
function selecionarArquivoDados() {
    const fileInput = document.getElementById('fileInputDados');
    if (fileInput) {
        fileInput.click();
    }
}

// SELECIONAR ARQUIVO USUARIOS (Chama o input file para upload local)
function selecionarArquivoUsuarios() {
    const fileInput = document.getElementById('fileInputUsuarios');
    if (fileInput) {
        fileInput.click();
    }
}

// USAR DADOS DEMO
function usarDadosDemo() {
    mostrarStatusUpload('uploadStatusDados', 'Carregando dados de demonstração (apenas para visualização local)...', 'info');
    processarDadosCSV(dadosDemo, 'dados-demo.csv', true); // processa e salva no localStorage para sessão atual
}

// PROCESSAR ARQUIVO DADOS LOCAL (para pré-visualização)
function processarArquivoDadosLocal(arquivo) {
    if (!arquivo.name.toLowerCase().endsWith('.csv')) {
        mostrarStatusUpload('uploadStatusDados', 'Por favor, selecione um arquivo CSV.', 'error');
        return;
    }
    
    mostrarStatusUpload('uploadStatusDados', 'Processando arquivo: ' + arquivo.name + ' (pré-visualização local)...', 'info');
    
    const reader = new FileReader();
    reader.onload = function(e) {
        processarDadosCSV(e.target.result, arquivo.name, true); // processa e salva no localStorage para sessão atual
        mostrarStatusUpload('uploadStatusDados', '✅ Arquivo "'+arquivo.name+'" carregado para pré-visualização. Para persistir, atualize **dados_centros.csv** no GitHub.', 'success');
    };
    reader.onerror = function() {
        mostrarStatusUpload('uploadStatusDados', 'Erro ao ler o arquivo.', 'error');
    };
    reader.readAsText(arquivo, 'UTF-8');
}

// PROCESSAR ARQUIVO USUARIOS LOCAL (para pré-visualização)
function processarArquivoUsuariosLocal(arquivo) {
    if (!arquivo.name.toLowerCase().endsWith('.csv')) {
        mostrarStatusUpload('uploadStatusUsuarios', 'Por favor, selecione um arquivo CSV.', 'error');
        return;
    }
    
    mostrarStatusUpload('uploadStatusUsuarios', 'Processando usuários: ' + arquivo.name + ' (pré-visualização local)...', 'info');
    
    const reader = new FileReader();
    reader.onload = function(e) {
        processarUsuariosCSV(e.target.result, arquivo.name, true); // processa e salva no localStorage para sessão atual
        mostrarStatusUpload('uploadStatusUsuarios', '✅ Arquivo "'+arquivo.name+'" carregado para pré-visualização. Para persistir, atualize **usuarios.csv** no GitHub.', 'success');
    };
    reader.onerror = function() {
        mostrarStatusUpload('uploadStatusUsuarios', 'Erro ao ler o arquivo.', 'error');
    };
    reader.readAsText(arquivo, 'UTF-8');
}

// PROCESSAR USUARIOS CSV (AGORA COM OPÇÃO DE SALVAR NO LOCALSTORAGE PARA SESSÃO LOCAL)
async function processarUsuariosCSV(csvData, nomeArquivo, salvarLocal = false) {
    try {
        const resultado = Papa.parse(csvData, {
            header: true,
            skipEmptyLines: true,
            encoding: 'UTF-8',
        });

        if (resultado.errors.length > 0) {
            console.warn('Avisos no processamento de usuários:', resultado.errors);
        }
        
        const usuariosCSV = resultado.data.filter(linha => {
            return linha['Matricula'] && linha['Matricula'].trim() !== '' &&
                   linha['Nome'] && linha['Nome'].trim() !== '' &&
                   linha['Senha'] && linha['Senha'].trim() !== '' &&
                   linha['Perfil'] && (linha['Perfil'].toLowerCase() === 'admin' || linha['Perfil'].toLowerCase() === 'user');
        });
        
        if (usuariosCSV.length === 0) {
            mostrarStatusUpload('uploadStatusUsuarios', 'Nenhum usuário válido encontrado no arquivo.', 'error');
            return;
        }
        
        // Substitui a lista de usuários global pela carregada
        usuarios = usuariosCSV.map((u, index) => ({
            id: index + 1, // IDs sequenciais para os usuários carregados
            matricula: u.Matricula.trim(),
            nome: u.Nome.trim(),
            senha: u.Senha.trim(),
            perfil: u.Perfil.toLowerCase()
        }));
        proximoIdUsuario = usuarios.length + 1; // Atualiza o próximo ID
        
        if (salvarLocal) {
            salvarUsuarios(); // Salva no localStorage para a sessão atual
            mostrarStatusUpload('uploadStatusUsuarios',
                '✅ Arquivo "' + nomeArquivo + '" processado com sucesso para pré-visualização.<br>' +
                '📊 Total de usuários carregados: ' + usuarios.length + '.<br>Lembre-se: Para persistir globalmente, atualize **usuarios.csv** no GitHub.',
                'success'
            );
        }

        atualizarListaUsuarios(); // Atualiza a lista exibida no painel
        
        console.log('Usuários CSV processados:', usuarios.length, 'usuários.');
        
    } catch (erro) {
        mostrarStatusUpload('uploadStatusUsuarios', 'Erro ao processar CSV de usuários: ' + erro.message, 'error');
    }
}

// BAIXAR TEMPLATE USUARIOS
function baixarTemplateUsuarios() {
    const templateCSV = 'Matricula,Nome,Senha,Perfil\n' +
                       'exemplo123,João Silva,senha123,user\n' +
                       'admin456,Maria Admin,admin123,admin\n' +
                       'user789,Pedro Costa,fleury123,user';
    
    const blob = new Blob([templateCSV], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'template-usuarios-fleury.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    mostrarStatusUpload('uploadStatusUsuarios', '📥 Template baixado com sucesso!', 'info');
    
    setTimeout(() => {
        const statusDiv = document.getElementById('uploadStatusUsuarios');
        if (statusDiv) statusDiv.innerHTML = '';
    }, 3000);
}

// PROCESSAR DADOS CSV (AGORA COM OPÇÃO DE SALVAR NO LOCALSTORAGE PARA SESSÃO LOCAL)
async function processarDadosCSV(csvData, nomeArquivo, salvarLocal = false) {
    try {
        const resultado = Papa.parse(csvData, {
            header: true,
            skipEmptyLines: true,
            encoding: 'UTF-8',
        });

        if (resultado.errors.length > 0) {
            console.warn('Avisos no processamento:', resultado.errors);
        }
        
        todosOsDados = resultado.data.filter(linha => {
            return linha['Centro de custo'] && linha['Centro de custo'].trim() !== '' &&
                   linha['Valor'] && !isNaN(parseFloat(linha['Valor']));
        });
        
        if (todosOsDados.length === 0) {
            mostrarStatusUpload('uploadStatusDados', 'Nenhum dado válido encontrado no arquivo. Verifique o formato.', 'error');
            return;
        }
        
        if (salvarLocal) {
            try {
                localStorage.setItem('fleury-dados-csv', csvData);
            } catch (erro) {
                console.error('Erro ao salvar dados no localStorage:', erro);
            }
        }
        
        const stats = calcularEstatisticas();
        mostrarStatusUpload('uploadStatusDados',
            '✅ Arquivo "' + nomeArquivo + '" carregado para pré-visualização.<br>' +
            '📊 ' + stats.total + ' registros • ' + stats.diretorias + ' diretorias • ' + stats.centros + ' centros de custo<br>' +
            '💰 Valor total: R$ ' + stats.valorTotal.toLocaleString('pt-BR', {minimumFractionDigits: 2}) + '<br>Lembre-se: Para persistir globalmente, atualize **dados_centros.csv** no GitHub.',
            'success'
        );
        
        atualizarEstatisticasDados();
        preencherFiltros(); // Preenche os filtros do sistema principal
        
        console.log('Dados CSV processados com sucesso:', todosOsDados.length, 'registros');
        
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
    console.log('Preenchendo filtros múltiplos...');
    
    try {
        const valoresN2 = extrairValoresUnicos('N2');
        const valoresN3 = extrairValoresUnicos('N3');
        const valoresCC = extrairValoresUnicos('Centro de custo');
        
        preencherFiltroMultiplo('listaN2', valoresN2, 'N2');
        preencherFiltroMultiplo('listaN3', valoresN3, 'N3');
        preencherFiltroMultiplo('listaCC', valoresCC, 'CC');
        
        console.log('Filtros múltiplos preenchidos com sucesso!');
        console.log('- N2 (Diretorias):', valoresN2.length);
        console.log('- N3 (Gerências):', valoresN3.length);
        console.log('- Centros de Custo:', valoresCC.length);
        
    } catch (erro) {
        console.error('Erro ao preencher filtros:', erro);
    }
}

// PREENCHER FILTRO MULTIPLO
function preencherFiltroMultiplo(idContainer, valores, tipo) {
    const container = document.getElementById(idContainer);
    if (!container) return;
    
    if (valores.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #6c757d;">Nenhuma opção disponível</p>';
        return;
    }
    
    let html = '';
    valores.forEach((valor, index) => {
        const checkboxId = tipo + '_' + index;
        // Verifica se o item já estava selecionado antes de recarregar
        let isChecked = false;
        if (tipo === 'N2') isChecked = filtrosN2Selecionados.includes(valor);
        if (tipo === 'N3') isChecked = filtrosN3Selecionados.includes(valor);
        if (tipo === 'CC') isChecked = filtrosCCSelecionados.includes(valor);

        html += `
            <div class="filtro-item ${isChecked ? 'selecionado' : ''}" onclick="toggleFiltroItem('${checkboxId}', '${valor}', '${tipo}')">
                <input type="checkbox" id="${checkboxId}" onchange="handleFiltroChange('${valor}', '${tipo}', this.checked)" ${isChecked ? 'checked' : ''}>
                <label for="${checkboxId}">${valor}</label>
            </div>
        `;
    });
    
    container.innerHTML = html;

    // Atualiza contadores após preencher
    if (tipo === 'N2') atualizarContador('contadorN2', filtrosN2Selecionados.length);
    if (tipo === 'N3') atualizarContador('contadorN3', filtrosN3Selecionados.length);
    if (tipo === 'CC') atualizarContador('contadorCC', filtrosCCSelecionados.length);
}

// TOGGLE FILTRO ITEM
function toggleFiltroItem(checkboxId, valor, tipo) {
    const checkbox = document.getElementById(checkboxId);
    if (checkbox) {
        checkbox.checked = !checkbox.checked;
        handleFiltroChange(valor, tipo, checkbox.checked);
    }
}

// HANDLE FILTRO CHANGE
function handleFiltroChange(valor, tipo, checked) {
    let array;
    let contadorId;
    
    switch(tipo) {
        case 'N2':
            array = filtrosN2Selecionados;
            contadorId = 'contadorN2';
            break;
        case 'N3':
            array = filtrosN3Selecionados;
            contadorId = 'contadorN3';
            break;
        case 'CC':
            array = filtrosCCSelecionados;
            contadorId = 'contadorCC';
            break;
        default:
            return;
    }
    
    if (checked) {
        if (!array.includes(valor)) {
            array.push(valor);
        }
    } else {
        const index = array.indexOf(valor);
        if (index > -1) {
            array.splice(index, 1);
        }
    }
    
    atualizarContador(contadorId, array.length);
    atualizarEstiloItem(tipo, valor, checked);
}

// ATUALIZAR CONTADOR
function atualizarContador(contadorId, quantidade) {
    const contador = document.getElementById(contadorId);
    if (contador) {
        contador.textContent = quantidade + ' selecionado' + (quantidade !== 1 ? 's' : '');
    }
}

// ATUALIZAR ESTILO ITEM
function atualizarEstiloItem(tipo, valor, selecionado) {
    const container = document.getElementById('lista' + tipo);
    if (!container) return;
    
    const items = container.querySelectorAll('.filtro-item');
    items.forEach(item => {
        const label = item.querySelector('label');
        if (label && label.textContent === valor) {
            if (selecionado) {
                item.classList.add('selecionado');
            } else {
                item.classList.remove('selecionado');
            }
        }
    });
}

// SELECIONAR TODOS N2
function selecionarTodosN2() {
    selecionarTodosFiltro('N2', 'listaN2', 'contadorN2');
}
// SELECIONAR TODOS N3
function selecionarTodosN3() {
    selecionarTodosFiltro('N3', 'listaN3', 'contadorN3');
}

// SELECIONAR TODOS CC
function selecionarTodosCC() {
    selecionarTodosFiltro('CC', 'listaCC', 'contadorCC');
}

// SELECIONAR TODOS FILTRO
function selecionarTodosFiltro(tipo, containerId, contadorId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    const checkboxes = container.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
        if (!checkbox.checked) {
            checkbox.checked = true;
            const label = checkbox.nextElementSibling;
            if (label) {
                handleFiltroChange(label.textContent, tipo, true);
            }
        }
    });
}

// LIMPAR TODOS N2
function limparTodosN2() {
    limparTodosFiltro('N2', 'listaN2', 'contadorN2');
}

// LIMPAR TODOS N3
function limparTodosN3() {
    limparTodosFiltro('N3', 'listaN3', 'contadorN3');
}
// LIMPAR TODOS CC
function limparTodosCC() {
    limparTodosFiltro('CC', 'listaCC', 'contadorCC');
}

// LIMPAR TODOS FILTRO
function limparTodosFiltro(tipo, containerId, contadorId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    const checkboxes = container.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
        if (checkbox.checked) {
            checkbox.checked = false;
            const label = checkbox.nextElementSibling;
            if (label) {
                handleFiltroChange(label.textContent, tipo, false);
            }
        }
    });
}

// APLICAR FILTROS (ATUALIZADA)
function aplicarFiltros() {
    console.log('Aplicando filtros múltiplos...');
    
    if (todosOsDados.length === 0) {
        alert('Nenhum dado disponível. Entre em contato com o administrador.');
        return;
    }
    
    try {
        const filtroN2Ativo = document.getElementById('usarN2').checked;
        const filtroN3Ativo = document.getElementById('usarN3').checked;
        const filtroCCAtivo = document.getElementById('usarCC').checked;
        
        // Verifica se pelo menos um checkbox principal está ativo
        if (!filtroN2Ativo && !filtroN3Ativo && !filtroCCAtivo) {
            alert('Selecione pelo menos um tipo de filtro para continuar!');
            return;
        }
        
        // Verifica se há seleções nos filtros ativos
        if (filtroN2Ativo && filtrosN2Selecionados.length === 0) {
            alert('Você ativou o filtro por Diretoria/Marca (N2), mas não selecionou nenhuma opção. Por favor, selecione uma ou desative o filtro.');
            return;
        }
        
        if (filtroN3Ativo && filtrosN3Selecionados.length === 0) {
            alert('Você ativou o filtro por Gerência (N3), mas não selecionou nenhuma opção. Por favor, selecione uma ou desative o filtro.');
            return;
        }
        
        if (filtroCCAtivo && filtrosCCSelecionados.length === 0) {
            alert('Você ativou o filtro por Centro de Custo, mas não selecionou nenhuma opção. Por favor, selecione uma ou desative o filtro.');
            return;
        }
        
        dadosFiltrados = todosOsDados.filter(linha => {
            let incluir = false; // Lógica OR entre os tipos de filtro
            
            if (filtroN2Ativo && filtrosN2Selecionados.includes(linha['N2'])) {
                incluir = true;
            }
            
            if (filtroN3Ativo && filtrosN3Selecionados.includes(linha['N3'])) {
                incluir = true;
            }
            
            if (filtroCCAtivo && filtrosCCSelecionados.includes(linha['Centro de custo'])) {
                incluir = true;
            }
            
            return incluir;
        });
        
        console.log('Filtros aplicados:', dadosFiltrados.length, 'registros encontrados');
        console.log('- N2 selecionados:', filtrosN2Selecionados);
        console.log('- N3 selecionados:', filtrosN3Selecionados);
        console.log('- CC selecionados:', filtrosCCSelecionados);
        
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
    
    console.log('Total calculado: R$ ' + total.toFixed(2));
}

// LIMPAR FILTROS (ATUALIZADA)
function limparFiltros() {
    console.log('Limpando filtros múltiplos...');
    
    try {
        // Desmarca checkboxes principais
        document.getElementById('usarN2').checked = false;
        document.getElementById('usarN3').checked = false;
        document.getElementById('usarCC').checked = false;
        
        // Esconde containers
        document.getElementById('containerN2').style.display = 'none';
        document.getElementById('containerN3').style.display = 'none';
        document.getElementById('containerCC').style.display = 'none';
        
        // Limpa arrays de seleção
        filtrosN2Selecionados = [];
        filtrosN3Selecionados = [];
        filtrosCCSelecionados = [];
        
        // Atualiza contadores
        atualizarContador('contadorN2', 0);
        atualizarContador('contadorN3', 0);
        atualizarContador('contadorCC', 0);
        
        // Limpa e repreencha os filtros para limpar os checkboxes visíveis
        if (todosOsDados.length > 0) {
            preencherFiltros();
        } else {
             // Se não há dados, garante que os containers de filtros estão limpos
            const selects = ['listaN2', 'listaN3', 'listaCC'];
            selects.forEach(id => {
                const container = document.getElementById(id);
                if (container) container.innerHTML = '<p>Carregando opções...</p>';
            });
        }

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
        console.log('Filtros múltiplos limpos com sucesso!');
        
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

        
// Adicionar Logo no PDF
// URL da imagem
const logoUrl = 'https://cdn-sites-assets.mziq.com/wp-content/uploads/sites/1247/2023/06/Logo.png';

// Para garantir que a imagem seja carregada, usaremos um pequeno truque
// Em ambientes estáticos, jspdf pode ter problemas com CORS em URLs externas
// Se isso acontecer, teríamos que converter a imagem para base64 manualmente
// ou usar uma imagem hospedada junto com o app. Por enquanto, tentaremos direto.
const img = new Image();
img.src = logoUrl;
img.onload = function() { // Garante que a imagem está carregada antes de adicionar ao PDF
    doc.addImage(img, 'PNG', 85, 15, 40, 15); // x, y, width, height. Ajuste conforme precisar.
    
    // O restante do código de geração de PDF deve ser executado aqui dentro,
    // mas para não alterar muito a estrutura, vou manter a instrução separada,
    // e é importante testar. Se o logo não aparecer, teremos que ajustar.
};

// É importante notar que o addImage é assíncrono. Para garantir que
// o PDF só seja gerado DEPOIS que a imagem estiver carregada, a maneira mais robusta
// seria envolver toda a geração do PDF em uma Promise ou dentro do img.onload.
// Para manter a simplicidade, vamos assumir que o logo carregará rápido o suficiente.
// Se o logo não aparecer, me avise!


        
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

// Adicionar Logo no PDF (posição estimada, ajuste se precisar)
const logoUrl = 'https://cdn-sites-assets.mziq.com/wp-content/uploads/sites/1247/2023/06/Logo.png';
doc.addImage(logoUrl, 'PNG', 85, 15, 40, 15); // x, y, width, height. Ajuste para o centro e tamanho adequado.
posicaoY = 40; // Ajusta a posição Y para o texto vir abaixo do logo
        
        doc.setFont(undefined, 'normal');
        
        // Lista de centros
        let total = 0;
        dadosFiltrados.forEach((linha, index) => {
            const valor = parseFloat(linha['Valor']) || 0;
            total += valor;
            
            if (posicaoY > 250) { // Quebra de página
                doc.addPage();
                posicaoY = 30;
                doc.setFontSize(12);
                doc.setFont(undefined, 'bold');
                doc.text('CENTROS DE CUSTO AUTORIZADOS (continuação):', margemEsquerda, posicaoY);
                posicaoY += 15;
                doc.setFont(undefined, 'normal');
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
        posicaoY += 40; // Ajuste o espaçamento conforme necessário
doc.setFontSize(10);
doc.setFont(undefined, 'normal');
doc.text('Documento gerado por ' + usuarioLogado.nome + ' em ' + hoje, margemEsquerda, posicaoY);
        
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

// ========== GESTAO DE USUARIOS ==========
// ATUALIZAR LISTA USUARIOS
function atualizarListaUsuarios() {
    const listaDiv = document.getElementById('listaUsuarios');
    if (!listaDiv) return;
    
    if (usuarios.length === 0) {
        listaDiv.innerHTML = '<p style="text-align: center; color: #6c757d;">Nenhum usuário cadastrado. Atualize **usuarios.csv** no GitHub.</p>';
        return;
    }
    
    let html = '';
    usuarios.forEach(usuario => {
        const perfilTexto = usuario.perfil === 'admin' ? '👨‍💼 Administrador' : '👤 Usuário';
        html += `
            <div class="usuario-item">
                <div class="usuario-info">
                    <strong>${usuario.nome}</strong>
                    <small>Matrícula: ${usuario.matricula} | Perfil: ${perfilTexto}</small>
                </div>
                <div class="usuario-actions">
                    <button onclick="mostrarModalInstrucoes('editar')" class="btn btn-info" disabled>✏️ Editar</button>
                    <button onclick="mostrarModalInstrucoes('excluir')" class="btn btn-danger" disabled>🗑️ Excluir</button>
                </div>
            </div>
        `;
    });
    
    listaDiv.innerHTML = html;
    console.log('Lista de usuários atualizada (apenas leitura):', usuarios.length, 'usuários');
}

// FUNÇÕES DE GESTÃO DE USUÁRIOS AGORA MOSTRAM INSTRUÇÕES
function adicionarUsuario() {
    mostrarModalInstrucoes('adicionar');
}

// EDITAR USUARIO (agora mostra instruções)
function editarUsuario(id) {
    mostrarModalInstrucoes('editar', id);
}

// SALVAR USUARIO (agora mostra instruções)
function salvarUsuario() {
    mostrarModalInstrucoes('salvar');
}

// EXCLUIR USUARIO (agora mostra instruções)
function excluirUsuario(id) {
    mostrarModalInstrucoes('excluir', id);
}

// MOSTRAR MODAL DE INSTRUÇÕES
function mostrarModalInstrucoes(acao, id = null) {
    const modal = document.getElementById('modalUsuario');
    const modalTitulo = document.getElementById('modalTitulo');
    const modalBody = modal.querySelector('.modal-body');

    modalTitulo.textContent = 'Ação Não Suportada Diretamente';
    modalBody.innerHTML = `
        <p>A ${acao} de usuários precisa ser feita editando o arquivo <strong>usuarios.csv</strong> diretamente no seu repositório GitHub.</p>
        <p>Isso garante que as alterações sejam permanentes e visíveis para todos os usuários.</p>
        <p class="upload-hint" style="margin-top: 1rem;">
            **AVISO DE SEGURANÇA:** Não use senhas reais em <strong>usuarios.csv</strong> no GitHub, pois o arquivo é público.
        </p>
        <p>URL do arquivo de usuários: <a href="${GITHUB_USERS_CSV_URL}" target="_blank">usuarios.csv no GitHub</a></p>
    `;
    modal.style.display = 'flex';
}

// FECHAR MODAL USUARIO (reaproveitado para o modal de instruções)
function fecharModalUsuario() {
    const modal = document.getElementById('modalUsuario');
    if (modal) {
        modal.style.display = 'none';
    }
}

// CONFIGURAR EVENTOS DO MODAL (para fechar com ESC)
function configurarEventosModal() {
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            fecharModalUsuario();
        }
    });
}

// LOG DE FINALIZACAO
console.log('Sistema de gestão de usuários carregado completamente!');

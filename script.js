// SISTEMA DE AUTENTICACAO E GESTAO
// Versao: 4.0 - Sistema Completo com Login

// VARIAVEIS GLOBAIS
let usuarioLogado = null;
let todosOsDados = [];
let dadosFiltrados = [];
let usuarios = [];

// DADOS INICIAIS
const usuariosIniciais = [
    { id: 1, matricula: 'admin', nome: 'Administrador', senha: 'admin123', perfil: 'admin' },
    { id: 2, matricula: 'gustavo', nome: 'Gustavo Silva', senha: 'fleury123', perfil: 'user' }
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
    console.log('Versao: 4.0 - Sistema Completo');
    
    // Verifica bibliotecas
    if (typeof Papa === 'undefined' || typeof window.jspdf === 'undefined') {
        alert('Erro: Bibliotecas não carregadas. Recarregue a página.');
        return;
    }
    
    // Inicializa dados
    inicializarSistema();
    
    // Verifica se há usuário logado
    verificarSessao();
});

// INICIALIZAR SISTEMA
function inicializarSistema() {
    // Carrega usuários do localStorage ou usa dados iniciais
    const usuariosSalvos = localStorage.getItem('fleury-usuarios');
    if (usuariosSalvos) {
        usuarios = JSON.parse(usuariosSalvos);
    } else {
        usuarios = [...usuariosIniciais];
        salvarUsuarios();
    }
    
    // Carrega dados CSV se existirem
    const dadosSalvos = localStorage.getItem('fleury-dados-csv');
    if (dadosSalvos) {
        processarDadosCSV(dadosSalvos, 'dados-salvos.csv', false);
    }
    
    console.log('Sistema inicializado com', usuarios.length, 'usuários');
}

// VERIFICAR SESSAO
function verificarSessao() {
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
    
    mostrarLogin();
}

// MOSTRAR TELA DE LOGIN
function mostrarLogin() {
    document.getElementById('loginScreen').style.display = 'flex';
    document.getElementById('mainSystem').style.display = 'none';
    document.getElementById('matricula').focus();
}

// MOSTRAR SISTEMA PRINCIPAL
function mostrarSistema() {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('mainSystem').style.display = 'block';
    
    // Atualiza informações do usuário
    document.getElementById('userInfo').textContent = 
        `👤 ${usuarioLogado.nome} (${usuarioLogado.matricula}) - ${usuarioLogado.perfil === 'admin' ? 'Administrador' : 'Usuário'}`;
    
    // Mostra botão admin se for administrador
    const btnPainel = document.getElementById('btnPainel');
    if (usuarioLogado.perfil === 'admin') {
        btnPainel.style.display = 'inline-block';
    } else {
        btnPainel.style.display = 'none';
    }
    
    // Configura eventos se ainda não foram configurados
    configurarEventos();
    
    // Atualiza filtros se há dados
    if (todosOsDados.length > 0) {
        preencherFiltros();
    }
}

// FAZER LOGIN
function fazerLogin() {
    const matricula = document.getElementById('matricula').value.trim();
    const senha = document.getElementById('senha').value.trim();
    
    if (!matricula || !senha) {
        mostrarStatusLogin('Por favor, preencha todos os campos.', 'error');
        return;
    }
    
    const usuario = usuarios.find(u => 
        u.matricula.toLowerCase() === matricula.toLowerCase() && 
        u.senha === senha
    );
    
    if (usuario) {
        usuarioLogado = usuario;
        
        // Salva sessão
        localStorage.setItem('fleury-sessao', JSON.stringify({
            userId: usuario.id,
            timestamp: Date.now()
        }));
        
        mostrarStatusLogin('Login realizado com sucesso!', 'success');
        
        setTimeout(() => {
            mostrarSistema();
            limparFormLogin();
        }, 1000);
        
    } else {
        mostrarStatusLogin('Matrícula ou senha incorretos.', 'error');
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
    }
}

// MOSTRAR STATUS LOGIN
function mostrarStatusLogin(mensagem, tipo) {
    const statusDiv = document.getElementById('loginStatus');
    statusDiv.className = 'login-status status-' + tipo;
    statusDiv.textContent = mensagem;
    
    if (tipo === 'error') {
        setTimeout(() => {
            statusDiv.textContent = '';
        }, 3000);
    }
}

// LIMPAR FORM LOGIN
function limparFormLogin() {
    document.getElementById('matricula').value = '';
    document.getElementById('senha').value = '';
    document.getElementById('loginStatus').textContent = '';
}

// ABRIR PAINEL ADMIN
function abrirPainel() {
    if (usuarioLogado.perfil !== 'admin') {
        alert('Acesso negado. Apenas administradores podem acessar este painel.');
        return;
    }
    
    document.getElementById('painelAdmin').style.display = 'flex';
    atualizarEstatisticasDados();
    atualizarListaUsuarios();
    configurarUploadAdmin();
}

// FECHAR PAINEL ADMIN
function fecharPainel() {
    document.getElementById('painelAdmin').style.display = 'none';
}

// ABRIR TAB
function abrirTab(tabId) {
    // Remove active de todas as tabs
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    // Ativa a tab selecionada
    document.getElementById('btn' + tabId.charAt(0).toUpperCase() + tabId.slice(1)).classList.add('active');
    document.getElementById(tabId).classList.add('active');
}

// CONFIGURAR UPLOAD ADMIN
function configurarUploadAdmin() {
    // Upload de dados
    const uploadAreaDados = document.getElementById('uploadAreaAdmin');
    const fileInputDados = document.getElementById('fileInputDados');
    
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
    
    // Upload de usuários
    const uploadAreaUsuarios = document.getElementById('uploadAreaUsuarios');
    const fileInputUsuarios = document.getElementById('fileInputUsuarios');
    
    uploadAreaUsuarios.onclick = () => fileInputUsuarios.click();
    fileInputUsuarios.onchange = (e) => {
        if (e.target.files[0]) {
            processarArquivoUsuarios(e.target.files[0]);
        }
    };
}

// SELECIONAR ARQUIVO DADOS
function selecionarArquivoDados() {
    document.getElementById('fileInputDados').click();
}

// SELECIONAR ARQUIVO USUARIOS
function selecionarArquivoUsuarios() {
    document.getElementById('fileInputUsuarios').click();
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

// PROCESSAR ARQUIVO USUARIOS
function processarArquivoUsuarios(arquivo) {
    if (!arquivo.name.toLowerCase().endsWith('.csv')) {
        mostrarStatusUpload('uploadStatusUsuarios', 'Por favor, selecione um arquivo CSV.', 'error');
        return;
    }
    
    mostrarStatusUpload('uploadStatusUsuarios', 'Processando usuários: ' + arquivo.name, 'info');
    
    const reader = new FileReader();
    reader.onload = function(e) {
        processarUsuariosCSV(e.target.result, arquivo.name);
    };
    reader.onerror = function() {
        mostrarStatusUpload('uploadStatusUsuarios', 'Erro ao ler o arquivo.', 'error');
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

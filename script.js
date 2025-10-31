// 🏢 CONFIGURAÇÃO ONEDRIVE CORPORATIVO
const CONFIG = {
    // Cole aqui o link do seu OneDrive
    ONEDRIVE_URL:
        https://hermespardini-my.sharepoint.com/:x:/g/personal/gustavo_amorim_grupopardini_com_br/EVXeEk9bOkFBh_Gfa0I2vkoBIB7Hqcg6kBf6vRqUihhhfg?email=gustavo.amorim%40grupofleury.com.br&e=3nhasj,
    
    // Configurações de cache
    CACHE_DURATION: 5 * 60 * 1000, // 5 minutos
    
    // Configurações de retry
    MAX_RETRIES: 3,
    RETRY_DELAY: 2000 // 2 segundos
};

// 📥 FUNÇÃO PRINCIPAL DE CARREGAMENTO
async function carregarDados() {
    console.log('🏢 Carregando dados do OneDrive Corporativo...');
    
    try {
        mostrarLoading();
        
        // Verifica cache primeiro
        const dadosCache = verificarCache();
        if (dadosCache) {
            console.log('📦 Usando dados do cache');
            processarDados(dadosCache);
            return;
        }
        
        // Carrega dados do OneDrive
        const dadosOneDrive = await carregarDoOneDrive();
        if (dadosOneDrive) {
            salvarCache(dadosOneDrive);
            processarDados(dadosOneDrive);
            return;
        }
        
        // Fallback para dados locais
        console.log('⚠️ Usando dados locais como fallback');
        await carregarDadosLocais();
        
    } catch (erro) {
        console.error('❌ Erro geral no carregamento:', erro);
        mostrarErro('Erro ao carregar dados. Verifique sua conexão com o OneDrive.');
    }
}

// 🌐 CARREGA DADOS DO ONEDRIVE
async function carregarDoOneDrive(tentativa = 1) {
    try {
        console.log(`🔄 Tentativa ${tentativa} de carregar do OneDrive...`);
        
        const resposta = await fetch(CONFIG.ONEDRIVE_URL, {
            method: 'GET',
            headers: {
                'Accept': 'text/csv,text/plain,*/*',
                'Cache-Control': 'no-cache'
            }
        });
        
        if (!resposta.ok) {
            throw new Error(`HTTP ${resposta.status}: ${resposta.statusText}`);
        }
        
        const dadosCSV = await resposta.text();
        
        if (!dadosCSV || dadosCSV.trim() === '') {
            throw new Error('Arquivo CSV vazio ou inválido');
        }
        
        console.log('✅ Dados carregados do OneDrive:', dadosCSV.length, 'caracteres');
        return dadosCSV;
        
    } catch (erro) {
        console.warn(`⚠️ Erro na tentativa ${tentativa}:`, erro.message);
        
        if (tentativa < CONFIG.MAX_RETRIES) {
            console.log(`�� Tentando novamente em ${CONFIG.RETRY_DELAY/1000}s...`);
            await new Promise(resolve => setTimeout(resolve, CONFIG.RETRY_DELAY));
            return carregarDoOneDrive(tentativa + 1);
        }
        
        throw erro;
    }
}

// 📦 SISTEMA DE CACHE
function verificarCache() {
    try {
        const dados = localStorage.getItem('fleury-dados-cache');
        const timestamp = localStorage.getItem('fleury-cache-timestamp');
        
        if (!dados || !timestamp) return null;
        
        const agora = Date.now();
        const tempoCache = parseInt(timestamp);
        
        if (agora - tempoCache > CONFIG.CACHE_DURATION) {
            console.log('⏰ Cache expirado, removendo...');
            localStorage.removeItem('fleury-dados-cache');
            localStorage.removeItem('fleury-cache-timestamp');
            return null;
        }
        
        console.log('📦 Cache válido encontrado');
        return dados;
        
    } catch (erro) {
        console.warn('⚠️ Erro ao verificar cache:', erro);
        return null;
    }
}

function salvarCache(dados) {
    try {
        localStorage.setItem('fleury-dados-cache', dados);
        localStorage.setItem('fleury-cache-timestamp', Date.now().toString());
        console.log('💾 Dados salvos no cache');
    } catch (erro) {
        console.warn('⚠️ Erro ao salvar cache:', erro);
    }
}

// 🔄 FALLBACK PARA DADOS LOCAIS
async function carregarDadosLocais() {
    try {
        const resposta = await fetch('dados.csv');
        const dadosCSV = await resposta.text();
        processarDados(dadosCSV);
        console.log('📁 Dados locais carregados como fallback');
    } catch (erro) {
        console.error('❌ Erro ao carregar dados locais:', erro);
        mostrarErro('Não foi possível carregar nenhum dado. Verifique a configuração.');
    }
}

// �� PROCESSA OS DADOS CSV
function processarDados(textoCSV) {
    try {
        Papa.parse(textoCSV, {
            header: true,
            skipEmptyLines: true,
            encoding: 'UTF-8',
            complete: function(resultado) {
                if (resultado.errors.length > 0) {
                    console.warn('⚠️ Avisos no processamento:', resultado.errors);
                }
                
                // Filtra dados válidos
                todosOsDados = resultado.data.filter(linha => {
                    return linha['Centro de custo'] && 
                           linha['Centro de custo'].trim() !== '' &&
                           linha['Valor'] && 
                           !isNaN(parseFloat(linha['Valor']));
                });
                
                if (todosOsDados.length === 0) {
                    mostrarErro('Nenhum dado válido encontrado no arquivo');
                    return;
                }
                
                console.log('✅ Dados processados:', todosOsDados.length, 'registros válidos');
                
                // Mostra estatísticas
                mostrarEstatisticas();
                
                // Preenche filtros
                preencherFiltros();
                
                // Mostra status de conexão
                mostrarStatusConexao(true);
            },
            error: function(erro) {
                console.error('❌ Erro ao processar CSV:', erro);
                mostrarErro('Erro ao processar dados: ' + erro.message);
            }
        });
    } catch (erro) {
        console.error('❌ Erro no processamento:', erro);
        mostrarErro('Erro interno no processamento dos dados');
    }
}

// 📊 MOSTRA ESTATÍSTICAS DOS DADOS
function mostrarEstatisticas() {
    if (!todosOsDados || todosOsDados.length === 0) return;
    
    const stats = {
        total: todosOsDados.length,
        diretorias: extrairValoresUnicos('N2').length,
        gerencias: extrairValoresUnicos('N3').length,
        centros: extrairValoresUnicos('Centro de custo').length,
        valorTotal: todosOsDados.reduce((sum, linha) => {
            return sum + (parseFloat(linha['Valor']) || 0);
        }, 0)
    };
    
    console.log('📊 ESTATÍSTICAS DOS DADOS:');
    console.log(`   📁 Total de registros: ${stats.total}`);
    console.log(`   🏢 Diretorias: ${stats.diretorias}`);
    console.log(`   👥 Gerências: ${stats.gerencias}`);
    console.log(`   💼 Centros de Custo: ${stats.centros}`);
    console.log(`   💰 Valor Total: R$ ${stats.valorTotal.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`);
}

// 🟢 MOSTRA STATUS DA CONEXÃO
function mostrarStatusConexao(conectado) {
    const header = document.querySelector('.header');
    if (!header) return;
    
    // Remove status anterior
    const statusAnterior = header.querySelector('.status-conexao');
    if (statusAnterior) statusAnterior.remove();
    
    // Adiciona novo status
    const statusDiv = document.createElement('div');
    statusDiv.className = 'status-conexao';
    statusDiv.style.cssText = `
        position: absolute;
        top: 10px;
        right: 20px;
        padding: 5px 10px;
        border-radius: 15px;
        font-size: 0.8em;
        font-weight: bold;
        ${conectado ? 
            'background: rgba(39, 174, 96, 0.2); color: #27ae60; border: 1px solid #27ae60;' : 
            'background: rgba(231, 76, 60, 0.2); color: #e74c3c; border: 1px solid #e74c3c;'
        }
    `;
    statusDiv.innerHTML = conectado ? '🟢 OneDrive Conectado' : '🔴 Modo Offline';
    
    header.style.position = 'relative';
    header.appendChild(statusDiv);
}

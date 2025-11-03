// 🌐 CONFIGURAÇÃO GOOGLE DRIVE
const CONFIG = {
    // Cole aqui o ID do seu arquivo do Google Drive
    GOOGLE_DRIVE_FILE_ID: 'https://docs.google.com/spreadsheets/d/1guD3BKKJ5VRy3rA9lVprb5HKgjqkk99Yt-OPn9MjkVY/edit?usp=sharing',
    
    // URL base do Google Drive para download direto
    GOOGLE_DRIVE_BASE_URL: 'https://docs.google.com/spreadsheets/d/1guD3BKKJ5VRy3rA9lVprb5HKgjqkk99Yt-OPn9MjkVY/edit?usp=sharing',
    
    // Configurações de cache
    CACHE_DURATION: 5 * 60 * 1000, // 5 minutos
    
    // Configurações de retry
    MAX_RETRIES: 3,
    RETRY_DELAY: 2000 // 2 segundos
};

// �� VARIÁVEIS GLOBAIS
let todosOsDados = [];
let dadosFiltrados = [];

// 🚀 FUNÇÃO PRINCIPAL - CARREGA QUANDO A PÁGINA ABRE
document.addEventListener('DOMContentLoaded', function() {
    console.log('🎉 Aplicação iniciada!');
    console.log('📊 Versão: 2.0 - Google Drive Integration');
    
    // Verifica se as bibliotecas foram carregadas
    if (typeof Papa === 'undefined') {
        console.error('❌ PapaParse não foi carregado!');
        mostrarErro('Erro: Biblioteca PapaParse não encontrada. Recarregue a página.');
        return;
    }
    
    if (typeof window.jspdf === 'undefined') {
        console.error('❌ jsPDF não foi carregado!');
        mostrarErro('Erro: Biblioteca jsPDF não encontrada. Recarregue a página.');
        return;
    }
    
    console.log('✅ Todas as bibliotecas carregadas com sucesso!');
    
    // Configura os eventos dos checkboxes
    configurarEventos();
    
    // Tenta carregar os dados
    carregarDados();
});

// ⚙️ CONFIGURA OS EVENTOS DOS FILTROS
function configurarEventos() {
    // Evento do checkbox N2
    document.getElementById('usarN2').addEventListener('change', function() {
        const select = document.getElementById('listaN2');
        select.disabled = !this.checked;
        if (!this.checked) {
            select.value = '';
            console.log('🔄 Filtro N2 desabilitado');
        } else {
            console.log('✅ Filtro N2 habilitado');
        }
    });

    // Evento do checkbox N3
    document.getElementById('usarN3').addEventListener('change', function() {
        const select = document.getElementById('listaN3');
        select.disabled = !this.checked;
        if (!this.checked) {
            select.value = '';
            console.log('🔄 Filtro N3 desabilitado');
        } else {
            console.log('✅ Filtro N3 habilitado');
        }
    });

    // Evento do checkbox Centro de Custo
    document.getElementById('usarCC').addEventListener('change', function() {
        const select = document.getElementById('listaCC');
        select.disabled = !this.checked;
        if (!this.checked) {
            select.value = '';
            console.log('🔄 Filtro Centro de Custo desabilitado');
        } else {
            console.log('✅ Filtro Centro de Custo habilitado');
        }
    });
}

// 📂 CARREGA OS DADOS DO GOOGLE DRIVE
async function carregarDados() {
    console.log('📥 Iniciando carregamento de dados...');
    
    try {
        mostrarLoading();
        
        // Verifica cache primeiro
        const dadosCache = verificarCache();
        if (dadosCache) {
            console.log('�� Usando dados do cache');
            processarDados(dadosCache);
            return;
        }
        
        // Carrega dados do Google Drive
        const dadosGoogleDrive = await carregarDoGoogleDrive();
        if (dadosGoogleDrive) {
            salvarCache(dadosGoogleDrive);
            processarDados(dadosGoogleDrive);
            return;
        }
        
        // Fallback para dados locais
        console.log('⚠️ Usando dados locais como fallback');
        await carregarDadosLocais();
        
    } catch (erro) {
        console.error('❌ Erro geral no carregamento:', erro);
        mostrarErro('Erro ao carregar dados. Verifique sua conexão.');
    }
}

// 🌐 CARREGA DADOS DO GOOGLE DRIVE
async function carregarDoGoogleDrive(tentativa = 1) {
    try {
        console.log(`🔄 Tentativa ${tentativa} de carregar do Google Drive...`);
        
        // Verifica se o ID foi configurado
        if (CONFIG.GOOGLE_DRIVE_FILE_ID === 'SEU_ID_DO_ARQUIVO_AQUI') {
            console.warn('⚠️ ID do Google Drive não configurado, usando dados locais');
            throw new Error('ID do Google Drive não configurado');
        }
        
        // Monta a URL do Google Drive
        const url = CONFIG.GOOGLE_DRIVE_BASE_URL + CONFIG.GOOGLE_DRIVE_FILE_ID;
        console.log('🔗 URL do Google Drive:', url);
        
        const resposta = await fetch(url, {
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
        
        // Verifica se não é uma página de erro do Google
        if (dadosCSV.includes('<html>') || dadosCSV.includes('<!DOCTYPE')) {
            throw new Error('Google Drive retornou HTML ao invés de CSV - verifique as permissões do arquivo');
        }
        
        if (!dadosCSV || dadosCSV.trim() === '') {
            throw new Error('Arquivo CSV vazio ou inválido');
        }
        
        console.log('✅ Dados carregados do Google Drive:', dadosCSV.length, 'caracteres');
        mostrarStatusConexao(true, 'Google Drive');
        return dadosCSV;
        
    } catch (erro) {
        console.warn(`⚠️ Erro na tentativa ${tentativa}:`, erro.message);
        
        if (tentativa < CONFIG.MAX_RETRIES) {
            console.log(`🔄 Tentando novamente em ${CONFIG.RETRY_DELAY/1000}s...`);
            await new Promise(resolve => setTimeout(resolve, CONFIG.RETRY_DELAY));
            return carregarDoGoogleDrive(tentativa + 1);
        }
        
        mostrarStatusConexao(false, 'Google Drive');
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
        mostrarStatusConexao(false, 'Dados Locais');
    } catch (erro) {
        console.error('❌ Erro ao carregar dados locais:', erro);
        mostrarErro('Não foi possível carregar nenhum dado. Verifique a configuração.');
    }
}

// ⏳ MOSTRA LOADING NOS SELECTS
function mostrarLoading() {
    const selects = ['listaN2', 'listaN3', 'listaCC'];
    selects.forEach(id => {
        const select = document.getElementById(id);
        select.innerHTML = '<option>🔄 Carregando do Google Drive...</option>';
    });
}

// ❌ MOSTRA MENSAGEM DE ERRO
function mostrarErro(mensagem) {
    const selects = ['listaN2', 'listaN3', 'listaCC'];
    selects.forEach(id => {
        const select = document.getElementById(id);
        select.innerHTML = '<option>❌ Erro ao carregar</option>';
    });
    
    document.getElementById('listaCentros').innerHTML = 
        `<p style="color: red; text-align: center;">❌ ${mensagem}</p>`;
}

// 📊 PROCESSA OS DADOS CSV
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

// 📋 PREENCHE OS FILTROS COM OS DADOS
function preencherFiltros() {
    console.log('📝 Preenchendo filtros...');
    
    try {
        // Extrai valores únicos de cada coluna
        const valoresN2 = extrairValoresUnicos('N2');
        const valoresN3 = extrairValoresUnicos('N3');
        const valoresCC = extrairValoresUnicos('Centro de custo');
        
        console.log('📊 Valores encontrados:');
        console.log('  - N2 (Diretorias):', valoresN2.length);
        console.log('  - N3 (Gerências):', valoresN3.length);
        console.log('  - Centros de Custo:', valoresCC.length);
        
        // Preenche cada dropdown
        preencherDropdown('listaN2', valoresN2, 'Selecione uma Diretoria/Marca');
        preencherDropdown('listaN3', valoresN3, 'Selecione uma Gerência');
        preencherDropdown('listaCC', valoresCC, 'Selecione um Centro de Custo');
        
        console.log('✅ Filtros preenchidos com sucesso!');
        
    } catch (erro) {
        console.error('❌ Erro ao preencher filtros:', erro);
        mostrarErro('Erro ao processar os dados para os filtros');
    }
}

// 🔍 EXTRAI VALORES ÚNICOS DE UMA COLUNA
function extrairValoresUnicos(nomeColuna) {
    const valores = todosOsDados
        .map(linha => linha[nomeColuna])
        .filter(valor => valor && valor.trim() !== '')
        .map(valor => valor.trim());
    
    // Remove duplicatas e ordena
    return [...new Set(valores)].sort();
}

// 📝 PREENCHE UM DROPDOWN ESPECÍFICO
function preencherDropdown(idSelect, valores, textoPlaceholder) {
    const select = document.getElementById(idSelect);
    
    // Limpa o select
    select.innerHTML = `<option value="">${textoPlaceholder}</option>`;
    
    // Adiciona cada valor
    valores.forEach(valor => {
        const opcao = document.createElement('option');
        opcao.value = valor;
        opcao.textContent = valor;
        select.appendChild(opcao);
    });
}

// 🔍 APLICA OS FILTROS SELECIONADOS
function aplicarFiltros() {
    console.log('🔍 Aplicando filtros...');
    
    try {
        // Verifica se pelo menos um filtro está ativo
        const filtroN2Ativo = document.getElementById('usarN2').checked;
        const filtroN3Ativo = document.getElementById('usarN3').checked;
        const filtroCCAtivo = document.getElementById('usarCC').checked;
        
        if (!filtroN2Ativo && !filtroN3Ativo && !filtroCCAtivo) {
            alert('⚠️ Selecione pelo menos um filtro para continuar!');
            return;
        }
        
        // Aplica os filtros
        dadosFiltrados = todosOsDados.filter(linha => {
            let incluir = true;
            
            // Filtro N2
            if (filtroN2Ativo) {
                const valorSelecionado = document.getElementById('listaN2').value;
                if (valorSelecionado && linha['N2'] !== valorSelecionado) {
                    incluir = false;
                }
            }
            
            // Filtro N3
            if (filtroN3Ativo) {
                const valorSelecionado = document.getElementById('listaN3').value;
                if (valorSelecionado && linha['N3'] !== valorSelecionado) {
                    incluir = false;
                }
            }
            
            // Filtro Centro de Custo
            if (filtroCCAtivo) {
                const valorSelecionado = document.getElementById('listaCC').value;
                if (valorSelecionado && linha['Centro de custo'] !== valorSelecionado) {
                    incluir = false;
                }
            }
            
            return incluir;
        });
        
        console.log('📊 Filtros aplicados:', dadosFiltrados.length, 'registros encontrados');
        mostrarResultados();
        
    } catch (erro) {
        console.error('❌ Erro ao aplicar filtros:', erro);
        alert('Erro ao aplicar filtros. Tente novamente.');
    }
}

// 📋 MOSTRA OS RESULTADOS FILTRADOS
function mostrarResultados() {
    const containerLista = document.getElementById('listaCentros');
    const elementoTotal = document.getElementById('valorTotal');
    const botaoGerar = document.getElementById('botaoGerar');
    
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
        
        html += `
            <li>
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <strong>${linha['Centro de custo']}</strong><br>
                        <small>📊 ${linha['N2']} → 🏢 ${linha['N3']}</small>
                    </div>
                    <div style="text-align: right;">
                        <strong style="color: #27ae60; font-size: 1.1em;">
                            R$ ${valor.toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                        </strong>
                    </div>
                </div>
            </li>
        `;
    });
    
    html += '</ul>';
    containerLista.innerHTML = html;
    elementoTotal.textContent = total.toLocaleString('pt-BR', {minimumFractionDigits: 2});
    botaoGerar.disabled = false;
    
    console.log('💰 Total calculado: R$', total.toFixed(2));
}

// 📄 GERA O CERTIFICADO EM PDF
function gerarPDF() {
    console.log('📄 Iniciando geração do PDF...');
    
    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        // Configurações
        const margemEsquerda = 20;
        const larguraPagina = 170;
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
        doc.text(`Data de Emissão: ${hoje}`, margemEsquerda, posicaoY);
        
        posicaoY += 10;
        doc.text(`Solicitante: Gustavo - Relações Trabalhistas`, margemEsquerda, posicaoY);
        
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
            
            // Verifica se precisa de nova página
            if (posicaoY > 250) {
                doc.addPage();
                posicaoY = 30;
            }
            
            const texto = `${index + 1}. ${linha['Centro de custo']}`;
            const valorTexto = `R$ ${valor.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`;
            
            doc.text(texto, margemEsquerda, posicaoY);
            doc.text(valorTexto, 190, posicaoY, { align: 'right' });
            
            posicaoY += 6;
            doc.setFontSize(10);
            doc.text(`   ${linha['N2']} → ${linha['N3']}`, margemEsquerda, posicaoY);
            posicaoY += 10;
            doc.setFontSize(12);
        });
        
        // Total
        posicaoY += 10;
        doc.setFont(undefined, 'bold');
        doc.setFontSize(16);
        doc.text(`VALOR TOTAL AUTORIZADO: R$ ${total.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`, margemEsquerda, posicaoY);
        
        // Assinatura
        posicaoY += 40;
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        doc.text('_________________________________', margemEsquerda, posicaoY);
        doc.text('Assinatura do Responsável', margemEsquerda, posicaoY + 10);
        doc.text('Gustavo - Relações Trabalhistas', margemEsquerda, posicaoY + 20);
        
        // Rodapé
        doc.text(`Documento gerado automaticamente em ${hoje}`, margemEsquerda, posicaoY + 35);
        
        // Salva o arquivo
        const nomeArquivo = `certificado-verba-${hoje.replace(/[\/\s:]/g, '-')}.pdf`;
        doc.save(nomeArquivo);
        
        console.log('✅ PDF gerado com sucesso:', nomeArquivo);
        alert('🎉 Certificado gerado com sucesso!\n\nO arquivo foi baixado para sua pasta de Downloads.');
        
    } catch (erro) {
        console.error('❌ Erro ao gerar PDF:', erro);
        alert('Erro ao gerar o PDF. Tente usar o navegador Chrome ou Edge.');
    }
}

// 🗑️ LIMPA TODOS OS FILTROS
function limparTudo() {
    console.log('🗑️ Limpando todos os filtros...');
    
    try {
        // Desmarca checkboxes
        document.getElementById('usarN2').checked = false;
        document.getElementById('usarN3').checked = false;
        document.getElementById('usarCC').checked = false;
        
        // Desabilita e limpa selects
        const selects = ['listaN2', 'listaN3', 'listaCC'];
        selects.forEach(id => {
            const select = document.getElementById(id);
            select.disabled = true;
            select.value = '';
        });
        
        // Limpa resultados
        document.getElementById('listaCentros').innerHTML = 
            '<p style="text-align: center; color: #6c757d;">👆 Use os filtros acima para selecionar centros</p>';
        document.getElementById('valorTotal').textContent = '0,00';
        document.getElementById('botaoGerar').disabled = true;
        
        // Limpa dados filtrados
        dadosFiltrados = [];
        
        console.log('✅ Filtros limpos com sucesso!');
        
    } catch (erro) {
        console.error('❌ Erro ao limpar filtros:', erro);
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
function mostrarStatusConexao(conectado, fonte) {
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
    statusDiv.innerHTML = conectado ? `🟢 ${fonte} Conectado` : `🔴 ${fonte}`;
    
    header.style.position = 'relative';
    header.appendChild(statusDiv);
}

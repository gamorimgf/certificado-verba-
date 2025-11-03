// CONFIGURACAO GOOGLE DRIVE
const CONFIG = {
    GOOGLE_DRIVE_FILE_ID: '14TSbRQAY4K-Btm1oD1DrAnCRic1jWmRi',
    GOOGLE_DRIVE_BASE_URL: 'https://drive.google.com/file/d/14TSbRQAY4K-Btm1oD1DrAnCRic1jWmRi/view?usp=sharing',
    CACHE_DURATION: 5 * 60 * 1000,
    MAX_RETRIES: 3,
    RETRY_DELAY: 2000
};

let todosOsDados = [];
let dadosFiltrados = [];

document.addEventListener('DOMContentLoaded', function() {
    console.log('Aplicacao iniciada!');
    console.log('Versao: 2.0 - Google Drive Integration');
    
    if (typeof Papa === 'undefined') {
        console.error('PapaParse nao foi carregado!');
        mostrarErro('Erro: Biblioteca PapaParse nao encontrada. Recarregue a pagina.');
        return;
    }
    
    if (typeof window.jspdf === 'undefined') {
        console.error('jsPDF nao foi carregado!');
        mostrarErro('Erro: Biblioteca jsPDF nao encontrada. Recarregue a pagina.');
        return;
    }
    
    console.log('Todas as bibliotecas carregadas com sucesso!');
    configurarEventos();
    carregarDados();
});

function configurarEventos() {
    document.getElementById('usarN2').addEventListener('change', function() {
        const select = document.getElementById('listaN2');
        select.disabled = !this.checked;
        if (!this.checked) {
            select.value = '';
        }
    });

    document.getElementById('usarN3').addEventListener('change', function() {
        const select = document.getElementById('listaN3');
        select.disabled = !this.checked;
        if (!this.checked) {
            select.value = '';
        }
    });

    document.getElementById('usarCC').addEventListener('change', function() {
        const select = document.getElementById('listaCC');
        select.disabled = !this.checked;
        if (!this.checked) {
            select.value = '';
        }
    });
}

async function carregarDados() {
    console.log('Iniciando carregamento de dados...');
    
    try {
        mostrarLoading();
        
        const dadosCache = verificarCache();
        if (dadosCache) {
            console.log('Usando dados do cache');
            processarDados(dadosCache);
            return;
        }
        
        const dadosGoogleDrive = await carregarDoGoogleDrive();
        if (dadosGoogleDrive) {
            salvarCache(dadosGoogleDrive);
            processarDados(dadosGoogleDrive);
            return;
        }
        
        console.log('Usando dados locais como fallback');
        await carregarDadosLocais();
        
    } catch (erro) {
        console.error('Erro geral no carregamento:', erro);
        mostrarErro('Erro ao carregar dados. Verifique sua conexao.');
    }
}

async function carregarDoGoogleDrive(tentativa = 1) {
    try {
        console.log('Tentativa ' + tentativa + ' de carregar do Google Drive...');
        
        if (CONFIG.GOOGLE_DRIVE_FILE_ID === 'SEU_ID_DO_ARQUIVO_AQUI') {
            console.warn('ID do Google Drive nao configurado, usando dados locais');
            throw new Error('ID do Google Drive nao configurado');
        }
        
        const url = CONFIG.GOOGLE_DRIVE_BASE_URL + CONFIG.GOOGLE_DRIVE_FILE_ID;
        console.log('URL do Google Drive:', url);
        
        const resposta = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'text/csv,text/plain,*/*',
                'Cache-Control': 'no-cache'
            }
        });
        
        if (!resposta.ok) {
            throw new Error('HTTP ' + resposta.status + ': ' + resposta.statusText);
        }
        
        const dadosCSV = await resposta.text();
        
        if (dadosCSV.includes('<html>') || dadosCSV.includes('<!DOCTYPE')) {
            throw new Error('Google Drive retornou HTML ao inves de CSV - verifique as permissoes do arquivo');
        }
        
        if (!dadosCSV || dadosCSV.trim() === '') {
            throw new Error('Arquivo CSV vazio ou invalido');
        }
        
        console.log('Dados carregados do Google Drive:', dadosCSV.length, 'caracteres');
        mostrarStatusConexao(true, 'Google Drive');
        return dadosCSV;
        
    } catch (erro) {
        console.warn('Erro na tentativa ' + tentativa + ':', erro.message);
        
        if (tentativa < CONFIG.MAX_RETRIES) {
            console.log('Tentando novamente em ' + (CONFIG.RETRY_DELAY/1000) + 's...');
            await new Promise(resolve => setTimeout(resolve, CONFIG.RETRY_DELAY));
            return carregarDoGoogleDrive(tentativa + 1);
        }
        
        mostrarStatusConexao(false, 'Google Drive');
        throw erro;
    }
}

function verificarCache() {
    try {
        const dados = localStorage.getItem('fleury-dados-cache');
        const timestamp = localStorage.getItem('fleury-cache-timestamp');
        
        if (!dados || !timestamp) return null;
        
        const agora = Date.now();
        const tempoCache = parseInt(timestamp);
        
        if (agora - tempoCache > CONFIG.CACHE_DURATION) {
            console.log('Cache expirado, removendo...');
            localStorage.removeItem('fleury-dados-cache');
            localStorage.removeItem('fleury-cache-timestamp');
            return null;
        }
        
        console.log('Cache valido encontrado');
        return dados;
        
    } catch (erro) {
        console.warn('Erro ao verificar cache:', erro);
        return null;
    }
}

function salvarCache(dados) {
    try {
        localStorage.setItem('fleury-dados-cache', dados);
        localStorage.setItem('fleury-cache-timestamp', Date.now().toString());
        console.log('Dados salvos no cache');
    } catch (erro) {
        console.warn('Erro ao salvar cache:', erro);
    }
}

async function carregarDadosLocais() {
    try {
        const resposta = await fetch('dados.csv');
        const dadosCSV = await resposta.text();
        processarDados(dadosCSV);
        console.log('Dados locais carregados como fallback');
        mostrarStatusConexao(false, 'Dados Locais');
    } catch (erro) {
        console.error('Erro ao carregar dados locais:', erro);
        mostrarErro('Nao foi possivel carregar nenhum dado. Verifique a configuracao.');
    }
}

function mostrarLoading() {
    const selects = ['listaN2', 'listaN3', 'listaCC'];
    selects.forEach(id => {
        const select = document.getElementById(id);
        select.innerHTML = '<option>Carregando do Google Drive...</option>';
    });
}

function mostrarErro(mensagem) {
    const selects = ['listaN2', 'listaN3', 'listaCC'];
    selects.forEach(id => {
        const select = document.getElementById(id);
        select.innerHTML = '<option>Erro ao carregar</option>';
    });
    
    const container = document.getElementById('listaCentros');
    if (container) {
        container.innerHTML = '<p style="color: red; text-align: center;">Erro: ' + mensagem + '</p>';
    }
}

function processarDados(textoCSV) {
    try {
        Papa.parse(textoCSV, {
            header: true,
            skipEmptyLines: true,
            encoding: 'UTF-8',
            complete: function(resultado) {
                if (resultado.errors.length > 0) {
                    console.warn('Avisos no processamento:', resultado.errors);
                }
                
                todosOsDados = resultado.data.filter(linha => {
                    return linha['Centro de custo'] && 
                           linha['Centro de custo'].trim() !== '' &&
                           linha['Valor'] && 
                           !isNaN(parseFloat(linha['Valor']));
                });
                
                if (todosOsDados.length === 0) {
                    mostrarErro('Nenhum dado valido encontrado no arquivo');
                    return;
                }
                
                console.log('Dados processados:', todosOsDados.length, 'registros validos');
                mostrarEstatisticas();
                preencherFiltros();
            },
            error: function(erro) {
                console.error('Erro ao processar CSV:', erro);
                mostrarErro('Erro ao processar dados: ' + erro.message);
            }
        });
    } catch (erro) {
        console.error('Erro no processamento:', erro);
        mostrarErro('Erro interno no processamento dos dados');
    }
}

function preencherFiltros() {
    console.log('Preenchendo filtros...');
    
    try {
        const valoresN2 = extrairValoresUnicos('N2');
        const valoresN3 = extrairValoresUnicos('N3');
        const valoresCC = extrairValoresUnicos('Centro de custo');
        
        console.log('Valores encontrados:');
        console.log('  - N2 (Diretorias):', valoresN2.length);
        console.log('  - N3 (Gerencias):', valoresN3.length);
        console.log('  - Centros de Custo:', valoresCC.length);
        
        preencherDropdown('listaN2', valoresN2, 'Selecione uma Diretoria/Marca');
        preencherDropdown('listaN3', valoresN3, 'Selecione uma Gerencia');
        preencherDropdown('listaCC', valoresCC, 'Selecione um Centro de Custo');
        
        console.log('Filtros preenchidos com sucesso!');
        
    } catch (erro) {
        console.error('Erro ao preencher filtros:', erro);
        mostrarErro('Erro ao processar os dados para os filtros');
    }
}

function extrairValoresUnicos(nomeColuna) {
    const valores = todosOsDados
        .map(linha => linha[nomeColuna])
        .filter(valor => valor && valor.trim() !== '')
        .map(valor => valor.trim());
    
    return [...new Set(valores)].sort();
}

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

function aplicarFiltros() {
    console.log('Aplicando filtros...');
    
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

function mostrarResultados() {
    const containerLista = document.getElementById('listaCentros');
    const elementoTotal = document.getElementById('valorTotal');
    const botaoGerar = document.getElementById('botaoGerar');
    
    if (!containerLista || !elementoTotal || !botaoGerar) return;
    
    if (dadosFiltrados.length === 0) {
        containerLista.innerHTML = '<p style="text-align: center; color: #6c757d;">Nenhum centro encontrado com os filtros selecionados.</p>';
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

function gerarPDF() {
    console.log('Iniciando geracao do PDF...');
    
    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        const margemEsquerda = 20;
        let posicaoY = 30;
        
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
        doc.text('Solicitante: Gustavo - Relacoes Trabalhistas', margemEsquerda, posicaoY);
        
        posicaoY += 20;
        doc.setFont(undefined, 'bold');
        doc.text('CENTROS DE CUSTO AUTORIZADOS:', margemEsquerda, posicaoY);
        
        posicaoY += 15;
        doc.setFont(undefined, 'normal');
        
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
        
        posicaoY += 10;
        doc.setFont(undefined, 'bold');
        doc.setFontSize(16);
        doc.text('VALOR TOTAL AUTORIZADO: R$ ' + total.toLocaleString('pt-BR', {minimumFractionDigits: 2}), margemEsquerda, posicaoY);
        
        posicaoY += 40;
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        doc.text('_________________________________', margemEsquerda, posicaoY);
        doc.text('Assinatura do Responsavel', margemEsquerda, posicaoY + 10);
        doc.text('Gustavo - Relacoes Trabalhistas', margemEsquerda, posicaoY + 20);
        
        doc.text('Documento gerado automaticamente em ' + hoje, margemEsquerda, posicaoY + 35);
        
        const nomeArquivo = 'certificado-verba-' + hoje.replace(/[\/\s:]/g, '-') + '.pdf';
        doc.save(nomeArquivo);
        
        console.log('PDF gerado com sucesso:', nomeArquivo);
        alert('Certificado gerado com sucesso! O arquivo foi baixado para sua pasta de Downloads.');
        
    } catch (erro) {
        console.error('Erro ao gerar PDF:', erro);
        alert('Erro ao gerar o PDF. Tente usar o navegador Chrome ou Edge.');
    }
}

function limparTudo() {
    console.log('Limpando todos os filtros...');
    
    try {
        document.getElementById('usarN2').checked = false;
        document.getElementById('usarN3').checked = false;
        document.getElementById('usarCC').checked = false;
        
        const selects = ['listaN2', 'listaN3', 'listaCC'];
        selects.forEach(id => {
            const select = document.getElementById(id);
            if (select) {
                select.disabled = true;
                select.value = '';
            }
        });
        
        const containerLista = document.getElementById('listaCentros');
        const elementoTotal = document.getElementById('valorTotal');
        const botaoGerar = document.getElementById('botaoGerar');
        
        if (containerLista) {
            containerLista.innerHTML = '<p style="text-align: center; color: #6c757d;">Use os filtros acima para selecionar centros</p>';
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
    
    console.log('ESTATISTICAS DOS DADOS:');
    console.log('   Total de registros: ' + stats.total);
    console.log('   Diretorias: ' + stats.diretorias);
    console.log('   Gerencias: ' + stats.gerencias);
    console.log('   Centros de Custo: ' + stats.centros);
    console.log('   Valor Total: R$ ' + stats.valorTotal.toLocaleString('pt-BR', {minimumFractionDigits: 2}));
}

function mostrarStatusConexao(conectado, fonte) {
    const header = document.querySelector('.header');
    if (!header) return;
    
    const statusAnterior = header.querySelector('.status-conexao');
    if (statusAnterior) statusAnterior.remove();
    
    const statusDiv = document.createElement('div');
    statusDiv.className = 'status-conexao';
    statusDiv.style.cssText = 
        'position: absolute; top: 10px; right: 20px; padding: 5px 10px; border-radius: 15px; font-size: 0.8em; font-weight: bold;' +
        (conectado ? 
            'background: rgba(39, 174, 96, 0.2); color: #27ae60; border: 1px solid #27ae60;' : 
            'background: rgba(231, 76, 60, 0.2); color: #e74c3c; border: 1px solid #e74c3c;'
        );
    statusDiv.innerHTML = conectado ? fonte + ' Conectado' : fonte;
    
    header.style.position = 'relative';
    header.appendChild(statusDiv);
}

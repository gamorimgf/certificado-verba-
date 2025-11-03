// VARIAVEIS GLOBAIS
let todosOsDados = [];
let dadosFiltrados = [];

// DADOS DEMO PARA TESTE
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

// INICIALIZACAO
document.addEventListener('DOMContentLoaded', function() {
    console.log('Sistema de Upload iniciado!');
    console.log('Versao: 3.0 - Upload Manual');
    
    // Verifica bibliotecas
    if (typeof Papa === 'undefined') {
        mostrarStatus('Erro: Biblioteca PapaParse não encontrada.', 'error');
        return;
    }
    
    if (typeof window.jspdf === 'undefined') {
        mostrarStatus('Erro: Biblioteca jsPDF não encontrada.', 'error');
        return;
    }
    
    console.log('Todas as bibliotecas carregadas com sucesso!');
    configurarUpload();
});

// CONFIGURAR AREA DE UPLOAD
function configurarUpload() {
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');
    const btnCarregar = document.getElementById('btnCarregarArquivo');
    const btnDemo = document.getElementById('btnUsarDadosDemo');
    
    // Eventos de clique
    uploadArea.addEventListener('click', () => fileInput.click());
    btnCarregar.addEventListener('click', () => fileInput.click());
    btnDemo.addEventListener('click', usarDadosDemo);
    
    // Eventos de arquivo
    fileInput.addEventListener('change', handleFileSelect);
    
    // Eventos de drag and drop
    uploadArea.addEventListener('dragover', handleDragOver);
    uploadArea.addEventListener('dragleave', handleDragLeave);
    uploadArea.addEventListener('drop', handleFileDrop);
}

// DRAG AND DROP
function handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    document.getElementById('uploadArea').classList.add('dragover');
}

function handleDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();
    document.getElementById('uploadArea').classList.remove('dragover');
}

function handleFileDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    document.getElementById('uploadArea').classList.remove('dragover');
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        processarArquivo(files[0]);
    }
}

// SELECAO DE ARQUIVO
function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) {
        processarArquivo(file);
    }
}

// PROCESSAR ARQUIVO
function processarArquivo(arquivo) {
    if (!arquivo) {
        mostrarStatus('Nenhum arquivo selecionado.', 'error');
        return;
    }
    
    if (!arquivo.name.toLowerCase().endsWith('.csv')) {
        mostrarStatus('Por favor, selecione um arquivo CSV.', 'error');
        return;
    }
    
    mostrarStatus('Processando arquivo: ' + arquivo.name, 'info');
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const csvData = e.target.result;
        processarDadosCSV(csvData, arquivo.name);
    };
    
    reader.onerror = function() {
        mostrarStatus('Erro ao ler o arquivo.', 'error');
    };
    
    reader.readAsText(arquivo, 'UTF-8');
}

// USAR DADOS DEMO
function usarDadosDemo() {
    mostrarStatus('Carregando dados de demonstração...', 'info');
    processarDadosCSV(dadosDemo, 'dados-demo.csv');
}

// PROCESSAR DADOS CSV
function processarDadosCSV(csvData, nomeArquivo) {
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
                    mostrarStatus('Nenhum dado válido encontrado no arquivo. Verifique o formato.', 'error');
                    return;
                }
                
                // Sucesso!
                const stats = calcularEstatisticas();
                mostrarStatus(
                    `✅ Arquivo "${nomeArquivo}" carregado com sucesso!\n` +
                    `📊 ${stats.total} registros • ${stats.diretorias} diretorias • ${stats.centros} centros de custo\n` +
                    `💰 Valor total: R$ ${stats.valorTotal.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`,
                    'success'
                );
                
                preencherFiltros();
                mostrarFiltros();
                
            },
            error: function(erro) {
                mostrarStatus('Erro ao processar CSV: ' + erro.message, 'error');
            }
        });
    } catch (erro) {
        mostrarStatus('Erro interno no processamento: ' + erro.message, 'error');
    }
}

// MOSTRAR STATUS
function mostrarStatus(mensagem, tipo) {
    const statusDiv = document.getElementById('uploadStatus');
    statusDiv.className = 'upload-status status-' + tipo;
    statusDiv.innerHTML = mensagem.replace(/\n/g, '<br>');
    
    console.log('[' + tipo.toUpperCase() + ']', mensagem);
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

// MOSTRAR AREA DE FILTROS
function mostrarFiltros() {
    document.getElementById('filtrosContainer').style.display = 'block';
    document.getElementById('filtrosContainer').scrollIntoView({ behavior: 'smooth' });
}

// VOLTAR PARA UPLOAD
function voltarUpload() {
    document.getElementById('filtrosContainer').style.display = 'none';
    document.getElementById('uploadStatus').innerHTML = '';
    document.getElementById('fileInput').value = '';
    todosOsDados = [];
    dadosFiltrados = [];
    
    // Limpa filtros
    document.getElementById('usarN2').checked = false;
    document.getElementById('usarN3').checked = false;
    document.getElementById('usarCC').checked = false;
    
    const selects = ['listaN2', 'listaN3', 'listaCC'];
    selects.forEach(id => {
        const select = document.getElementById(id);
        select.disabled = true;
        select.innerHTML = '<option>Carregue um arquivo primeiro</option>';
    });
    
    document.getElementById('listaCentros').innerHTML = 
        '<p style="text-align: center; color: #6c757d;">👆 Use os filtros acima para selecionar centros</p>';
    document.getElementById('valorTotal').textContent = '0,00';
    document.getElementById('botaoGerar').disabled = true;
}

// RESTO DAS FUNCOES (iguais ao código anterior)
function extrairValoresUnicos(nomeColuna) {
    const valores = todosOsDados
        .map(linha => linha[nomeColuna])
        .filter(valor => valor && valor.trim() !== '')
        .map(valor => valor.trim());
    
    return [...new Set(valores)].sort();
}

function preencherFiltros() {
    console.log('Preenchendo filtros...');
    
    try {
        const valoresN2 = extrairValoresUnicos('N2');
        const valoresN3 = extrairValoresUnicos('N3');
        const valoresCC = extrairValoresUnicos('Centro de custo');
        
        preencherDropdown('listaN2', valoresN2, 'Selecione uma Diretoria/Marca');
        preencherDropdown('listaN3', valoresN3, 'Selecione uma Gerência');
        preencherDropdown('listaCC', valoresCC, 'Selecione um Centro de Custo');
        
        // Configura eventos dos checkboxes
        configurarEventosFiltros();
        
        console.log('Filtros preenchidos com sucesso!');
        
    } catch (erro) {
        console.error('Erro ao preencher filtros:', erro);
        mostrarStatus('Erro ao processar os dados para os filtros', 'error');
    }
}

function configurarEventosFiltros() {
    document.getElementById('usarN2').addEventListener('change', function() {
        const select = document.getElementById('listaN2');
        select.disabled = !this.checked;
        if (!this.checked) select.value = '';
    });

    document.getElementById('usarN3').addEventListener('change', function() {
        const select = document.getElementById('listaN3');
        select.disabled = !this.checked;
        if (!this.checked) select.value = '';
    });

    document.getElementById('usarCC').addEventListener('change', function() {
        const select = document.getElementById('listaCC');
        select.disabled = !this.checked;
        if (!this.checked) select.value = '';
    });
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

function gerarPDF() {
    console.log('Iniciando geração do PDF...');
    
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
        doc.text('Data de Emissão: ' + hoje, margemEsquerda, posicaoY);
        
        posicaoY += 10;
        doc.text('Solicitante: Gustavo - Relações Trabalhistas', margemEsquerda, posicaoY);
        
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
        doc.text('Assinatura do Responsável', margemEsquerda, posicaoY + 10);
        doc.text('Gustavo - Relações Trabalhistas', margemEsquerda, posicaoY + 20);
        
        doc.text('Documento gerado automaticamente em ' + hoje, margemEsquerda, posicaoY + 35);
        
        const nomeArquivo = 'certificado-verba-' + hoje.replace(/[\/\s:]/g, '-') + '.pdf';
        doc.save(nomeArquivo);
        
        console.log('PDF gerado com sucesso:', nomeArquivo);
        alert('🎉 Certificado gerado com sucesso!\n\nO arquivo foi baixado para sua pasta de Downloads.');
        
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
            containerLista.innerHTML = '<p style="text-align: center; color: #6c757d;">👆 Use os filtros acima para selecionar centros</p>';
        }
        if (elementoTotal) {
            elementoTotal.textContent = '0,00';
        }
        if (botaoGerar) {
            botaoGerar.disabled = true;
        }
        
        dadosFiltrados = [];
        
        // Reabilita os filtros se há dados carregados
        if (todosOsDados.length > 0) {
            preencherFiltros();
        }
        
        console.log('Filtros limpos com sucesso!');
        
    } catch (erro) {
        console.error('Erro ao limpar filtros:', erro);
    }
}

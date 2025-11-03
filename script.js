// SISTEMA DE AUTENTICACAO E GESTAO
// Versao: 4.1 - Sistema Corrigido com Admin 12282

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
DIREX,Saúde Ocupacional,Gerência Administrativa,Área RH,Fleury R

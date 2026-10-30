// =====================================================================
//  FecapStudy - Versão 1 - Interface gráfica (Etapa 9) e servidor (Etapa 10)
// =====================================================================

// ---------- Criação dos objetos ----------
const disciplinas = [
  new Disciplina('ADS201', 'Programação Orientada a Objetos', 'Computação', 4),
  new Disciplina('ADS202', 'Banco de Dados', 'Computação', 3),
  new Disciplina('MAT105', 'Estatística Aplicada', 'Matemática', 2),
];

const admin = new Administrador('Profa. Helena Duarte', 'helena@fecap.br', 'admin123', 'Coordenação PI');
const responsavel = new Responsavel('Marina Silva', 'marina@email.com', 'resp123', 'Mãe');
const discente = new Discente('Lucas Silva', 'lucas@edu.fecap.br', 'aluno123', '24026001');

responsavel.vincularDiscente(discente);
const meta = responsavel.definirMeta(discente, 600);

const trilha = new TrilhaEstudo('Trilha ADS - 2º semestre');
disciplinas.forEach((d) => trilha.adicionarDisciplina(d));

const plano = new PlanoEstudo();
plano.adicionarItem('Segunda', 120);
plano.adicionarItem('Quarta', 120);
plano.adicionarItem('Sábado', 180);

const usuarios = [discente, responsavel, admin];
const servico = new ServicoAlertaResponsavel();
const notificador = new NotificadorPainel(mostrarAviso);
const cliente = new ClienteBackendEstudo();

// ---------- Funções da tela ----------
function mostrarAviso(texto) {
  const aviso = document.getElementById('aviso');
  aviso.textContent = texto;
  aviso.style.display = 'block';
  setTimeout(() => (aviso.style.display = 'none'), 4000);
}

function atualizarPerfis() {
  const area = document.getElementById('perfis');
  area.innerHTML = '';
  // Polimorfismo: cada perfil gera seu próprio painel
  for (const usuario of usuarios) {
    const div = document.createElement('div');
    div.className = 'perfil';
    div.innerHTML = `<b>${usuario.obterTipoPerfil()}</b><br>${usuario.nome}<br><small></small>`;
    div.querySelector('small').textContent = usuario.gerarPainelResumo();
    area.appendChild(div);
  }
}

function atualizarMeta() {
  const percentual = meta.calcularPercentual();
  document.getElementById('textoMeta').textContent =
    `${meta.minutosCumpridos} de ${meta.metaMinutos} minutos (${percentual}%)`;
  document.getElementById('barraMeta').style.width = percentual + '%';
}

function atualizarHistorico() {
  const lista = document.getElementById('historico');
  lista.innerHTML = '';
  for (const sessao of discente.getHistorico()) {
    const item = document.createElement('li');
    item.textContent = sessao.gerarFeedback();
    lista.appendChild(item);
  }
}

function atualizarTela() {
  atualizarPerfis();
  atualizarMeta();
  atualizarHistorico();
}

function mostrarCamposDaModalidade() {
  const modalidade = document.getElementById('modalidade').value;
  document.getElementById('campoPomodoro').hidden = modalidade !== 'Pomodoro';
  document.getElementById('campoExercicios').hidden = modalidade !== 'Exercicios';
  document.getElementById('campoLeitura').hidden = modalidade !== 'Leitura';
}

function numero(id) {
  return Number(document.getElementById(id).value);
}

function criarSessao() {
  const disciplina = disciplinas[document.getElementById('disciplina').value];
  const modalidade = document.getElementById('modalidade').value;
  const duracao = numero('duracao');

  if (modalidade === 'Pomodoro') return new SessaoPomodoro(disciplina, duracao, numero('ciclos'));
  if (modalidade === 'Exercicios') return new SessaoExercicios(disciplina, duracao, numero('questoes'), numero('acertos'));
  return new SessaoLeitura(disciplina, duracao, numero('paginas'), document.getElementById('resumo').checked);
}

function montarTabela(lista) {
  if (!Array.isArray(lista) || lista.length === 0) return '<p>Nenhum registro.</p>';
  const colunas = Object.keys(lista[0]);
  const tabela = document.createElement('table');
  tabela.innerHTML = '<tr>' + colunas.map((c) => `<th>${c}</th>`).join('') + '</tr>';
  for (const linha of lista) {
    const tr = tabela.insertRow();
    for (const c of colunas) tr.insertCell().textContent = linha[c];
  }
  return tabela.outerHTML;
}

// ---------- Eventos ----------
document.getElementById('modalidade').addEventListener('change', mostrarCamposDaModalidade);

document.getElementById('formSessao').addEventListener('submit', async (evento) => {
  evento.preventDefault();
  const sessao = criarSessao();

  if (!meta.registrarAvanco(sessao.duracaoMinutos)) {
    mostrarAviso('Duração inválida! Use de 1 a 480 minutos.');
    return;
  }
  discente.registrarEstudo(sessao);
  atualizarTela();
  mostrarAviso(sessao.gerarFeedback());

  try {
    await cliente.registrarSessao(sessao, discente);
  } catch {
    mostrarAviso('Sessão salva só na tela: servidor desligado.');
  }
});

document.getElementById('btnNotificar').addEventListener('click', () => {
  servico.avaliarDiscente(discente, meta, responsavel, notificador);
});

document.getElementById('btnCarregar').addEventListener('click', async () => {
  try {
    const sessoes = await cliente.listarSessoes();
    document.getElementById('dadosServidor').innerHTML = montarTabela(sessoes);
  } catch {
    mostrarAviso('Não foi possível conectar ao servidor (porta 5080).');
  }
});

document.getElementById('btnRelatorio').addEventListener('click', async () => {
  try {
    const relatorio = await cliente.obterRelatorio(discente.nome);
    const pre = document.createElement('pre');
    pre.textContent = JSON.stringify(relatorio, null, 2);
    document.getElementById('dadosServidor').replaceChildren(pre);
  } catch {
    mostrarAviso('Não foi possível conectar ao servidor (porta 5080).');
  }
});

// ---------- Início ----------
disciplinas.forEach((d, i) => {
  document.getElementById('disciplina').add(new Option(d.exibirResumo(), i));
});

atualizarTela();

cliente.verificarStatus()
  .then(() => (document.getElementById('status').textContent = '🟢 Servidor online'))
  .catch(() => (document.getElementById('status').textContent = '🔴 Servidor offline'));

console.log('Trilha:', trilha.titulo, '-', trilha.calcularCargaTotal() + 'h/semana');
console.log('Plano:', plano.listarItens().join(' | '), '- total', plano.calcularTotal(), 'min');

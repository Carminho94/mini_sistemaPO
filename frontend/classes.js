// =====================================================================
//  FecapStudy - Versão 1 - Núcleo orientado a objetos
//  Estilo: campos privados (#) + propriedades "get"
// =====================================================================

// ---------- Etapa 6: Interfaces (lista de métodos obrigatórios) ----------
const INotificador = ['obterCanal', 'enviarAlerta'];
const IExportavelJson = ['paraJson'];

// Confere se um objeto tem todos os métodos de uma interface
function implementa(objeto, interfaceMetodos) {
  return interfaceMetodos.every((metodo) => typeof objeto[metodo] === 'function');
}

// ---------- Etapa 1: Disciplina ----------
class Disciplina {
  #codigo;
  #nome;
  #categoria;
  #cargaHoraria;

  constructor(codigo, nome, categoria, cargaHoraria) {
    this.#codigo = codigo;
    this.#nome = nome;
    this.#categoria = categoria;
    this.#cargaHoraria = cargaHoraria > 0 ? cargaHoraria : 2; // padrão: 2h
  }

  get codigo() { return this.#codigo; }
  get nome() { return this.#nome; }
  get categoria() { return this.#categoria; }
  get cargaHoraria() { return this.#cargaHoraria; }

  calcularCargaEmMinutos() {
    return this.#cargaHoraria * 60;
  }

  exibirResumo() {
    return `[${this.#codigo}] ${this.#nome} (${this.#categoria}) - ${this.#cargaHoraria}h/semana`;
  }

  paraJson() {
    return JSON.stringify({
      codigo: this.#codigo,
      nome: this.#nome,
      categoria: this.#categoria,
      cargaHorariaSemanal: this.#cargaHoraria,
    });
  }
}

// ---------- Etapa 2: MetaEstudo (encapsulamento) ----------
class MetaEstudo {
  #metaMinutos = 30;
  #minutosCumpridos = 0;

  constructor(metaMinutos) {
    this.redefinirMeta(metaMinutos);
  }

  get metaMinutos() { return this.#metaMinutos; }
  get minutosCumpridos() { return this.#minutosCumpridos; }

  // Única forma de somar minutos
  registrarAvanco(minutos) {
    if (minutos <= 0 || minutos > 480) return false;
    this.#minutosCumpridos += minutos;
    return true;
  }

  redefinirMeta(novaMeta) {
    if (novaMeta < 30) novaMeta = 30;
    if (novaMeta > 3000) novaMeta = 3000;
    this.#metaMinutos = novaMeta;
  }

  calcularPercentual() {
    const percentual = (this.#minutosCumpridos / this.#metaMinutos) * 100;
    return Math.min(100, Math.round(percentual * 10) / 10);
  }

  estaCumprida() {
    return this.#minutosCumpridos >= this.#metaMinutos;
  }

  paraJson() {
    return JSON.stringify({
      metaMinutosSemana: this.#metaMinutos,
      minutosCumpridos: this.#minutosCumpridos,
      percentual: this.calcularPercentual(),
    });
  }
}

// ---------- Etapa 3: Usuario (classe abstrata) ----------
class Usuario {
  #nome;
  #email;
  #senha;

  constructor(nome, email, senha) {
    if (new.target === Usuario) {
      throw new Error('Usuario é abstrata e não pode ser instanciada.');
    }
    this.#nome = nome;
    this.#email = email;
    this.#senha = senha; // sem getter: a senha nunca sai da classe
  }

  get nome() { return this.#nome; }
  get email() { return this.#email; }

  autenticar(senhaDigitada) {
    return senhaDigitada === this.#senha;
  }

  // Métodos abstratos
  obterTipoPerfil() { throw new Error('Método abstrato: obterTipoPerfil()'); }
  gerarPainelResumo() { throw new Error('Método abstrato: gerarPainelResumo()'); }
}

class Administrador extends Usuario {
  #cargo;

  constructor(nome, email, senha, cargo) {
    super(nome, email, senha);
    this.#cargo = cargo;
  }

  obterTipoPerfil() { return 'Administrador'; }

  gerarPainelResumo() {
    return `Cargo: ${this.#cargo}. Gerencia as trilhas de estudo.`;
  }
}

// ---------- Etapa 3 + 7: Responsavel (associação com Discente) ----------
class Responsavel extends Usuario {
  #parentesco;
  #discentes = [];
  #metas = new Map(); // Discente -> MetaEstudo

  constructor(nome, email, senha, parentesco) {
    super(nome, email, senha);
    this.#parentesco = parentesco;
  }

  vincularDiscente(discente) {
    if (this.#discentes.includes(discente)) return false; // sem duplicar
    this.#discentes.push(discente);
    return true;
  }

  definirMeta(discente, minutos) {
    let meta = this.#metas.get(discente);
    if (meta) {
      meta.redefinirMeta(minutos);
    } else {
      meta = new MetaEstudo(minutos);
      this.#metas.set(discente, meta);
    }
    return meta;
  }

  obterMeta(discente) {
    return this.#metas.get(discente);
  }

  getDiscentes() {
    return [...this.#discentes]; // devolve uma cópia
  }

  obterTipoPerfil() { return 'Responsável'; }

  gerarPainelResumo() {
    const nomes = this.#discentes.map((d) => d.nome).join(', ') || 'ninguém';
    return `${this.#parentesco}. Acompanha: ${nomes}.`;
  }
}

// ---------- Etapa 3 + 5: Discente (sobrecarga de registrarEstudo) ----------
class Discente extends Usuario {
  #ra;
  #xpTotal = 0;
  #historico = [];

  constructor(nome, email, senha, ra) {
    super(nome, email, senha);
    this.#ra = ra;
  }

  get ra() { return this.#ra; }
  get xpTotal() { return this.#xpTotal; }

  getHistorico() {
    return [...this.#historico];
  }

  // Sobrecarga: o método escolhe o que fazer pela quantidade de argumentos
  //  1) registrarEstudo(sessao)
  //  2) registrarEstudo(disciplina, minutos)                       -> Pomodoro
  //  3) registrarEstudo(disciplina, horaInicio, horaFim, paginas)   -> Leitura
  registrarEstudo(a, b, c, d) {
    let sessao;
    if (arguments.length === 1) {
      sessao = a;
    } else if (arguments.length === 2) {
      const ciclos = Math.max(1, Math.floor(b / 25));
      sessao = new SessaoPomodoro(a, b, ciclos);
    } else if (arguments.length === 4) {
      const minutos = (c - b) * 60;
      sessao = new SessaoLeitura(a, minutos, d, true);
    } else {
      throw new Error('Forma de registro inválida.');
    }
    this.#historico.push(sessao);
    this.#xpTotal += sessao.calcularXp();
    return sessao;
  }

  obterTipoPerfil() { return 'Discente'; }

  gerarPainelResumo() {
    return `RA ${this.#ra} - ${this.#xpTotal} XP em ${this.#historico.length} sessões.`;
  }
}

// ---------- Etapa 4: SessaoEstudo (abstrata) e subclasses ----------
class SessaoEstudo {
  #disciplina;
  #duracaoMinutos;

  constructor(disciplina, duracaoMinutos) {
    if (new.target === SessaoEstudo) {
      throw new Error('SessaoEstudo é abstrata.');
    }
    this.#disciplina = disciplina;
    this.#duracaoMinutos = duracaoMinutos;
  }

  get disciplina() { return this.#disciplina; }
  get duracaoMinutos() { return this.#duracaoMinutos; }

  obterModalidade() { throw new Error('Método abstrato: obterModalidade()'); }
  calcularXp() { throw new Error('Método abstrato: calcularXp()'); }

  gerarFeedback() {
    return `${this.obterModalidade()} em ${this.#disciplina.nome} (${this.#duracaoMinutos} min) -> +${this.calcularXp()} XP`;
  }

  paraJson() {
    return JSON.stringify({
      disciplina: this.#disciplina.nome,
      tipoModalidade: this.obterModalidade(),
      duracaoMinutos: this.#duracaoMinutos,
      xpGanho: this.calcularXp(),
    });
  }
}

class SessaoPomodoro extends SessaoEstudo {
  #ciclos;

  constructor(disciplina, duracaoMinutos, ciclos) {
    super(disciplina, duracaoMinutos);
    this.#ciclos = ciclos;
  }

  obterModalidade() { return 'Pomodoro'; }
  calcularXp() { return this.duracaoMinutos * 2 + this.#ciclos * 15; }
}

class SessaoExercicios extends SessaoEstudo {
  #totalQuestoes;
  #acertos;

  constructor(disciplina, duracaoMinutos, totalQuestoes, acertos) {
    super(disciplina, duracaoMinutos);
    this.#totalQuestoes = totalQuestoes;
    this.#acertos = acertos;
  }

  obterModalidade() { return 'Exercicios'; }
  calcularXp() { return this.duracaoMinutos + this.#acertos * 10; }

  gerarFeedback() {
    return `${super.gerarFeedback()} (${this.#acertos}/${this.#totalQuestoes} acertos)`;
  }
}

class SessaoLeitura extends SessaoEstudo {
  #paginas;
  #fezResumo;

  constructor(disciplina, duracaoMinutos, paginas, fezResumo) {
    super(disciplina, duracaoMinutos);
    this.#paginas = paginas;
    this.#fezResumo = fezResumo;
  }

  obterModalidade() { return 'Leitura'; }
  calcularXp() { return this.duracaoMinutos + this.#paginas * 3 + (this.#fezResumo ? 25 : 0); }
}

// ---------- Etapa 6: classes que implementam INotificador ----------
class NotificadorEmail {
  obterCanal() { return 'E-mail'; }

  enviarAlerta(destinatario, mensagem) {
    console.log(`[E-mail para ${destinatario}] ${mensagem}`);
    return true;
  }
}

class NotificadorPainel {
  #mostrar;

  constructor(funcaoMostrar) {
    this.#mostrar = funcaoMostrar;
  }

  obterCanal() { return 'Painel'; }

  enviarAlerta(destinatario, mensagem) {
    this.#mostrar(mensagem);
    return true;
  }
}

// ---------- Etapa 7: TrilhaEstudo (agregação) ----------
class TrilhaEstudo {
  #titulo;
  #disciplinas = [];

  constructor(titulo) {
    this.#titulo = titulo;
  }

  get titulo() { return this.#titulo; }

  // A disciplina é criada fora e só é adicionada aqui
  adicionarDisciplina(disciplina) {
    if (!this.#disciplinas.includes(disciplina)) this.#disciplinas.push(disciplina);
  }

  getDisciplinas() {
    return [...this.#disciplinas];
  }

  calcularCargaTotal() {
    return this.#disciplinas.reduce((total, d) => total + d.cargaHoraria, 0);
  }
}

// ---------- Etapa 8: PlanoEstudo (composição) ----------
class ItemCronograma {
  constructor(dia, minutos) {
    this.dia = dia;
    this.minutos = minutos;
  }
}

class PlanoEstudo {
  #itens = [];

  // O item nasce aqui dentro e morre junto com o plano
  adicionarItem(dia, minutos) {
    this.#itens.push(new ItemCronograma(dia, minutos));
  }

  calcularTotal() {
    return this.#itens.reduce((total, item) => total + item.minutos, 0);
  }

  listarItens() {
    return this.#itens.map((item) => `${item.dia}: ${item.minutos} min`);
  }
}

// ---------- Etapa 8: ServicoAlertaResponsavel (dependência) ----------
class ServicoAlertaResponsavel {
  avaliarDiscente(discente, meta, responsavel, notificador) {
    if (!implementa(notificador, INotificador)) {
      throw new Error('O notificador precisa implementar INotificador.');
    }
    const mensagem = meta.estaCumprida()
      ? `Parabéns! ${discente.nome} cumpriu a meta semanal.`
      : `${discente.nome} está com ${meta.calcularPercentual()}% da meta semanal.`;
    return notificador.enviarAlerta(responsavel.email, mensagem);
  }
}

// ---------- Etapa 10: ClienteBackendEstudo (API C# + MySQL) ----------
class ClienteBackendEstudo {
  #url;

  constructor(url = 'http://localhost:5080') {
    this.#url = url;
  }

  async #enviar(metodo, rota, corpo) {
    const resposta = await fetch(this.#url + rota, {
      method: metodo,
      headers: { 'Content-Type': 'application/json' },
      body: corpo,
    });
    if (!resposta.ok) throw new Error(`Erro ${resposta.status} em ${rota}`);
    return resposta.json();
  }

  verificarStatus() { return this.#enviar('GET', '/api/status'); }
  listarSessoes() { return this.#enviar('GET', '/api/sessoes'); }
  obterRelatorio(nome) { return this.#enviar('GET', '/api/relatorio/' + encodeURIComponent(nome)); }

  registrarSessao(sessao, discente) {
    const dados = { discenteNome: discente.nome, ...JSON.parse(sessao.paraJson()) };
    return this.#enviar('POST', '/api/sessoes', JSON.stringify(dados));
  }

  salvarMeta(meta, discente, responsavel) {
    const dados = { discenteNome: discente.nome, responsavelNome: responsavel.nome, ...JSON.parse(meta.paraJson()) };
    return this.#enviar('POST', '/api/metas', JSON.stringify(dados));
  }
}

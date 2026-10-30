# FecapStudy

Plataforma de apoio ao estudo desenvolvida para o Projeto Integrador da FECAP.
O aluno registra suas sessões de estudo, ganha XP e acompanha a meta semanal
definida pelo responsável, que pode ser avisado sobre o progresso. Os dados são
gravados em um banco MySQL por meio de uma API em C#.

## Tecnologias

- **JavaScript** (núcleo orientado a objetos)
- **HTML5 + CSS3** (interface gráfica)
- **C# + MySQL** (backend `BackendEstudoAPI.exe`, porta 5080)

## Funcionalidades

A tela é uma página única, dividida em cartões:

| Cartão | O que mostra ou faz |
|---|---|
| **Perfis** | Painel do discente, do responsável e do administrador, lado a lado |
| **Nova sessão de estudo** | Registra sessões de **Pomodoro**, **Exercícios** ou **Leitura**; os campos mudam conforme a modalidade |
| **Meta semanal** | Barra de progresso da meta e botão para notificar o responsável |
| **Histórico** | Lista das sessões registradas, com o XP ganho em cada uma |
| **Banco de dados** | Carrega as sessões gravadas no servidor e mostra o relatório do aluno |

O indicador no topo da página mostra se o servidor está online ou offline.

### Cálculo de XP

| Modalidade | Fórmula |
|---|---|
| Pomodoro | `minutos × 2 + ciclos × 15` |
| Exercícios | `minutos + acertos × 10` |
| Leitura | `minutos + páginas × 3 + 25` (se fez resumo) |

## Conceitos de POO aplicados

Nesta versão, os atributos são privados (`#`) e são lidos por propriedades
`get`, como em `disciplina.nome` e `discente.xpTotal`.

| Conceito | Onde aparece |
|---|---|
| Abstração | `Disciplina`, com código, nome, categoria e carga horária (padrão de 2h) |
| Encapsulamento | `MetaEstudo`: os minutos só aumentam por `registrarAvanco()` (de 1 a 480 por sessão), e `Usuario` não tem getter de senha |
| Classe abstrata | `Usuario` e `SessaoEstudo` bloqueiam `new` com `new.target` |
| Herança | `Usuario` → `Discente`, `Responsavel`, `Administrador` e `SessaoEstudo` → `SessaoPomodoro`, `SessaoExercicios`, `SessaoLeitura` |
| Polimorfismo dinâmico | `calcularXp()`, `gerarFeedback()` e `gerarPainelResumo()` sobrescritos em cada classe; os perfis são desenhados num único laço |
| Sobrecarga | `Discente.registrarEstudo()` escolhe a forma pela quantidade de argumentos: `(sessao)`, `(disciplina, minutos)` ou `(disciplina, horaInicio, horaFim, paginas)` |
| Interfaces | `INotificador` e `IExportavelJson`, listas de métodos verificadas pela função `implementa()` |
| Associação | `Responsavel` → `Discente`, sem vincular o mesmo aluno duas vezes |
| Agregação | `TrilhaEstudo` ◇ `Disciplina` |
| Composição | `PlanoEstudo` ◆ `ItemCronograma` |
| Dependência | `ServicoAlertaResponsavel` e `ClienteBackendEstudo` |

A trilha de disciplinas e o cronograma semanal aparecem no console do
navegador (F12).

## Estrutura

```
index.html    tela do sistema (com o estilo CSS)
classes.js    classes do núcleo orientado a objetos
app.js        eventos da tela e comunicação com o backend
```

## Como executar

1. Inicie o MySQL (por exemplo, pelo XAMPP).
2. Execute `iniciar_backend.bat` na pasta do backend. O banco `fecap_estudo`
   é criado automaticamente.
3. Abra o arquivo `index.html` no navegador.

> Sem o backend rodando, o sistema funciona normalmente, mas os dados ficam só
> na tela. Sem o MySQL ligado, o backend salva os dados em um arquivo JSON local.

## Rotas da API utilizadas

| Método | Rota | Descrição |
|---|---|---|
| GET | `/api/status` | Verifica a conexão com o servidor |
| POST | `/api/sessoes` | Grava uma sessão de estudo |
| GET | `/api/sessoes` | Lista as sessões gravadas |
| GET | `/api/relatorio/{nome}` | Relatório do discente |

A classe `ClienteBackendEstudo` também tem o método `salvarMeta()`, que envia
a meta para `POST /api/metas`.

## Autores

Raphael

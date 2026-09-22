// Pace — Motor de Correção Ortográfica e Sugestões Inteligentes (Português)

const PaceSpell = (function() {
  const CUSTOM_KEY = 'pace_user_dictionary';
  const ignoredWords = new Set();

  function getUserWords() {
    try {
      return JSON.parse(localStorage.getItem(CUSTOM_KEY) || '[]');
    } catch {
      return [];
    }
  }

  function addUserWord(word) {
    if (!word) return;
    const clean = word.trim().toLowerCase();
    const words = getUserWords();
    if (!words.includes(clean)) {
      words.push(clean);
      localStorage.setItem(CUSTOM_KEY, JSON.stringify(words));
    }
  }

  function ignoreWord(word) {
    if (word) ignoredWords.add(word.trim().toLowerCase());
  }

  // Mapa de palavras sem acento / com erros comuns para a forma correta
  const DIRECT_FIXES = {
    // Abreviações & gírias digitais comuns
    'nao': 'não', 'ns': 'não sei', 'corrgir': 'corrigir', 'cliar': 'clicar',
    'dese': 'desse', 'tamaho': 'tamanho', 'tanho': 'tamanho', 'tambem': 'também',
    'tbm': 'também', 'tb': 'também', 'voce': 'você', 'voces': 'vocês', 'vc': 'você',
    'vcs': 'vocês', 'pq': 'porque', 'ate': 'até', 'ja': 'já', 'so': 'só',
    'ha': 'há', 'estao': 'estão', 'sao': 'são', 'entao': 'então', 'rapido': 'rápido',
    'rapida': 'rápida', 'rapidos': 'rápidos', 'rapidas': 'rápidas', 'facil': 'fácil',
    'dificil': 'difícil', 'possivel': 'possível', 'impossivel': 'impossível',
    'urgente': 'urgente', 'importante': 'importante', 'projeto': 'projeto',
    'tarefa': 'tarefa', 'amanha': 'amanhã', 'hoje': 'hoje', 'ontem': 'ontem',
    'musica': 'música', 'musicas': 'músicas', 'reuniao': 'reunião', 'reunioes': 'reuniões',
    'exercicio': 'exercício', 'exercicios': 'exercícios', 'relogio': 'relógio',
    'relogios': 'relógios', 'defenições': 'definições', 'defenicoes': 'definições',
    'definicoes': 'definições', 'definicao': 'definição', 'defenir': 'definir',
    'subtill': 'subtil', 'tivel': 'tiver', 'configuracoes': 'configurações',
    'configuracao': 'configuração', 'obg': 'obrigado', 'obgd': 'obrigado',
    'pf': 'por favor', 'pff': 'por favor', 'msm': 'mesmo', 'agr': 'agora',
    'qdo': 'quando', 'cmg': 'comigo', 'ctz': 'certeza', 'qto': 'quanto',
    'td': 'tudo', 'tds': 'todos', 'mt': 'muito', 'mto': 'muito', 'mts': 'muitos',
    'pra': 'para', 'pro': 'para o', 'pras': 'para as', 'pros': 'para os',
    'blz': 'beleza', 'dnv': 'de novo', 'oq': 'o que',

    // Erros fonéticos e ortográficos frequentes em português
    'concerteza': 'com certeza', 'agente': 'a gente', 'fais': 'faz', 'trais': 'traz',
    'menas': 'menos', 'seje': 'seja', 'esteje': 'esteja', 'pobrema': 'problema',
    'desisão': 'decisão', 'desisao': 'decisão', 'decisao': 'decisão', 'decisoes': 'decisões',
    'ansioso': 'ansioso', 'ancioso': 'ansioso', 'excessivo': 'excessivo', 'escesso': 'excesso',
    'excesso': 'excesso', 'geito': 'jeito', 'viagen': 'viagem', 'enxergar': 'enxergar',
    'enchergar': 'enxergar', 'mecher': 'mexer', 'faser': 'fazer', 'quizer': 'quiser',
    'pesquizar': 'pesquisar', 'analizar': 'analisar', 'organisar': 'organizar',
    'oje': 'hoje', 'ora': 'hora', 'aver': 'haver', 'ouve': 'houve', 'omem': 'homem',
    'abitual': 'habitual', 'excessao': 'exceção', 'escecao': 'exceção', 'excecao': 'exceção',

    // Mapeamento extensivo de palavras acentuadas essenciais
    'esta': 'está', 'estara': 'estará', 'estao': 'estão', 'estavamos': 'estávamos',
    'modulo': 'módulo', 'modulos': 'módulos', 'codigo': 'código', 'codigos': 'códigos',
    'pagina': 'página', 'paginas': 'páginas', 'numero': 'número', 'numeros': 'números',
    'periodo': 'período', 'periodos': 'períodos', 'metodo': 'método', 'metodos': 'métodos',
    'duvida': 'dúvida', 'duvidas': 'dúvidas', 'horario': 'horário', 'horarios': 'horários',
    'calendario': 'calendário', 'calendarios': 'calendários', 'relatorio': 'relatório',
    'relatorios': 'relatórios', 'prioritario': 'prioritário', 'prioritaria': 'prioritária',
    'necessario': 'necessário', 'necessaria': 'necessária', 'necessarios': 'necessários',
    'inicio': 'início', 'servico': 'serviço', 'servicos': 'serviços', 'espaco': 'espaço',
    'espacos': 'espaços', 'comeco': 'começo', 'comecar': 'começar', 'forca': 'força',
    'mudanca': 'mudança', 'mudancas': 'mudanças', 'esperanca': 'esperança',
    'diferenca': 'diferença', 'diferencas': 'diferenças', 'presenca': 'presença',
    'licenca': 'licença', 'util': 'útil', 'inutil': 'inútil', 'uteis': 'úteis',
    'proximo': 'próximo', 'proxima': 'próxima', 'proximos': 'próximos', 'proximas': 'próximas',
    'ultimo': 'último', 'ultima': 'última', 'ultimos': 'últimos', 'ultimas': 'últimas',
    'otimo': 'ótimo', 'otima': 'ótima', 'otimos': 'ótimos', 'otimas': 'ótimas',
    'maximo': 'máximo', 'minimo': 'mínimo', 'basico': 'básico', 'basica': 'básica',
    'classico': 'clássico', 'critico': 'crítico', 'publico': 'público', 'publica': 'pública',
    'politica': 'política', 'politico': 'político', 'ciencia': 'ciência', 'ciencias': 'ciências',
    'experiencia': 'experiência', 'experiencias': 'experiências', 'consciencia': 'consciência',
    'paciencia': 'paciência', 'estrategia': 'estratégia', 'estrategias': 'estratégias',
    'saude': 'saúde', 'historia': 'história', 'historias': 'histórias', 'memoria': 'memória',
    'analise': 'análise', 'analises': 'análises', 'sintese': 'síntese', 'pratica': 'prática',
    'pratico': 'prático', 'conteudo': 'conteúdo', 'conteudos': 'conteúdos', 'versao': 'versão',
    'versoes': 'versões', 'secao': 'seção', 'secoes': 'seções', 'sessao': 'sessão',
    'sessoes': 'sessões', 'informacao': 'informação', 'informacoes': 'informações',
    'organizacao': 'organização', 'organizacoes': 'organizações', 'producao': 'produção',
    'situacao': 'situação', 'situacoes': 'situações', 'solucao': 'solução',
    'solucoes': 'soluções', 'atencao': 'atenção', 'opcao': 'opção', 'opcoes': 'opções',
    'funcao': 'função', 'funcoes': 'funções', 'direcao': 'direção', 'direcoes': 'direções',
    'condicao': 'condição', 'condicoes': 'condições', 'acao': 'ação', 'acoes': 'ações',
    'comunicacao': 'comunicação', 'aplicacao': 'aplicação', 'criacao': 'criação',
    'avaliacao': 'avaliação', 'geracao': 'geração', 'evolucao': 'evolução',
    'execucao': 'execução', 'visao': 'visão', 'padrao': 'padrão', 'padroes': 'padrões',
    'grau': 'grau', 'irmao': 'irmão', 'irmaos': 'irmãos', 'razao': 'razão',
    'coracao': 'coração', 'emocao': 'emoção', 'conclusao': 'conclusão',
    'introducao': 'introdução', 'descricao': 'descrição', 'substituicao': 'substituição',
    'lingua': 'língua', 'pais': 'país', 'paises': 'países', 'mes': 'mês',
    'meses': 'meses', 'tres': 'três', 'apos': 'após', 'alem': 'além',
    'porem': 'porém', 'alguem': 'alguém', 'ninguem': 'ninguém', 'parabens': 'parabéns',
    'agua': 'água', 'area': 'área', 'areas': 'áreas', 'epoca': 'época',
    'proprio': 'próprio', 'propria': 'própria', 'proprios': 'próprios',
    'serio': 'sério', 'seria': 'séria', 'serios': 'sérios', 'familia': 'família',
    'individuo': 'indivíduo', 'criterio': 'critério', 'usuario': 'usuário',
    'usuarios': 'usuários', 'salario': 'salário', 'cenario': 'cenário',
    'sabado': 'sábado', 'domingo': 'domingo', 'marco': 'março', 'facamos': 'façamos',
    'abraco': 'abraço', 'laco': 'laço', 'pedaco': 'pedaço', 'danca': 'dança',
    'lembranca': 'lembrança', 'seguranca': 'segurança', 'lideranca': 'liderança',
    'cobranca': 'cobrança', 'mudancas': 'mudanças', 'lembrancas': 'lembranças'
  };

  // Vocabulário de base enriquecido em português para cálculo de distância Levenshtein
  const VOCABULARY = [
    'abaixo', 'aberto', 'abrir', 'absoluto', 'acabar', 'acaso', 'aceitar', 'acima',
    'acontecer', 'acordo', 'acreditar', 'adicionar', 'administração', 'admitir', 'afastar',
    'afirmar', 'agente', 'agora', 'agradecer', 'água', 'ajuda', 'ajudar', 'alcançar',
    'além', 'algum', 'alguma', 'algumas', 'alguém', 'alguns', 'alto', 'altura',
    'amar', 'amarelo', 'amigo', 'amiga', 'amigos', 'amor', 'análise', 'andar',
    'animais', 'animal', 'ano', 'anos', 'anotação', 'anotações', 'anterior', 'antigo',
    'apagar', 'aparecer', 'apenas', 'aplicação', 'aplicar', 'apoio', 'apontar', 'após',
    'aprender', 'apresentar', 'aproveitar', 'aqui', 'área', 'arquivo', 'artigo',
    'árvore', 'aspecto', 'assunto', 'até', 'atenção', 'atingir', 'atividade', 'atividades',
    'atrás', 'através', 'atual', 'atualizar', 'aumento', 'avançar', 'avaliação', 'azul',
    'baixo', 'banco', 'bastante', 'básico', 'batalha', 'beber', 'beleza', 'belo',
    'bem', 'bloquear', 'boa', 'boas', 'bom', 'bons', 'branco', 'breve', 'buscar',
    'cabeça', 'caber', 'cada', 'cadeira', 'café', 'caixa', 'cálculo', 'calendário',
    'calmo', 'caminho', 'campo', 'cancelar', 'capacidade', 'capital', 'caráter',
    'carro', 'carta', 'cartão', 'casa', 'caso', 'categoria', 'causa', 'cedo',
    'celular', 'cenário', 'centro', 'certo', 'certeza', 'chamar', 'chance', 'chegar',
    'chefe', 'cheio', 'chover', 'chuva', 'ciência', 'cidade', 'cima', 'cinco',
    'claro', 'classe', 'clássico', 'cliente', 'coisa', 'coisas', 'coleta', 'colocar',
    'com', 'comando', 'começar', 'começo', 'comércio', 'cometer', 'como', 'companhia',
    'completo', 'comprar', 'compreender', 'comum', 'comunicação', 'comunidade', 'conclusão',
    'condição', 'conectar', 'conferir', 'configuração', 'configurações', 'confirmar',
    'conforme', 'conhecer', 'conhecimento', 'conjunto', 'conseguir', 'conselho',
    'considerar', 'construir', 'conta', 'contar', 'conteúdo', 'continuar', 'contra',
    'contrário', 'controle', 'conversa', 'conversar', 'cópia', 'copiar', 'coração',
    'corpo', 'correto', 'corrigir', 'cortar', 'costume', 'crescer', 'criação',
    'criar', 'crise', 'critério', 'crítico', 'cuidado', 'cultura', 'curto',
    'dar', 'dados', 'data', 'de', 'debaixo', 'decidir', 'decisão', 'declarar',
    'dedicar', 'definir', 'definição', 'definições', 'deixar', 'demais', 'demorar',
    'dentro', 'depois', 'depósito', 'desafio', 'descansar', 'descanso', 'descrever',
    'descrição', 'desde', 'desejar', 'desenho', 'desenvolver', 'design', 'desistir',
    'detalhe', 'determinar', 'dia', 'diário', 'dias', 'diferença', 'diferente',
    'difícil', 'dificuldade', 'diminuir', 'dinheiro', 'direção', 'direito', 'direto',
    'diretor', 'discutir', 'disponível', 'dispositivo', 'distância', 'dizer', 'documento',
    'dois', 'domingo', 'dor', 'dormir', 'doutor', 'dúvida', 'duas', 'duração',
    'e', 'economia', 'editar', 'editor', 'efeito', 'elemento', 'eliminar', 'email',
    'embaixo', 'empresa', 'encontrar', 'energia', 'enquanto', 'ensinar', 'entanto',
    'entender', 'então', 'entrar', 'entre', 'entrega', 'enviar', 'época', 'equipe',
    'erro', 'escala', 'escolha', 'escolher', 'esconder', 'escrever', 'escrita',
    'espaço', 'especial', 'esperança', 'esperar', 'espírito', 'esquecer', 'essa',
    'essas', 'esse', 'esses', 'esta', 'está', 'estado', 'estados', 'estágio',
    'estamos', 'estão', 'estar', 'estava', 'este', 'estratégia', 'estrutura',
    'estudo', 'etapa', 'eu', 'evento', 'evitar', 'evolução', 'exemplo', 'excelente',
    'exercício', 'exercícios', 'existir', 'experiência', 'explicar', 'exportar',
    'fácil', 'facilidade', 'faixa', 'falar', 'falta', 'família', 'favor', 'fazer',
    'fechar', 'feliz', 'ferramenta', 'festa', 'ficar', 'filho', 'fim', 'final',
    'fixar', 'foco', 'focar', 'folha', 'forma', 'formato', 'forte', 'força',
    'foto', 'frequente', 'frente', 'frio', 'funcionar', 'função', 'fundo', 'futuro',
    'ganhar', 'geral', 'geração', 'gerenciar', 'gostar', 'governo', 'grau', 'grande',
    'grupo', 'guardar', 'guerra', 'hábito', 'haver', 'história', 'hoje', 'homem',
    'hora', 'horário', 'horas', 'humano', 'idade', 'ideia', 'igual', 'imagem',
    'impacto', 'importante', 'importar', 'impossível', 'imprimir', 'inclusive',
    'indicar', 'índice', 'indivíduo', 'informação', 'informações', 'início', 'iniciar',
    'instalar', 'inteiro', 'inteligente', 'intenção', 'interessante', 'interesse',
    'internet', 'interromper', 'intervalo', 'introdução', 'investir', 'ir', 'irmão',
    'janeiro', 'janela', 'jantar', 'jeito', 'jogo', 'jornal', 'jovem', 'junto',
    'justo', 'lado', 'lançar', 'largo', 'lembrar', 'ler', 'letra', 'levar',
    'liberdade', 'líder', 'ligar', 'limite', 'limpar', 'linha', 'linguagem', 'língua',
    'lista', 'livro', 'local', 'logo', 'longe', 'lugar', 'luz',
    'mãe', 'maior', 'maioria', 'mais', 'mal', 'mandar', 'maneira', 'manhã',
    'manter', 'mapa', 'marca', 'marcar', 'março', 'massa', 'máximo', 'médio',
    'medir', 'melhor', 'melhorar', 'membro', 'memória', 'menos', 'mensagem', 'mês',
    'mesa', 'meses', 'mesmo', 'meta', 'metade', 'método', 'metro', 'meu',
    'meus', 'mínimo', 'minuto', 'minutos', 'missão', 'modo', 'modelo', 'moderno',
    'modificar', 'módulo', 'momento', 'mostrar', 'motivo', 'mover', 'movimento',
    'muito', 'muitos', 'mulher', 'mundo', 'música', 'mudar', 'mudança',
    'nação', 'nada', 'não', 'natural', 'natureza', 'necessário', 'negócio',
    'nenhum', 'ninguém', 'nível', 'noite', 'nome', 'normal', 'norte', 'nosso',
    'nota', 'notas', 'notícia', 'notificação', 'notificações', 'novo', 'novos', 'número',
    'nunca', 'nuvem', 'o', 'objetivo', 'objetivos', 'obrigado', 'obter', 'ocorrer',
    'olhar', 'olho', 'onde', 'ontem', 'opção', 'opções', 'operação', 'ordem',
    'organização', 'organizar', 'origem', 'ou', 'outro', 'outros', 'ouvir',
    'página', 'páginas', 'pagar', 'pai', 'país', 'países', 'palavra', 'palavras',
    'papel', 'para', 'parar', 'parte', 'partes', 'participar', 'passar', 'passo',
    'passado', 'paz', 'pegar', 'pela', 'pelas', 'pelo', 'pelos', 'pensar',
    'pequeno', 'perceber', 'perder', 'perfeito', 'perigo', 'período', 'permitir',
    'perto', 'pesquisa', 'pessoa', 'pessoas', 'plano', 'poder', 'ponto', 'pontos',
    'por', 'porque', 'porém', 'porta', 'posição', 'possível', 'prazo', 'precisar',
    'preciso', 'preço', 'preferir', 'preparar', 'presença', 'presidente', 'primeiro',
    'principal', 'prioritário', 'prioridade', 'prioridades', 'privado', 'problema',
    'processo', 'produção', 'produto', 'professor', 'profundo', 'programa', 'projeto',
    'projetos', 'pronto', 'próprio', 'proteger', 'próximo', 'publicar', 'público',
    'qual', 'qualidade', 'qualquer', 'quando', 'quanto', 'quarta', 'quase', 'quatro',
    'que', 'queda', 'quem', 'querer', 'questão', 'quinta', 'quinto',
    'rápido', 'razão', 'reação', 'real', 'realidade', 'realizar', 'receber', 'recente',
    'reconhecer', 'recurso', 'rede', 'reduzir', 'referência', 'região', 'regra',
    'relatório', 'relógio', 'remover', 'renda', 'repetir', 'responder', 'resposta',
    'resultado', 'resumo', 'reunião', 'revisão', 'risco', 'rotina', 'rotinas', 'rua',
    'sábado', 'saber', 'sair', 'salário', 'salvar', 'sangue', 'saúde', 'se',
    'seção', 'século', 'segredo', 'segundo', 'segurança', 'seis', 'selecionar', 'semana',
    'sempre', 'senhor', 'sentido', 'sentir', 'separar', 'ser', 'série', 'serviço',
    'serviços', 'sessão', 'setembro', 'seu', 'seus', 'significar', 'silêncio', 'sim',
    'simples', 'sistema', 'situação', 'sobre', 'social', 'sociedade', 'sol',
    'solução', 'som', 'somente', 'sonho', 'sucesso', 'sugerir', 'sugestão', 'superar',
    'tamanho', 'também', 'tarde', 'tarefa', 'tarefas', 'tecnologia', 'tela', 'tema',
    'tempo', 'temporizador', 'tentar', 'ter', 'terceiro', 'termo', 'terra', 'texto',
    'tipo', 'tirar', 'título', 'tocar', 'toda', 'todas', 'todo', 'todos',
    'tomar', 'trabalhar', 'trabalho', 'trazer', 'três', 'trocar', 'tudo',
    'último', 'um', 'uma', 'umas', 'único', 'unir', 'universal', 'uns', 'urgente',
    'usar', 'usuário', 'útil', 'utilizar',
    'vago', 'valor', 'vantagem', 'variar', 'vazio', 'vencer', 'vender', 'vento',
    'ver', 'verdade', 'verde', 'verificar', 'versão', 'vestir', 'vez', 'vezes',
    'viagem', 'viajar', 'vida', 'vídeo', 'vermelho', 'visão', 'vista', 'viver',
    'você', 'vocês', 'volta', 'voltar', 'vontade', 'voz'
  ];

  // Algoritmo Damerau-Levenshtein eficiente com suporte a transposições
  function editDistance(a, b) {
    if (a === b) return 0;
    const al = a.length;
    const bl = b.length;
    if (al === 0) return bl;
    if (bl === 0) return al;
    if (Math.abs(al - bl) > 2) return 99;

    const matrix = [];
    for (let i = 0; i <= al; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= bl; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= al; i++) {
      for (let j = 1; j <= bl; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,      // remoção
          matrix[i][j - 1] + 1,      // inserção
          matrix[i - 1][j - 1] + cost // substituição
        );

        // Transposição de letras adjacentes (ex: "cliar" -> "clicar" / "pobrema")
        if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
          matrix[i][j] = Math.min(matrix[i][j], matrix[i - 2][j - 2] + 1);
        }
      }
    }

    return matrix[al][bl];
  }

  // Remove acentos para comparação normalizada
  function stripAccents(str) {
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  // Mapa de palavras acentuadas indexadas pela versão sem acento
  const ACCENT_INDEX = new Map();
  VOCABULARY.forEach(w => {
    const norm = stripAccents(w);
    if (norm !== w && !ACCENT_INDEX.has(norm)) {
      ACCENT_INDEX.set(norm, w);
    }
  });
  Object.keys(DIRECT_FIXES).forEach(k => {
    const val = DIRECT_FIXES[k];
    const norm = stripAccents(val);
    if (!ACCENT_INDEX.has(norm)) ACCENT_INDEX.set(norm, val);
  });

  // Função principal de obtenção de sugestões
  function getSuggestions(rawWord) {
    if (!rawWord) return { isCorrect: true, suggestions: [] };
    const clean = rawWord.replace(/^[^\wáàãâéêíóôõúçÁÀÃÂÉÊÍÓÔÕÚÇ]+|[^\wáàãâéêíóôõúçÁÀÃÂÉÊÍÓÔÕÚÇ]+$/g, '');
    if (!clean || clean.length < 2) return { isCorrect: true, suggestions: [] };

    const lower = clean.toLowerCase();
    const isCapitalized = clean[0] === clean[0].toUpperCase() && clean.length > 1 && clean[1] === clean[1].toLowerCase();
    const isAllUpper = clean.length > 1 && clean === clean.toUpperCase();

    // 1. Verificar se é palavra ignorada ou personalizada do utilizador
    if (ignoredWords.has(lower) || getUserWords().includes(lower)) {
      return { isCorrect: true, suggestions: [] };
    }

    // 2. Se a palavra exata já existe no vocabulário oficial
    const exactKnown = VOCABULARY.includes(lower);

    // 3. Recolher sugestões prioritárias
    const candidates = [];
    const seen = new Set();

    function addCandidate(cand, priority) {
      if (!cand) return;
      let formatted = cand;
      if (isAllUpper) formatted = cand.toUpperCase();
      else if (isCapitalized) formatted = cand.charAt(0).toUpperCase() + cand.slice(1);

      if (formatted.toLowerCase() !== lower && !seen.has(formatted)) {
        seen.add(formatted);
        candidates.push({ word: formatted, priority });
      }
    }

    // A. Correspondência direta em tabela de erros comuns
    if (DIRECT_FIXES[lower]) {
      addCandidate(DIRECT_FIXES[lower], 1);
    }

    // B. Correspondência de acentuação (ex: 'informacao' -> 'informação', 'esta' -> 'está', etc.)
    const norm = stripAccents(lower);
    if (ACCENT_INDEX.has(norm)) {
      addCandidate(ACCENT_INDEX.get(norm), exactKnown ? 3 : 1);
    }

    // C. Regras morfológicas / fonéticas portuguesas
    // sufixo -ao -> -ão
    if (lower.endsWith('ao') && !lower.endsWith('são')) {
      const cand = lower.slice(0, -2) + 'ão';
      addCandidate(cand, 2);
    }
    // sufixo -oes -> -ões
    if (lower.endsWith('oes')) {
      const cand = lower.slice(0, -3) + 'ões';
      addCandidate(cand, 2);
    }
    // ç antes de a, o, u (ex: 'comecar' -> 'começar')
    if (lower.includes('c') && /[aouáóú]/.test(lower)) {
      const cand = lower.replace(/c(?=[aouáóú])/g, 'ç');
      addCandidate(cand, 2);
    }
    // remoção de consoantes duplas raras em PT (ex: 'subtill' -> 'subtil')
    if (/(.)\1/.test(lower) && !/(rr|ss)/.test(lower)) {
      const cand = lower.replace(/([b-df-hj-np-tv-z])\1+/g, '$1');
      addCandidate(cand, 2);
    }

    // D. Damerau-Levenshtein com vocabulário
    if (candidates.length < 4) {
      const matchesDist1 = [];
      const matchesDist2 = [];

      for (let i = 0; i < VOCABULARY.length; i++) {
        const vWord = VOCABULARY[i];
        if (Math.abs(vWord.length - lower.length) > 2) continue;

        const dist = editDistance(lower, vWord);
        if (dist === 1) {
          matchesDist1.push(vWord);
        } else if (dist === 2 && lower.length >= 4) {
          matchesDist2.push(vWord);
        }
      }

      matchesDist1.forEach(m => addCandidate(m, 4));
      if (candidates.length < 4) {
        matchesDist2.slice(0, 3).forEach(m => addCandidate(m, 5));
      }
    }

    // Ordenar por prioridade
    candidates.sort((a, b) => a.priority - b.priority);
    const finalSuggestions = candidates.map(c => c.word).slice(0, 4);

    return {
      isCorrect: exactKnown && finalSuggestions.length === 0,
      suggestions: finalSuggestions
    };
  }

  return {
    getSuggestions,
    addUserWord,
    ignoreWord,
    getUserWords
  };
})();

window.PaceSpell = PaceSpell;

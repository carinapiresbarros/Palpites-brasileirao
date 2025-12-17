// ============================================
// CONFIGURAÇÕES GLOBAIS
// ============================================
let abaAtual = 'palpites';
const ADMIN_USUARIO = 'pires';

// ============================================
// FUNÇÕES DE LOGIN E CONTROLE
// ============================================

function entrar() {
  const nomeInput = document.getElementById("nome");
  const nome = nomeInput.value.trim();
  
  if (!nome) {
    alert("Digite seu nome para entrar no bolão!");
    nomeInput.focus();
    return;
  }
  
  // Salvar/recuperar participantes
  let participantes = JSON.parse(localStorage.getItem("participantes")) || [];
  if (!participantes.includes(nome)) {
    participantes.push(nome);
    localStorage.setItem("participantes", JSON.stringify(participantes));
  }
  
  // Salvar usuário atual
  localStorage.setItem("usuario", nome);
  
  // Limpar campo e mostrar painel
  nomeInput.value = "";
  mostrarPainel();
}

function sair() {
  if (confirm("Tem certeza que deseja sair?")) {
    localStorage.removeItem("usuario");
    location.reload();
  }
}

function mostrarPainel() {
  const usuario = localStorage.getItem("usuario");
  if (!usuario) return;
  
  // Mostrar painel principal
  document.getElementById("login").style.display = "none";
  document.getElementById("painel").style.display = "block";
  
  // Personalizar mensagem de boas-vindas
  const bemvindo = document.getElementById("bemvindo");
  if (usuario.toLowerCase() === ADMIN_USUARIO) {
    bemvindo.innerHTML = `👑 Bem-vindo, <strong style="color: #e65100;">${usuario}</strong> (Administrador)`;
  } else {
    bemvindo.innerHTML = `👤 Bem-vindo, <strong>${usuario}</strong>`;
  }
  
  // Configurar acesso baseado no usuário
  configurarAcessoUsuario(usuario);
  
  // Renderizar conteúdo inicial
  renderizarTodasAbas();
}

function configurarAcessoUsuario(usuario) {
  const ehAdm = usuario.toLowerCase() === ADMIN_USUARIO;
  const abaResultados = document.getElementById("abaResultados");
  const abaAdmin = document.getElementById("abaAdmin");
  const btnRecomecar = document.getElementById("btnRecomecar");
  
  // Mostrar/esconder abas administrativas
  if (ehAdm) {
    abaResultados.style.display = "flex";
    abaAdmin.style.display = "flex";
    btnRecomecar.style.display = "inline-block";
  } else {
    abaResultados.style.display = "none";
    abaAdmin.style.display = "none";
    btnRecomecar.style.display = "none";
    
    // Se estava em uma aba administrativa, voltar para palpites
    if (abaAtual === 'resultados' || abaAtual === 'admin') {
      mudarAba('palpites');
    }
  }
}

function mudarAba(nomeAba) {
  const usuario = localStorage.getItem("usuario");
  const ehAdm = usuario && usuario.toLowerCase() === ADMIN_USUARIO;
  
  // Bloquear acesso não autorizado
  if ((nomeAba === 'resultados' || nomeAba === 'admin') && !ehAdm) {
    alert("⚠️ Apenas o administrador Pires pode acessar esta área!");
    return;
  }
  
  // Atualizar aba atual
  abaAtual = nomeAba;
  
  // Atualizar visual das abas
  document.querySelectorAll('.aba').forEach(aba => {
    aba.classList.remove('ativa');
  });
  
  document.querySelectorAll('.conteudo-aba').forEach(conteudo => {
    conteudo.classList.remove('ativa');
  });
  
  // Ativar aba selecionada
  const abaSelecionada = document.querySelector(`.aba[onclick*="${nomeAba}"]`);
  const conteudoSelecionado = document.getElementById(`conteudo-${nomeAba}`);
  
  if (abaSelecionada && conteudoSelecionado) {
    abaSelecionada.classList.add('ativa');
    conteudoSelecionado.classList.add('ativa');
    
    // Renderizar conteúdo específico da aba
    switch(nomeAba) {
      case 'palpites':
        renderizarRodadasPalpites();
        break;
      case 'classificacao':
        renderizarClassificacao();
        break;
      case 'resultados':
        renderizarRodadasResultados();
        break;
      case 'admin':
        renderizarRodadasAdmin();
        break;
    }
  }
}

// ============================================
// FUNÇÕES DE ADMINISTRAÇÃO (SÓ PIRES)
// ============================================

function criarRodada() {
  const usuario = localStorage.getItem("usuario");
  if (usuario.toLowerCase() !== ADMIN_USUARIO) {
    alert("Apenas o administrador pode criar rodadas!");
    return;
  }
  
  const nomeInput = document.getElementById("nomeRodada");
  const nome = nomeInput.value.trim();
  
  if (!nome) {
    alert("Digite um nome para a rodada!");
    nomeInput.focus();
    return;
  }
  
  // Criar nova rodada
  let rodadas = JSON.parse(localStorage.getItem("rodadas")) || [];
  rodadas.push({
    nome: nome,
    jogos: [],
    ativa: true
  });
  
  localStorage.setItem("rodadas", JSON.stringify(rodadas));
  nomeInput.value = "";
  
  // Renderizar todas as abas
  renderizarTodasAbas();
  mudarAba('admin');
  
  alert(`✅ Rodada "${nome}" criada com sucesso!`);
}

function adicionarJogo(indexRodada) {
  const usuario = localStorage.getItem("usuario");
  if (usuario.toLowerCase() !== ADMIN_USUARIO) return;
  
  const casa = document.getElementById(`casa-adm-${indexRodada}`).value.trim();
  const fora = document.getElementById(`fora-adm-${indexRodada}`).value.trim();
  
  if (!casa || !fora) {
    alert("Preencha os nomes dos dois times!");
    return;
  }
  
  let rodadas = JSON.parse(localStorage.getItem("rodadas")) || [];
  rodadas[indexRodada].jogos.push({
    casa: casa,
    fora: fora,
    resultado: ""
  });
  
  localStorage.setItem("rodadas", JSON.stringify(rodadas));
  renderizarRodadasAdmin();
  
  // Limpar campos
  document.getElementById(`casa-adm-${indexRodada}`).value = "";
  document.getElementById(`fora-adm-${indexRodada}`).value = "";
}

function removerJogo(indexRodada, indexJogo) {
  if (!confirm("Remover este jogo? Todos os palpites serão perdidos.")) return;
  
  let rodadas = JSON.parse(localStorage.getItem("rodadas")) || [];
  rodadas[indexRodada].jogos.splice(indexJogo, 1);
  localStorage.setItem("rodadas", JSON.stringify(rodadas));
  
  // Remover palpites deste jogo
  let palpites = JSON.parse(localStorage.getItem("palpites")) || {};
  Object.keys(palpites).forEach(usuario => {
    if (palpites[usuario][indexRodada]) {
      delete palpites[usuario][indexRodada][indexJogo];
    }
  });
  localStorage.setItem("palpites", JSON.stringify(palpites));
  
  renderizarTodasAbas();
}

function removerRodada(index) {
  if (!confirm("Remover esta rodada e todos os seus jogos?")) return;
  
  let rodadas = JSON.parse(localStorage.getItem("rodadas")) || [];
  rodadas.splice(index, 1);
  localStorage.setItem("rodadas", JSON.stringify(rodadas));
  
  renderizarTodasAbas();
}

function recomecarTudo() {
  const usuario = localStorage.getItem("usuario");
  if (usuario.toLowerCase() !== ADMIN_USUARIO) return;
  
  if (!confirm("🚨 ATENÇÃO PIRES! 🚨\n\nIsso apagará TODAS as rodadas, jogos e palpites!\n\nContinuar?")) return;
  
  const confirmacao = prompt("Digite 'ZERAR' para confirmar:");
  if (confirmacao !== "ZERAR") {
    alert("❌ Operação cancelada.");
    return;
  }
  
  // Manter apenas participantes e usuário atual
  const participantes = JSON.parse(localStorage.getItem("participantes")) || [];
  const usuarioAtual = localStorage.getItem("usuario");
  
  localStorage.clear();
  
  localStorage.setItem("participantes", JSON.stringify(participantes));
  localStorage.setItem("usuario", usuarioAtual);
  
  alert("✅ Bolão zerado! Você pode começar um novo campeonato.");
  location.reload();
}

// ============================================
// FUNÇÕES DE PALPITES E RESULTADOS
// ============================================

function salvarPalpite(indexRodada, indexJogo, valor) {
  const usuario = localStorage.getItem("usuario");
  if (!usuario) return;
  
  // Validar formato do palpite
  if (valor && !/^\d+x\d+$/.test(valor)) {
    alert("Use o formato: números x números (ex: 2x1)");
    return;
  }
  
  let palpites = JSON.parse(localStorage.getItem("palpites")) || {};
  
  if (!palpites[usuario]) palpites[usuario] = {};
  if (!palpites[usuario][indexRodada]) palpites[usuario][indexRodada] = {};
  
  palpites[usuario][indexRodada][indexJogo] = valor;
  localStorage.setItem("palpites", JSON.stringify(palpites));
  
  // Recalcular pontos
  calcularPontosUsuario(usuario);
  
  // Atualizar exibição
  if (abaAtual === 'palpites') {
    renderizarRodadasPalpites();
  }
  if (abaAtual === 'classificacao') {
    renderizarClassificacao();
  }
}

function salvarResultado(indexRodada, indexJogo, valor) {
  const usuario = localStorage.getItem("usuario");
  if (usuario.toLowerCase() !== ADMIN_USUARIO) return;
  
  // Validar formato do resultado
  if (valor && !/^\d+x\d+$/.test(valor)) {
    alert("Use o formato: números x números (ex: 2x1)");
    return;
  }
  
  let rodadas = JSON.parse(localStorage.getItem("rodadas")) || [];
  rodadas[indexRodada].jogos[indexJogo].resultado = valor;
  localStorage.setItem("rodadas", JSON.stringify(rodadas));
  
  // Recalcular pontos para todos
  calcularPontosTodosUsuarios();
  
  // Atualizar todas as abas
  renderizarTodasAbas();
}

function obterPalpiteUsuario(usuario, indexRodada, indexJogo) {
  let palpites = JSON.parse(localStorage.getItem("palpites")) || {};
  return palpites[usuario]?.[indexRodada]?.[indexJogo] || "";
}

function obterMeuPalpite(indexRodada, indexJogo) {
  const usuario = localStorage.getItem("usuario");
  return obterPalpiteUsuario(usuario, indexRodada, indexJogo);
}

// ============================================
// FUNÇÕES DE CÁLCULO DE PONTOS
// ============================================

function calcularPontosJogo(palpite, resultado) {
  if (!palpite || !resultado) return 0;
  
  try {
    const [palpiteCasa, palpiteFora] = palpite.split('x').map(Number);
    const [resultadoCasa, resultadoFora] = resultado.split('x').map(Number);
    
    // Palpite exato: 3 pontos
    if (palpiteCasa === resultadoCasa && palpiteFora === resultadoFora) {
      return 3;
    }
    
    // Acertou vencedor/empate: 1 ponto
    const vencedorPalpite = 
      palpiteCasa > palpiteFora ? 'casa' :
      palpiteCasa < palpiteFora ? 'fora' : 'empate';
    
    const vencedorResultado = 
      resultadoCasa > resultadoFora ? 'casa' :
      resultadoCasa < resultadoFora ? 'fora' : 'empate';
    
    if (vencedorPalpite === vencedorResultado) {
      return 1;
    }
    
    return 0;
  } catch (e) {
    return 0;
  }
}

function calcularPontosUsuario(usuario) {
  let rodadas = JSON.parse(localStorage.getItem("rodadas")) || [];
  let palpites = JSON.parse(localStorage.getItem("palpites")) || {};
  let pontosUsuario = JSON.parse(localStorage.getItem("pontos")) || {};
  
  let totalPontos = 0;
  let acertosExatos = 0;
  let acertosVencedor = 0;
  let detalhes = {};
  
  rodadas.forEach((rodada, r) => {
    rodada.jogos.forEach((jogo, j) => {
      const palpite = palpites[usuario]?.[r]?.[j];
      const resultado = jogo.resultado;
      
      if (palpite && resultado) {
        const pontos = calcularPontosJogo(palpite, resultado);
        totalPontos += pontos;
        
        if (pontos === 3) acertosExatos++;
        if (pontos === 1) acertosVencedor++;
        
        if (!detalhes[r]) detalhes[r] = {};
        detalhes[r][j] = pontos;
      }
    });
  });
  
  pontosUsuario[usuario] = {
    total: totalPontos,
    acertosExatos: acertosExatos,
    acertosVencedor: acertosVencedor,
    detalhes: detalhes
  };
  
  localStorage.setItem("pontos", JSON.stringify(pontosUsuario));
  return totalPontos;
}

function calcularPontosTodosUsuarios() {
  const participantes = JSON.parse(localStorage.getItem("participantes")) || [];
  participantes.forEach(usuario => {
    calcularPontosUsuario(usuario);
  });
}

function obterPontuacaoUsuario(usuario) {
  let pontos = JSON.parse(localStorage.getItem("pontos")) || {};
  return pontos[usuario] || {
    total: 0,
    acertosExatos: 0,
    acertosVencedor: 0,
    detalhes: {}
  };
}

// ============================================
// FUNÇÕES DE RENDERIZAÇÃO
// ============================================

function renderizarTodasAbas() {
  renderizarRodadasPalpites();
  renderizarClassificacao();
  renderizarRodadasResultados();
  renderizarRodadasAdmin();
}

function renderizarRodadasPalpites() {
  const container = document.getElementById("rodadas-palpites");
  const semRodadas = document.getElementById("sem-rodadas");
  const usuario = localStorage.getItem("usuario");
  const rodadas = JSON.parse(localStorage.getItem("rodadas")) || [];
  
  if (rodadas.length === 0) {
    container.innerHTML = "";
    semRodadas.style.display = "block";
    return;
  }
  
  semRodadas.style.display = "none";
  let html = "";
  
  rodadas.forEach((rodada, r) => {
    if (rodada.jogos.length === 0) return;
    
    html += `
      <div class="rodada">
        <h4>${rodada.nome}</h4>
        <p><em>${rodada.jogos.length} jogo(s) - Preencha seus palpites abaixo:</em></p>
    `;
    
    rodada.jogos.forEach((jogo, j) => {
      const meuPalpite = obterMeuPalpite(r, j);
      const resultado = jogo.resultado;
      const pontos = resultado ? calcularPontosJogo(meuPalpite, resultado) : 0;
      const statusIcon = resultado ? "✅" : "⏳";
      
      html += `
        <div class="jogo">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
            <div>
              <span class="status-resultado ${resultado ? 'status-concluido' : 'status-pendente'}">
                ${statusIcon}
              </span>
              <strong>${jogo.casa} x ${jogo.fora}</strong>
            </div>
            ${pontos > 0 ? `<span class="pontos">+${pontos}</span>` : ''}
          </div>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
            <div>
              <label>📝 Seu palpite:</label><br>
              <input type="text" 
                     value="${meuPalpite}"
                     placeholder="0x0"
                     oninput="salvarPalpite(${r}, ${j}, this.value)"
                     style="width: 100%; padding: 8px;">
            </div>
            <div>
              <label>📊 Resultado real:</label><br>
              <input type="text" 
                     value="${resultado || ''}"
                     placeholder="${resultado ? resultado : 'Aguardando...'}"
                     disabled
                     style="width: 100%; padding: 8px; background: #f5f5f5;">
            </div>
          </div>
        </div>
      `;
    });
    
    html += `</div>`;
  });
  
  container.innerHTML = html;
}

function renderizarClassificacao() {
  const container = document.getElementById("tabela-classificacao-container");
  const participantes = JSON.parse(localStorage.getItem("participantes")) || [];
  
  if (participantes.length === 0) {
    container.innerHTML = "<p>Nenhum participante ainda.</p>";
    return;
  }
  
  // Calcular pontos de todos
  calcularPontosTodosUsuarios();
  
  // Obter pontuação de cada participante
  let classificacao = participantes.map(usuario => {
    const pontos = obterPontuacaoUsuario(usuario);
    return {
      usuario: usuario,
      total: pontos.total,
      exatos: pontos.acertosExatos,
      vencedor: pontos.acertosVencedor
    };
  });
  
  // Ordenar por pontos (decrescente)
  classificacao.sort((a, b) => b.total - a.total);
  
  let html = `
    <table class="tabela-classificacao">
      <thead>
        <tr>
          <th style="width: 60px;">Pos</th>
          <th>Participante</th>
          <th style="text-align: center;">Pontos</th>
          <th style="text-align: center;">Exatos</th>
          <th style="text-align: center;">Acertos</th>
        </tr>
      </thead>
      <tbody>
  `;
  
  classificacao.forEach((item, index) => {
    const posicao = index + 1;
    const posicaoClass = posicao <= 3 ? `posicao-${posicao}` : '';
    const medalha = posicao === 1 ? '🥇' : posicao === 2 ? '🥈' : posicao === 3 ? '🥉' : '';
    
    html += `
      <tr>
        <td class="posicao ${posicaoClass}" style="text-align: center;">
          ${posicao} ${medalha}
        </td>
        <td>
          ${item.usuario === ADMIN_USUARIO ? '👑 ' : '👤 '}
          <strong>${item.usuario}</strong>
          ${item.usuario === localStorage.getItem("usuario") ? ' <em>(você)</em>' : ''}
        </td>
        <td style="text-align: center; font-weight: bold; font-size: 18px;">
          ${item.total}
        </td>
        <td style="text-align: center;">
          <span style="color: #4CAF50;">${item.exatos}</span>
        </td>
        <td style="text-align: center;">
          <span style="color: #2196F3;">${item.vencedor}</span>
        </td>
      </tr>
    `;
  });
  
  html += `
      </tbody>
    </table>
    
    <div style="margin-top: 20px; color: #666;">
      <small>🎯 <strong>Sistema de pontuação:</strong> 3 pontos (palpite exato) • 1 ponto (acertou vencedor/empate)</small>
    </div>
  `;
  
  container.innerHTML = html;
}

function renderizarRodadasResultados() {
  const container = document.getElementById("rodadas-resultados");
  const usuario = localStorage.getItem("usuario");
  const rodadas = JSON.parse(localStorage.getItem("rodadas")) || [];
  
  if (usuario.toLowerCase() !== ADMIN_USUARIO) {
    container.innerHTML = "<p>⚠️ Acesso restrito ao administrador.</p>";
    return;
  }
  
  if (rodadas.length === 0) {
    container.innerHTML = "<p>Nenhuma rodada criada ainda.</p>";
    return;
  }
  
  let html = "";
  
  rodadas.forEach((rodada, r) => {
    if (rodada.jogos.length === 0) return;
    
    html += `
      <div class="rodada">
        <h4>${rodada.nome} (${rodada.jogos.length} jogos)</h4>
    `;
    
    rodada.jogos.forEach((jogo, j) => {
      const resultadoAtual = jogo.resultado || "";
      const temPalpites = verificarSeTemPalpites(r, j);
      
      html += `
        <div class="jogo-resultado">
          <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 10px;">
            <div>
              <strong>${jogo.casa} x ${jogo.fora}</strong><br>
              <small>${temPalpites ? '✅ Com palpites' : '⚠️ Sem palpites ainda'}</small>
            </div>
            <div style="text-align: right;">
              <small>Rodada ${r + 1}, Jogo ${j + 1}</small>
            </

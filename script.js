// ============================================
// CONFIGURAÇÕES GLOBAIS
// ============================================
let abaAtual = 'palpites';
const ADMIN_USUARIO = 'pires';

// ============================================
// FUNÇÕES AUXILIARES DE VALIDAÇÃO
// ============================================

function validarNumeroInput(input) {
  // Remove qualquer caractere que não seja número
  let valor = input.value.replace(/[^0-9]/g, '');
  
  // Limita a 2 dígitos
  if (valor.length > 2) {
    valor = valor.substring(0, 2);
  }
  
  // Se vazio, permite 0
  if (valor === '') {
    valor = '0';
  }
  
  // Remove zeros à esquerda, exceto se for "0"
  valor = parseInt(valor, 10).toString();
  
  input.value = valor;
  return valor;
}

function formatarPalpite(casa, fora) {
  return `${casa}x${fora}`;
}

function obterStatusJogo(jogo, usuario, rIndex, jIndex) {
  const resultado = jogo.resultado;
  const palpite = obterPalpiteUsuario(usuario, rIndex, jIndex);
  const palpiteSalvo = palpite !== "";
  
  if (resultado) {
    return 'FINALIZADO';
  } else if (palpiteSalvo && jogo.bloqueado) {
    return 'BLOQUEADO';
  } else if (palpiteSalvo) {
    return 'SALVO';
  } else {
    return 'ABERTO';
  }
}

function podeEditarPalpite(jogo, usuario, rIndex, jIndex) {
  const status = obterStatusJogo(jogo, usuario, rIndex, jIndex);
  return status === 'ABERTO' || status === 'SALVO';
}

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
  
  let participantes = JSON.parse(localStorage.getItem("participantes")) || [];
  if (!participantes.includes(nome)) {
    participantes.push(nome);
    localStorage.setItem("participantes", JSON.stringify(participantes));
  }
  
  localStorage.setItem("usuario", nome);
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
  
  document.getElementById("login").style.display = "none";
  document.getElementById("painel").style.display = "block";
  
  const bemvindo = document.getElementById("bemvindo");
  if (usuario.toLowerCase() === ADMIN_USUARIO) {
    bemvindo.innerHTML = `👑 Bem-vindo, <strong style="color: #e65100;">${usuario}</strong> (Administrador)`;
  } else {
    bemvindo.innerHTML = `👤 Bem-vindo, <strong>${usuario}</strong>`;
  }
  
  configurarAcessoUsuario(usuario);
  renderizarTodasAbas();
}

function configurarAcessoUsuario(usuario) {
  const ehAdm = usuario.toLowerCase() === ADMIN_USUARIO;
  const abaResultados = document.getElementById("abaResultados");
  const abaAdmin = document.getElementById("abaAdmin");
  const btnRecomecar = document.getElementById("btnRecomecar");
  
  if (ehAdm) {
    abaResultados.style.display = "flex";
    abaAdmin.style.display = "flex";
    btnRecomecar.style.display = "inline-block";
  } else {
    abaResultados.style.display = "none";
    abaAdmin.style.display = "none";
    btnRecomecar.style.display = "none";
    
    if (abaAtual === 'resultados' || abaAtual === 'admin') {
      mudarAba('palpites');
    }
  }
}

function mudarAba(nomeAba) {
  const usuario = localStorage.getItem("usuario");
  const ehAdm = usuario && usuario.toLowerCase() === ADMIN_USUARIO;
  
  if ((nomeAba === 'resultados' || nomeAba === 'admin') && !ehAdm) {
    alert("⚠️ Apenas o administrador Pires pode acessar esta área!");
    return;
  }
  
  abaAtual = nomeAba;
  
  document.querySelectorAll('.aba').forEach(aba => {
    aba.classList.remove('ativa');
  });
  
  document.querySelectorAll('.conteudo-aba').forEach(conteudo => {
    conteudo.classList.remove('ativa');
  });
  
  const abaSelecionada = document.querySelector(`.aba[onclick*="${nomeAba}"]`);
  const conteudoSelecionado = document.getElementById(`conteudo-${nomeAba}`);
  
  if (abaSelecionada && conteudoSelecionado) {
    abaSelecionada.classList.add('ativa');
    conteudoSelecionado.classList.add('ativa');
    
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
  
  let rodadas = JSON.parse(localStorage.getItem("rodadas")) || [];
  rodadas.push({
    nome: nome,
    jogos: [],
    ativa: true,
    criadaEm: new Date().toISOString()
  });
  
  localStorage.setItem("rodadas", JSON.stringify(rodadas));
  nomeInput.value = "";
  
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
    resultado: "",
    criadoEm: new Date().toISOString(),
    bloqueado: false,
    resultadoSalvo: false
  });
  
  localStorage.setItem("rodadas", JSON.stringify(rodadas));
  renderizarRodadasAdmin();
  
  document.getElementById(`casa-adm-${indexRodada}`).value = "";
  document.getElementById(`fora-adm-${indexRodada}`).value = "";
  
  alert(`✅ Jogo "${casa} x ${fora}" adicionado!`);
}

// ============================================
// FUNÇÕES DE PALPITES
// ============================================

function salvarPalpite(indexRodada, indexJogo, inputCasaId, inputForaId) {
  const usuario = localStorage.getItem("usuario");
  if (!usuario) return;
  
  const inputCasa = document.getElementById(inputCasaId);
  const inputFora = document.getElementById(inputForaId);
  
  const golsCasa = validarNumeroInput(inputCasa);
  const golsFora = validarNumeroInput(inputFora);
  
  const palpite = formatarPalpite(golsCasa, golsFora);
  
  let palpites = JSON.parse(localStorage.getItem("palpites")) || {};
  
  if (!palpites[usuario]) palpites[usuario] = {};
  if (!palpites[usuario][indexRodada]) palpites[usuario][indexRodada] = {};
  
  palpites[usuario][indexRodada][indexJogo] = palpite;
  localStorage.setItem("palpites", JSON.stringify(palpites));
  
  // Marcar como salvo
  inputCasa.readOnly = true;
  inputFora.readOnly = true;
  
  // Atualizar botão
  const btnSalvar = document.querySelector(`button[onclick*="salvarPalpite(${indexRodada}, ${indexJogo},"]`);
  if (btnSalvar) {
    btnSalvar.textContent = "✅ SALVO";
    btnSalvar.classList.add('salvo');
    btnSalvar.disabled = true;
  }
  
  // Recalcular pontos se já tiver resultado
  let rodadas = JSON.parse(localStorage.getItem("rodadas")) || [];
  if (rodadas[indexRodada]?.jogos[indexJogo]?.resultado) {
    calcularPontosUsuario(usuario);
  }
  
  renderizarRodadasPalpites();
}

function obterPalpiteUsuario(usuario, indexRodada, indexJogo) {
  let palpites = JSON.parse(localStorage.getItem("palpites")) || {};
  return palpites[usuario]?.[indexRodada]?.[indexJogo] || "";
}

function obterMeuPalpite(indexRodada, indexJogo) {
  const usuario = localStorage.getItem("usuario");
  return obterPalpiteUsuario(usuario, indexRodada, indexJogo);
}

function parsePalpite(palpite) {
  if (!palpite || !palpite.includes('x')) return { casa: '0', fora: '0' };
  const [casa, fora] = palpite.split('x');
  return { casa: casa || '0', fora: fora || '0' };
}

// ============================================
// FUNÇÕES DE RESULTADOS (SÓ PIRES)
// ============================================

function salvarResultado(indexRodada, indexJogo, inputCasaId, inputForaId) {
  const usuario = localStorage.getItem("usuario");
  if (usuario.toLowerCase() !== ADMIN_USUARIO) return;
  
  const inputCasa = document.getElementById(inputCasaId);
  const inputFora = document.getElementById(inputForaId);
  
  const golsCasa = validarNumeroInput(inputCasa);
  const golsFora = validarNumeroInput(inputFora);
  
  const resultado = formatarPalpite(golsCasa, golsFora);
  
  let rodadas = JSON.parse(localStorage.getItem("rodadas")) || [];
  rodadas[indexRodada].jogos[indexJogo].resultado = resultado;
  rodadas[indexRodada].jogos[indexJogo].resultadoSalvo = true;
  rodadas[indexRodada].jogos[indexJogo].bloqueado = true;
  
  localStorage.setItem("rodadas", JSON.stringify(rodadas));
  
  // Bloquear inputs do resultado
  inputCasa.readOnly = true;
  inputFora.readOnly = true;
  
  // Atualizar botão
  const btnSalvar = document.querySelector(`button[onclick*="salvarResultado(${indexRodada}, ${indexJogo},"]`);
  if (btnSalvar) {
    btnSalvar.textContent = "✅ RESULTADO SALVO";
    btnSalvar.classList.add('salvo');
    btnSalvar.disabled = true;
  }
  
  // Recalcular pontos para todos
  calcularPontosTodosUsuarios();
  
  // Atualizar todas as abas
  renderizarTodasAbas();
  
  alert(`✅ Resultado salvo! Palpites deste jogo foram bloqueados.`);
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
        <p><em>${rodada.jogos.length} jogo(s) - Preencha e salve seus palpites:</em></p>
    `;
    
    rodada.jogos.forEach((jogo, j) => {
      const meuPalpite = obterMeuPalpite(r, j);
      const palpiteParseado = parsePalpite(meuPalpite);
      const resultado = jogo.resultado;
      const resultadoParseado = parsePalpite(resultado);
      const pontos = resultado ? calcularPontosJogo(meuPalpite, resultado) : 0;
      const status = obterStatusJogo(jogo, usuario, r, j);
      
      // IDs únicos para os inputs
      const inputCasaId = `palpite-casa-${r}-${j}`;
      const inputForaId = `palpite-fora-${r}-${j}`;
      
      // Determinar se pode editar
      const podeEditar = status === 'ABERTO';
      const estaSalvo = status === 'SALVO' || status === 'FINALIZADO' || status === 'BLOQUEADO';
      const estaBloqueado = status === 'FINALIZADO' || status === 'BLOQUEADO';
      
      // Texto do botão
      let textoBotao = "SALVAR";
      let classeBotao = "";
      if (estaSalvo) textoBotao = "✅ SALVO";
      if (estaBloqueado) {
        textoBotao = "🔒 BLOQUEADO";
        classeBotao = "bloqueado";
      }
      
      html += `
        <div class="jogo">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
            <div>
              <strong>${jogo.casa} x ${jogo.fora}</strong>
              <span class="status-palpite status-${status.toLowerCase()}">
                ${status === 'ABERTO' ? '🟢 ABERTO' : 
                  status === 'SALVO' ? '🟡 SALVO' : 
                  status === 'BLOQUEADO' ? '🔴 BLOQUEADO' : 
                  '🔵 FINALIZADO'}
              </span>
            </div>
            ${pontos > 0 ? `<span class="pontos-badge">+${pontos} pontos</span>` : ''}
          </div>
          
          <div>
            <label>📝 Seu palpite:</label>
            <div class="input-palpite-container">
              <input type="text" 
                     id="${inputCasaId}"
                     class="input-palpite"
                     value="${palpiteParseado.casa}"
                     placeholder="0"
                     ${!podeEditar ? 'readonly' : ''}
                     oninput="validarNumeroInput(this)"
                     maxlength="2">
              <span class="separador">x</span>
              <input type="text" 
                     id="${inputForaId}"
                     class="input-palpite"
                     value="${palpiteParseado.fora}"
                     placeholder="0"
                     ${!podeEditar ? 'readonly' : ''}
                     oninput="validarNumeroInput(this)"
                     maxlength="2">
              
              <button class="btn-salvar-palpite ${classeBotao}"
                      onclick="salvarPalpite(${r}, ${j}, '${inputCasaId}', '${inputForaId}')"
                      ${estaSalvo || estaBloqueado ? 'disabled' : ''}>
                ${textoBotao}
              </button>
            </div>
            
            <div style="margin-top: 15px; padding: 10px; background: #f8f9fa; border-radius: 5px;">
              <label>📊 Resultado real:</label>
              <div class="input-palpite-container">
                <input type="text" 
                       class="input-palpite"
                       value="${resultadoParseado.casa}"
                       placeholder="0"
                       readonly
                       style="background: #e9ecef;">
                <span class="separador">x</span>
                <input type="text" 
                       class="input-palpite"
                       value="${resultadoParseado.fora}"
                       placeholder="0"
                       readonly
                       style="background: #e9ecef;">
                <span style="margin-left: 10px; color: ${resultado ? '#4CAF50' : '#999'}">
                  ${resultado ? '✅ Resultado registrado' : '⏳ Aguardando resultado'}
                </span>
              </div>
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
  
  calcularPontosTodosUsuarios();
  
  let classificacao = participantes.map(usuario => {
    const pontos = obterPontuacaoUsuario(usuario);
    return {
      usuario: usuario,
      total: pontos.total,
      exatos: pontos.acertosExatos,
      vencedor: pontos.acertosVencedor
    };
  });
  
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
          ${item.usuario.toLowerCase() === ADMIN_USUARIO ? '👑 ' : '👤 '}
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
        <p><em>Preencha os resultados reais. Após salvar, os palpites serão bloqueados.</em></p>
    `;
    
    rodada.jogos.forEach((jogo, j) => {
      const resultadoParseado = parsePalpite(jogo.resultado);
      const temPalpites = verificarSeTemPalpites(r, j);
      
      // IDs únicos para os inputs de resultado
      const inputCasaId = `resultado-casa-${r}-${j}`;
      const inputForaId = `resultado-fora-${r}-${j}`;
      
      const resultadoSalvo = jogo.resultadoSalvo;
      
      html += `
        <div class="jogo-resultado">
          <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 15px;">
            <div>
              <strong>${jogo.casa} x ${jogo.fora}</strong><br>
              <small>${temPalpites ? '✅ Com palpites registrados' : '⚠️ Ainda sem palpites'}</small>
            </div>
            <div style="text-align: right;">
              <small>Rodada ${r + 1}, Jogo ${j + 1}</small>
            </div>
          </div>
          
          <div>
            <label>🏁 Resultado real:</label>
            <div class="input-palpite-container">
              <input type="text" 
                     id="${inputCasaId}"
                     class="input-palpite"
                     value="${resultadoParseado.casa}"
                     placeholder="0"
                     ${resultadoSalvo ? 'readonly' : ''}
                     oninput="validarNumeroInput(this)"
                     maxlength="2"
                     style="${resultadoSalvo ? 'background: #e9ecef;' : 'background: #fff3cd;'}">
              <span class="separador">x</span>
              <input type="text" 
                     id="${inputForaId}"
                     class="input-palpite"
                     value="${resultadoParseado.fora}"
                     placeholder="0"
                     ${resultadoSalvo ? 'readonly' : ''}
                     oninput="validarNumeroInput(this)"
                     maxlength="2"
                     style="${resultadoSalvo ? 'background: #e9ecef;' : 'background: #fff3cd;'}">
              
              <button class="btn-salvar-palpite"
                      onclick="salvarResultado(${r}, ${j}, '${inputCasaId}', '${inputForaId}')"
                      ${resultadoSalvo ? 'disabled' : ''}
                      style="${resultadoSalvo ? 'background: #4CAF50;' : ''}">
                ${resultadoSalvo ? '✅ RESULTADO SALVO' : 'SALVAR RESULTADO'}
              </button>
            </div>
            
            <div style="margin-top: 10px; font-size: 13px; color: #666;">
              ${resultadoSalvo ? 
                '🔒 <strong>Resultado salvo!</strong> Palpites deste jogo estão bloqueados.' : 
                '⚠️ <strong>Atenção:</strong> Após salvar, ninguém poderá mais editar palpites.'}
            </div>
          </div>
        </div>
      `;
    });
    
    html += `</div>`;
  });
  
  container.innerHTML = html || "<p>Nenhum jogo cadastrado ainda.</p>";
}

function renderizarRodadasAdmin() {
  const container = document.getElementById("rodadas-admin");
  const usuario = localStorage.getItem("usuario");
  const rodadas = JSON.parse(localStorage.getItem("rodadas")) || [];
  
  if (usuario.toLowerCase() !== ADMIN_USUARIO) {
    container.innerHTML = "<p>⚠️ Acesso restrito ao administrador.</p>";
    return;
  }
  
  if (rodadas.length === 0) {
    container.innerHTML = `
      <div class="info-box">
        <p>Nenhuma rodada criada ainda.</p>
        <p>Use o formulário acima para criar a primeira rodada.</p>
      </div>
    `;
    return;
  }
  
  let html = "<h4>📋 Rodadas Criadas</h4>";
  
  rodadas.forEach((rodada, r) => {
    html += `
      <div class="rodada">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
          <h5 style="margin: 0;">${rodada.nome}</h5>
          <small style="color: #666;">Criada em: ${new Date(rodada.criadaEm).toLocaleDateString()}</small>
        </div>
        
        <div style="background: white; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
          <h6 style="margin-top: 0; color: #666;">➕ Adicionar Jogo a esta Rodada</h6>
          <div style="display: grid; grid-template-columns: 1fr 1fr auto; gap: 10px; align-items: end;">
            <div>
              <input type="text" 
                     id="casa-adm-${r}"
                     placeholder="Time da casa"
                     style="width: 100%;">
            </div>
            <div>
              <input type="text" 
                     id="fora-adm-${r}"
                     placeholder="Time visitante"
                     style="width: 100%;">
            </div>
            <div>
              <button onclick="adicionarJogo(${r})">Adicionar Jogo</button>
            </div>
          </div>
        </div>
    `;
    
    if (rodada.jogos.length > 0) {
      html += `<h6 style="color: #666; margin-bottom: 10px;">🎯 Jogos desta rodada (${rodada.jogos.length}):</h6>`;
      
      rodada.jogos.forEach((jogo, j) => {
        const resultado = jogo.resultado || 'Pendente';
        const temPalpites = verificarSeTemPalpites(r, j);
        const bloqueado = jogo.bloqueado;
        
        html += `
          <div class="jogo-adm" style="margin-bottom: 10px; padding: 12px;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <div>
                <strong>${jogo.casa} x ${jogo.fora}</strong><br>
                <small>
                  ${bloqueado ? '🔒 ' : '🟢 '}
                  Resultado: ${resultado} | 
                  ${temPalpites ? '📝 Com palpites' : '📭 Sem palpites'} |
                  ${bloqueado ? 'Bloqueado' : 'Aberto'}
                </small>
              </div>
            </div>
          </div>
        `;
      });
    } else {
      html += `<p style="color: #999; font-style: italic;">Nenhum jogo adicionado ainda.</p>`;
    }
    
    html += `</div>`;
  });
  
  container.innerHTML = html;
}

// ============================================
// FUNÇÕES AUXILIARES
// ============================================

function verificarSeTemPalpites(indexRodada, indexJogo) {
  const palpites = JSON.parse(localStorage.getItem("palpites")) || {};
  let temPalpites = false;
  
  Object.keys(palpites).forEach(usuario => {
    if (palpites[usuario][indexRodada] && palpites[usuario][indexRodada][indexJogo]) {
      temPalpites = true;
    }
  });
  
  return temPalpites;
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
  
  const participantes = JSON.parse(localStorage.getItem("participantes")) || [];
  const usuarioAtual = localStorage.getItem("usuario");
  
  localStorage.clear();
  
  localStorage.setItem("participantes", JSON.stringify(participantes));
  localStorage.setItem("usuario", usuarioAtual);
  
  alert("✅ Bolão zerado! Você pode começar um novo campeonato.");
  location.reload();
}

// ============================================
// INICIALIZAÇÃO
// ============================================

window.onload = function() {
  const usuario = localStorage.getItem("usuario");
  if (usuario) {
    mostrarPainel();
  }
  
  if (!localStorage.getItem("participantes")) {
    localStorage.setItem("participantes", JSON.stringify([]));
  }
  if (!localStorage.getItem("rodadas")) {
    localStorage.setItem("rodadas", JSON.stringify([]));
  }
  if (!localStorage.getItem("palpites")) {
    localStorage.setItem("palpites", JSON.stringify({}));
  }
  if (!localStorage.getItem("pontos")) {
    localStorage.setItem("pontos", JSON.stringify({}));
  }
};

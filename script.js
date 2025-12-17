function entrar() {
  const nome = document.getElementById("nome").value.trim();
  if (!nome) {
    alert("Digite seu nome");
    return;
  }

  let participantes = JSON.parse(localStorage.getItem("participantes")) || [];
  if (!participantes.includes(nome)) {
    participantes.push(nome);
    localStorage.setItem("participantes", JSON.stringify(participantes));
  }

  localStorage.setItem("usuario", nome);
  mostrarPainel();
}

function sair() {
  localStorage.removeItem("usuario");
  location.reload();
}

function mostrarPainel() {
  const usuario = localStorage.getItem("usuario");
  if (!usuario) return;

  document.getElementById("login").style.display = "none";
  document.getElementById("painel").style.display = "block";
  document.getElementById("bemvindo").innerText = "Bem-vindo, " + usuario;

  // MOSTRAR OU ESCONDER BOTÃO RECOMEÇAR (SÓ PARA PIRES)
  const btnRecomecar = document.getElementById("btnRecomecar");
  if (usuario.toLowerCase() === "pires") {
    btnRecomecar.style.display = "inline-block";
  } else {
    btnRecomecar.style.display = "none";
  }

  renderParticipantes();
  renderRodadas();
}

function recomecarTudo() {
  const usuario = localStorage.getItem("usuario");
  
  // VERIFICA SE É O PIRES (ADM)
  if (usuario.toLowerCase() !== "pires") {
    alert("⚠️ Apenas o administrador Pires pode recomeçar tudo!");
    return;
  }
  
  // CONFIRMAÇÃO 1
  const confirm1 = confirm("⚠️ ATENÇÃO PIRES! ⚠️\n\nVocê está prestes a APAGAR TODOS os dados:\n\n• Todas as rodadas\n• Todos os jogos\n• Todos os palpites\n• Todos os pontos\n\nApenas os nomes dos participantes serão mantidos.\n\nContinuar?");
  
  if (!confirm1) return;
  
  // CONFIRMAÇÃO 2 (EXTRA SEGURANÇA)
  const confirm2 = confirm("🚨 CONFIRMAÇÃO FINAL 🚨\n\nDigite 'SIM' no próximo prompt para confirmar:");
  
  if (!confirm2) return;
  
  const confirm3 = prompt("Digite SIM (em maiúsculas) para confirmar a exclusão:");
  
  if (confirm3 !== "SIM") {
    alert("❌ Operação cancelada.");
    return;
  }
  
  // LIMPEZA SELETIVA DO LOCALSTORAGE
  // Mantém apenas 'participantes' e 'usuario' atual
  const participantes = JSON.parse(localStorage.getItem("participantes")) || [];
  const usuarioAtual = localStorage.getItem("usuario");
  
  // Limpa tudo
  localStorage.clear();
  
  // Restaura apenas o necessário
  localStorage.setItem("participantes", JSON.stringify(participantes));
  if (usuarioAtual) {
    localStorage.setItem("usuario", usuarioAtual);
  }
  
  alert("✅ Tudo foi recomeçado!\n\nAs rodadas, jogos, palpites e pontos foram removidos.\nOs participantes cadastrados foram mantidos.");
  
  // Recarrega a página
  location.reload();
}

function renderParticipantes() {
  const lista = document.getElementById("listaParticipantes");
  lista.innerHTML = "";

  const participantes = JSON.parse(localStorage.getItem("participantes")) || [];
  participantes.forEach(nome => {
    const li = document.createElement("li");
    li.innerText = nome;
    lista.appendChild(li);
  });
}

function criarRodada() {
  const nome = document.getElementById("nomeRodada").value.trim();
  if (!nome) return;

  let rodadas = JSON.parse(localStorage.getItem("rodadas")) || [];
  rodadas.push({ nome, jogos: [] });
  localStorage.setItem("rodadas", JSON.stringify(rodadas));

  document.getElementById("nomeRodada").value = "";
  renderRodadas();
}

function adicionarJogo(index) {
  const casa = document.getElementById(`casa-${index}`).value.trim();
  const fora = document.getElementById(`fora-${index}`).value.trim();
  if (!casa || !fora) return;

  let rodadas = JSON.parse(localStorage.getItem("rodadas")) || [];
  rodadas[index].jogos.push({ casa, fora, resultado: "" });
  localStorage.setItem("rodadas", JSON.stringify(rodadas));

  renderRodadas();
}

function salvarResultado(r, j, valor) {
  let rodadas = JSON.parse(localStorage.getItem("rodadas")) || [];
  rodadas[r].jogos[j].resultado = valor;
  localStorage.setItem("rodadas", JSON.stringify(rodadas));
  
  calcularTodosOsPontos();
  renderRodadas();
}

function salvarPalpite(r, j, valor) {
  const usuario = localStorage.getItem("usuario");
  let palpites = JSON.parse(localStorage.getItem("palpites")) || {};

  if (!palpites[usuario]) palpites[usuario] = {};
  if (!palpites[usuario][r]) palpites[usuario][r] = {};

  palpites[usuario][r][j] = valor;
  localStorage.setItem("palpites", JSON.stringify(palpites));
  
  calcularPontosUsuario(usuario);
  renderRodadas();
}

function obterPalpite(r, j) {
  const usuario = localStorage.getItem("usuario");
  let palpites = JSON.parse(localStorage.getItem("palpites")) || {};
  return palpites[usuario]?.[r]?.[j] || "";
}

function calcularPontos(usuario) {
  let rodadas = JSON.parse(localStorage.getItem("rodadas")) || [];
  let palpites = JSON.parse(localStorage.getItem("palpites")) || {};
  let pontos = JSON.parse(localStorage.getItem("pontos")) || {};
  
  let totalPontos = 0;
  let detalhes = {};
  
  rodadas.forEach((rodada, r) => {
    rodada.jogos.forEach((jogo, j) => {
      const palpite = palpites[usuario]?.[r]?.[j];
      const resultado = jogo.resultado;
      
      if (palpite && resultado) {
        const pontosJogo = calcularPontosJogo(palpite, resultado);
        totalPontos += pontosJogo;
        
        if (!detalhes[r]) detalhes[r] = {};
        detalhes[r][j] = pontosJogo;
      }
    });
  });
  
  pontos[usuario] = { total: totalPontos, detalhes: detalhes };
  localStorage.setItem("pontos", JSON.stringify(pontos));
  
  return totalPontos;
}

function calcularPontosJogo(palpite, resultado) {
  const [palpiteCasa, palpiteFora] = palpite.split('x').map(Number);
  const [resultadoCasa, resultadoFora] = resultado.split('x').map(Number);
  
  if (isNaN(palpiteCasa) || isNaN(palpiteFora) || 
      isNaN(resultadoCasa) || isNaN(resultadoFora)) {
    return 0;
  }
  
  if (palpiteCasa === resultadoCasa && palpiteFora === resultadoFora) {
    return 3;
  }
  
  const palpiteVencedor = 
    palpiteCasa > palpiteFora ? 'casa' :
    palpiteCasa < palpiteFora ? 'fora' : 'empate';
  
  const resultadoVencedor = 
    resultadoCasa > resultadoFora ? 'casa' :
    resultadoCasa < resultadoFora ? 'fora' : 'empate';
  
  if (palpiteVencedor === resultadoVencedor) {
    return 1;
  }
  
  return 0;
}

function calcularPontosUsuario(usuario) {
  return calcularPontos(usuario);
}

function calcularTodosOsPontos() {
  const participantes = JSON.parse(localStorage.getItem("participantes")) || [];
  participantes.forEach(usuario => {
    calcularPontos(usuario);
  });
}

function obterPontosUsuario(usuario, r, j) {
  let pontos = JSON.parse(localStorage.getItem("pontos")) || {};
  return pontos[usuario]?.detalhes?.[r]?.[j] || 0;
}

function renderRodadas() {
  const container = document.getElementById("rodadas");
  container.innerHTML = "";
  
  const usuario = localStorage.getItem("usuario");
  const rodadas = JSON.parse(localStorage.getItem("rodadas")) || [];
  const pontosUsuario = JSON.parse(localStorage.getItem("pontos")) || {};
  const totalUsuario = pontosUsuario[usuario]?.total || 0;

  if (usuario) {
    container.innerHTML += `<h3>🏆 Sua pontuação total: ${totalUsuario} pontos</h3>`;
  }

  rodadas.forEach((rodada, r) => {
    const div = document.createElement("div");
    div.className = "rodada";
    
    let html = `<strong>${rodada.nome}</strong><br><br>
      <input id="casa-${r}" placeholder="Time da casa">
      <input id="fora-${r}" placeholder="Time visitante">
      <button onclick="adicionarJogo(${r})">Adicionar jogo</button><br><br>`;
    
    rodada.jogos.forEach((jogo, j) => {
      const resultadoAtual = jogo.resultado || "";
      const pontosJogo = obterPontosUsuario(usuario, r, j);
      
      html += `
        <div class="jogo">
          ⚽ ${jogo.casa} x ${jogo.fora}
          <br>
          🔵 Resultado real: 
          <input size="4" value="${resultadoAtual}" 
            placeholder="0x0"
            oninput="salvarResultado(${r}, ${j}, this.value)">
          <br>
          📝 Seu palpite: 
          <input size="4" value="${obterPalpite(r, j)}" 
            placeholder="0x0"
            oninput="salvarPalpite(${r}, ${j}, this.value)">
          ${pontosJogo > 0 ? `<span class="pontos">+${pontosJogo} pontos</span>` : ''}
        </div>`;
    });
    
    div.innerHTML = html;
    container.appendChild(div);
  });
}

mostrarPainel();

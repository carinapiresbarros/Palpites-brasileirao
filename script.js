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

  renderParticipantes();
  renderRodadas();
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
  rodadas[index].jogos.push({ casa, fora });
  localStorage.setItem("rodadas", JSON.stringify(rodadas));

  renderRodadas();
}

function renderRodadas() {
  const container = document.getElementById("rodadas");
  container.innerHTML = "";

  const rodadas = JSON.parse(localStorage.getItem("rodadas")) || [];

  rodadas.forEach((rodada, i) => {
    const div = document.createElement("div");
    div.className = "rodada";

    div.innerHTML = `
      <strong>${rodada.nome}</strong><br><br>

      <input id="casa-${i}" placeholder="Time da casa">
      <input id="fora-${i}" placeholder="Time visitante">
      <button onclick="adicionarJogo(${i})">Adicionar jogo</button>

      <div>
        ${rodada.jogos.map(j =>
          `<div class="jogo">⚽ ${j.casa} x ${j.fora}</div>`
        ).join("")}
      </div>
    `;

    container.appendChild(div);
  });
}

mostrarPainel();

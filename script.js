function entrar() {
  const nome = document.getElementById("nome").value.trim();
  if (nome === "") {
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

  const lista = document.getElementById("listaParticipantes");
  lista.innerHTML = "";

  const participantes = JSON.parse(localStorage.getItem("participantes")) || [];
  participantes.forEach(nome => {
    const li = document.createElement("li");
    li.innerText = nome;
    lista.appendChild(li);
  });
}

mostrarPainel();

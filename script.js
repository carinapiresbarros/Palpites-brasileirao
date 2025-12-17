function entrar() {
  const nome = document.getElementById("nome").value.trim();

  if (nome === "") {
    alert("Digite seu nome");
    return;
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

  if (usuario) {
    document.getElementById("login").style.display = "none";
    document.getElementById("painel").style.display = "block";
    document.getElementById("bemvindo").innerText =
      "Bem-vindo, " + usuario + "!";
  }
}

mostrarPainel();
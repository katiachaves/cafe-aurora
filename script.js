const nav = document.querySelector("#nav")
const links = document.querySelector(".links")
const bNav = document.querySelector(".bNav")
const anterior = document.querySelector("button.anterior")
const proximo = document.querySelector("button.proximo")
const carrosel = document.querySelector(".carrosel")
const itens = document.querySelectorAll(".item")
const main = document.querySelector("main")
const html = document.querySelector("html")


//CARDÁPIO


let posicao = 0;

function calcularDistancia() {
  const item = carrosel.querySelector(".item");
  const estiloItem = getComputedStyle(item);
  const estiloCarrosel = getComputedStyle(carrosel);

  const margemEsquerda = parseFloat(estiloItem.marginLeft) || 0;
  const gap = parseFloat(estiloCarrosel.columnGap) || 0;

  return item.getBoundingClientRect().width + margemEsquerda + gap;
}


function calcularMaximo() {
  const area = carrosel.parentElement;

  if (window.matchMedia("(min-width: 768px)").matches) {
    const ultimoItem = carrosel.lastElementChild;

    return Math.max(
      0,
      ultimoItem.offsetLeft
        + ultimoItem.offsetWidth
        - carrosel.clientWidth
        + 21
    );
  }

  const ultimoItem = carrosel.lastElementChild;
  const larguraArea = area.clientWidth;
  const larguraItem = ultimoItem.getBoundingClientRect().width;

  return Math.max(
    0,
    ultimoItem.offsetLeft -
      (larguraArea - larguraItem) / 2
  );
}

proximo.addEventListener("click", () => {
  const distancia = calcularDistancia();
  const maximo = calcularMaximo();

  posicao = Math.min(posicao + distancia, maximo);
  carrosel.style.transform = `translateX(-${posicao}px)`;
});

anterior.addEventListener("click", () => {
  const distancia = calcularDistancia();

  posicao = Math.max(0, posicao - distancia);
  carrosel.style.transform = `translateX(-${posicao}px)`;
});



window.addEventListener("resize", () => {
  posicao = 0;
  carrosel.style.transform = "translateX(0)";
});




//NAVBAR

bNav.addEventListener("click", () => {
  if (links.classList.contains("linksAparece")) {
    links.classList.remove("linksAparece")
    links.classList.add("linksSome")
    nav.style.gridTemplateRows = "45px"
    nav.style.gridArea = "1/1/2/5"
    main.style.paddingTop = "45px"
    html.style.scrollPaddingTop = "45px"
      
  } else {
    links.classList.remove("linksSome")
    links.classList.add("linksAparece")
    nav.style.gridTemplateRows = "45px 150px"
    nav.style.gridArea = "1/1/3/5"
    main.style.paddingTop = "195px"
    html.style.scrollPaddingTop = "195px"
  }
})

console.log("Carrossel:", carrosel.offsetWidth)
console.log("Item:", itens[0].offsetWidth)
console.log("Margem:", getComputedStyle(itens[0]).marginLeft)


//CONTATO

async function mostrarMensagemContato() {
  const aviso = document.querySelector(".avisoContato");

  if (!aviso) return;

  try {
    const resposta = await fetch('/mensagens');

    if (!resposta.ok) {
      throw new Error('Não foi possível consultar as mensagens.');
    };

    const dados = await resposta.json();

    const mensagens = [
      ...dados.sucesso, 
      ...dados.erro
    ];

    if (mensagens.length > 0) {
      aviso.textContent = mensagens.join(" ");
      aviso.hidden = false;

      aviso.classList.toggle("sucesso", dados.sucesso.length > 0);
      aviso.classList.toggle("erro", dados.erro.length > 0);
    }
  } catch (erro) {
    console.error('Erro ao exibir aviso:', erro);
  }
}

mostrarMensagemContato();

const formularioContato = document.querySelector("form[action='/contato']");

if (formularioContato) {
  
  formularioContato.addEventListener("submit", () => {
    const botaoEnviar = formularioContato.querySelector(".btnEnviar");

    if (botaoEnviar) {
      botaoEnviar.disabled = true;
      botaoEnviar.textContent = "Enviando..."
    }
  });
}
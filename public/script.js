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


let larguraAnterior = window.innerWidth;

window.addEventListener("resize", () => {
  if (window.innerWidth !== larguraAnterior) {
    larguraAnterior = window.innerWidth;

    posicao = 0;
    carrosel.style.transform = "translateX(0)";
  }
});


console.log("Carrossel:", carrosel.offsetWidth)
console.log("Item:", itens[0].offsetWidth)
console.log("Margem:", getComputedStyle(itens[0]).marginLeft)


let animando = false;

bNav.addEventListener("click", () => {
  if (animando) return;
  
  if (
    getComputedStyle(nav).height == "45px" ||
    nav.style.height == "45px"
  ) {

    html.style.scrollPaddingTop = "195px";
    html.style.transition = "scroll-padding-top 0.6s";
    main.style.paddingTop = "195px";
    main.style.transition = "padding-top 0.6s";
    
    // ABRIR: manter o comportamento original
    nav.style.gridTemplateRows = "45px 150px";
    nav.style.gridArea = "1/1/3/5";
    nav.style.height = "195px";
    nav.style.transition = "height 0.6s";

    links.style.transform = "translateY(0%)";

  } else if (nav.style.height == "195px") {

    animando = true;

    html.style.scrollPaddingTop = "45px";
    html.style.transition = "scroll-padding-top 0.6s";
    main.style.paddingTop = "45px";
    main.style.transition = "padding-top 0.6s";
    
    // FECHAR: esconder os links gradualmente
    links.querySelectorAll("a").forEach((link, i, todos) => {
      const atraso = (todos.length - 1 - i) * 0.1;

      link.style.transition = `opacity 0.1s ${atraso}s, transform 0.1s ${atraso}s`;

      link.style.opacity = "0";
      link.style.transform = "translateY(20px)";
    });
    
    nav.style.transition = "height 0.6s";
    nav.style.height = "45px";

    // Esperar a navbar terminar de diminuir
    setTimeout(() => {
      nav.style.gridTemplateRows = "45px";
      nav.style.gridArea = "1/1/2/5";
      links.style.transform = "translateY(100%)";

      links.querySelectorAll("a").forEach((link) => {
        link.style.transition = "";
        link.style.opacity = "";
        link.style.transform = "";
      });

      animando = false;
    }, 1400);
  }
});




//NAVBAR

/*bNav.addEventListener("click", () => {
  if (getComputedStyle(nav).height == "45px" || nav.style.height == "45px") {

    nav.style.gridTemplateRows = "45px 150px";
    nav.style.gridArea = "1/1/3/5";
    
    nav.style.height = "195px";
    links.style.transform = "translateY(0%)";
    nav.style.transition = "height 0.8s";
  } 
  else if (nav.style.height == "195px") {

    nav.style.gridTemplateRows = "45px";
    nav.style.gridArea = "1/1/2/5";
    
    nav.style.height = "45px";
    links.style.transform = "translateY(100%)";
    nav.style.transition = "height 0.8s";
  }
})
*/

const linksNavegacao = document.querySelectorAll(
  'a[href^="#"]'
);

linksNavegacao.forEach(link => {
  link.addEventListener("click", evento => {
    const id = link.getAttribute("href");
    const destino = document.querySelector(id);

    if (!destino) return;

    evento.preventDefault();

    destino.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });

    history.replaceState(null, "", "/");
  });
});


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
  
  const botaoEnviar = formularioContato.querySelector(".btnEnviar");

    if (botaoEnviar) {
      const textoOriginal = botaoEnviar.textContent;

      formularioContato.addEventListener("submit", () => {
        botaoEnviar.disabled = true;
        botaoEnviar.textContent = "Enviando..."
      });

      window.addEventListener("pageshow", () => {
        botaoEnviar.disabled = false;
        botaoEnviar.textContent = textoOriginal;
      });
    }
  }
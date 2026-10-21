require('dotenv').config();
const mongoose = require('mongoose');
const express = require('express');
const app = express();
const Contato = require('./models/Contato');
const session = require('express-session');
const flash = require('connect-flash');
const nodemailer = require('nodemailer');
const rateLimit = require('express-rate-limit');
const path = require('path');
const { MongoStore } = require('connect-mongo');


//CONFIG
const limiteContato = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5, 
  standardHeaders: 'draft-8',
  legacyHeaders: false, 

  handler: (req, res) => {
    return res.redirect(303, '/erro.html?tipo=limite');
  }
});


async function iniciarServidor() {
  const variaveisObrigatorias = [
    'MONGODB_URI',
    'SESSION_SECRET',
    'EMAIL_USER',
    'EMAIL_PASS'
  ];

  const faltando = variaveisObrigatorias.filter(
    nome => !process.env[nome]
  );

  if (faltando.length > 0) {
    console.error(
      'Variáveis de ambiente ausentes:',
      faltando.join(', ')
    );

    process.exit(1);
  }
  
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    console.log('Conectado ao MongoDB');

    const PORT = process.env.PORT || 3000;
    
    app.listen(PORT, () => {
      console.log(`servidor rodando na porta ${PORT}`);
    });
  } catch (erro) {
    console.error('Não foi possível iniciar o servidor.');
    console.error('Erro:', erro.message);
    process.exit(1);
  }
}


app.use(express.json({
  limit: '10kb'
}));

app.use(express.urlencoded({
  extended: true,
  limit: '10kb', 
  parameterLimit: 10
}));

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI, 
    collectionName: 'sessoes', 
    ttl: 60 * 60
  }), 
  cookie: {
    httpOnly: true, 
    secure: process.env.NODE_ENV === 'production', 
    sameSite: 'lax', 
    maxAge: 1000 * 60 * 60
  }
}));

app.use(flash());

app.use(express.static(path.join(__dirname,'public')));

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

transporter.verify().then(() => {
  console.log('Conexão com o Gmail configurada!');
}).catch((erro) => {
  console.error('Erro ao conectar ao Gmail:', erro.message);
});


//ROTAS
app.post('/contato', limiteContato, async (req, res) => {
  
  const { nome, email, men } = req.body;
  
  let erros = [];
  
  if (typeof nome !== 'string' || !nome.trim()) {
    erros.push({texto: 'Nome Inválido'});
  };
  
  if (typeof email !== 'string' || !email.trim()) {
    erros.push({texto: 'E-mail Inválido'});
  };
  
  if (typeof men !== 'string' || !men.trim()) {
    erros.push({texto: 'Mensagem Inválida'});
  };

  
  if (typeof nome === 'string' && nome.trim()) {
    if (nome.trim().length < 2 || nome.trim().length > 100) {
      erros.push({ texto: 'O nome deve ter entre 2 e 100 caracteres.' });
    };
  };

  if (typeof email === 'string' && email.trim()) {
    if (
      email.trim().length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
    ) {
      erros.push({ texto: 'E-mail inválido.' });
    };
  };

  if (typeof men === 'string' && men.trim()) {
    if (men.trim().length < 5 || men.trim().length > 3000) {
      erros.push({ texto: 'A mensagem deve ter entre 5 e 3000 caracteres.' });
    };
  };

  if (typeof req.body.site === 'string' && req.body.site.trim() !== '') {
    return res.redirect(303, '/erro.html?tipo=formulario');
  };
  
  if (erros.length > 0) {
    req.flash('erro', erros.map(erro => erro.texto).join(' '));
    return res.redirect('/');
  };
  
  // 1. Salvar a mensagem no MongoDB
  
  const novaMensagem = new Contato({
    nome: nome.trim(),
    email: email.trim(),
    men: men.trim()
  });

  try {  
    await novaMensagem.save();
  } catch (erro) {
    console.error('Erro ao salvar no MongoDB:', erro);

    req.flash('erro', 'Não foi possível salvar sua mensagem. Tente novamente.');
    
    return res.redirect('/')
  };

  // 2. Enviar o e-mail pelo Gmail

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER,
      replyTo: email.trim(),
      subject: 'Nova mensagem - Café Aurora',
      text: `Nome: ${nome.trim()}\nE-mail: ${email.trim()}\n\nMensagem:\n${men.trim()}`
    });
  } catch (erro) {
    console.error('Erro ao enviar o e-mail:', erro);
    
    req.flash('erro', 'Sua mensagem foi salva mas não foi possível enviar o e-mail. Tente novamente mais tarde.');

    return res.redirect('/')
  }

    // 3. As duas operações deram certo
  
    req.flash('sucesso', 'Mensagem enviada com sucesso!');
    return res.redirect('/');
});


app.get('/mensagens', (req, res) => {
  const sucesso = req.flash('sucesso');
  const erro = req.flash('erro');
  res.json({
    sucesso, 
    erro
  });
});


app.use((erro, req, res, next) => {
  if (res.headersSent) {
    return next(erro);
  }

  console.error('Erro no servidor:', erro);
  
  if (erro.status === 413 || erro.type === 'entity.too.large') {
    return res.redirect(303, '/erro.html?tipo=tamanho');
  }

  return res.redirect(303,'/erro.html?tipo=servidor');
});

iniciarServidor()
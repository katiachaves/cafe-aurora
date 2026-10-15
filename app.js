require('dotenv').config();
const mongoose = require('mongoose');
const express = require('express');
const app = express();
const Contato = require('./models/Contato');
const session = require('express-session');
const flash = require('connect-flash');
const nodemailer = require('nodemailer');


//CONFIG
mongoose.connect(process.env.MONGODB_URI).then(() => {
  console.log("conectado ao MongoDB");
}).catch((erro) => {
  console.error('Nome:', erro.name);
  console.error('Mensagem:', erro.message);
  console.error('Erro completo:', erro);
});
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false
}));
app.use(flash())
app.use(express.static('.'));
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});
transporter.verify().then(() => {
  console.log("Conexão com o Gmail configurada!");
}).catch((erro) => {
  console.error("Erro ao conectar ao Gmail:", erro.message);
});


//ROTAS
app.post('/contato', async (req, res) => {
  
  const { nome, email, men } = req.body;
  
  let erros = [];
  
  if (typeof nome !== 'string' || !nome.trim()) {
    erros.push({texto: "Nome Inválido"});
  };
  
  if (typeof email !== 'string' || !email.trim()) {
    erros.push({texto: "E-mail Inválido"});
  };
  
  if (typeof men !== 'string' || !men.trim()) {
    erros.push({texto: "Mensagem Inválida"});
  };

  if (erros.length > 0) {
    req.flash('erro', erros.map(erro => erro.texto).join(" "));
    return res.redirect('/');
  } 
  
  // 1. Salvar a mensagem no MongoDB
  
  const novaMensagem = new Contato({
    nome: nome.trim(),
    email: email.trim(),
    men: men.trim()
  });

  try {  
    await novaMensagem.save();
  } catch (erro) {
    console.error("Erro ao salvar no MongoDB:", erro);

    req.flash("erro", "Não foi possível salvar sua mensagem. Tente novamente.");
    
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
    console.error("Erro ao enviar o e-mail:", erro);
    
    req.flash("erro", "Sua mensagem foi salva mas não foi possível enviar o e-mail. Tente novamente mais tarde.");

    return res.redirect('/')
  }

    // 3. As duas operações deram certo
  
    req.flash('sucesso', 'Mensagem enviada com sucesso!');
    return res.redirect('/');
});


app.get('/mensagens', (req, res) => {
  const sucesso = req.flash("sucesso");
  const erro = req.flash("erro");
  res.json({
    sucesso, 
    erro
  });
});


app.listen(3000, () => {
  console.log("Servidor rodando em http://localhost:3000");
});
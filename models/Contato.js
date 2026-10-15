const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const contatoSchema = new Schema ({
  nome: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  }, 
  men: {
    type: String,
    required: true
  } 
});

module.exports = mongoose.model("Contato", contatoSchema);
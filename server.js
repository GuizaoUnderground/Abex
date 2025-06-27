const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());

const db = new sqlite3.Database('./abex.db', (err) => {
  if (err) {
    console.error('Erro ao abrir banco:', err.message);
  } else {
    console.log('Banco SQLite conectado.');

    db.run(`
      CREATE TABLE IF NOT EXISTS clientes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL,
        email TEXT NOT NULL,
        telefone TEXT NOT NULL
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS prestadores (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL,
        email TEXT NOT NULL,
        telefone TEXT NOT NULL,
        servico TEXT NOT NULL,
        descricao TEXT NOT NULL
      )
    `);
  }
});

app.post('/cadastro-cliente', (req, res) => {
  const { nome, email, telefone } = req.body;

  if (!nome || !email || !telefone) {
    return res.status(400).json({ error: 'Todos os campos são obrigatórios.' });
  }

  const query = `INSERT INTO clientes (nome, email, telefone) VALUES (?, ?, ?)`;
  db.run(query, [nome, email, telefone], function (err) {
    if (err) {
      console.error(err.message);
      return res.status(500).json({ error: 'Erro ao salvar no banco.' });
    }
    res.json({ message: 'Cadastro de cliente realizado com sucesso!', id: this.lastID });
  });
});

app.post('/cadastro-prestador', (req, res) => {
  const { nome, email, telefone, servico, descricao } = req.body;

  if (!nome || !email || !telefone || !servico || !descricao) {
    return res.status(400).json({ error: 'Todos os campos são obrigatórios.' });
  }

  const query = `INSERT INTO prestadores (nome, email, telefone, servico, descricao) VALUES (?, ?, ?, ?, ?)`;
  db.run(query, [nome, email, telefone, servico, descricao], function (err) {
    if (err) {
      console.error(err.message);
      return res.status(500).json({ error: 'Erro ao salvar no banco.' });
    }
    res.json({ message: 'Cadastro de prestador realizado com sucesso!', id: this.lastID });
  });
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});

app.get('/prestadores', (req, res) => {
  const servico = req.query.servico;

  if (!servico) {
    return res.status(400).json({ error: 'Parâmetro servico é obrigatório.' });
  }

  const query = `SELECT * FROM prestadores WHERE servico = ?`;
  db.all(query, [servico], (err, rows) => {
    if (err) {
      console.error(err.message);
      return res.status(500).json({ error: 'Erro ao consultar banco.' });
    }
    res.json(rows);
  });
});

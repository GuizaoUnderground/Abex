const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const db = require('./banco'); 
const app = express();
const PORT = 3000;


//app.use(cors({
//  origin: 'http://localhost:8080',  
//  methods: ['GET', 'POST'],
//  allowedHeaders: ['Content-Type']
//}));


app.use(cors());
app.use(express.static(__dirname));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.post('/cadastro-cliente', (req, res) => {
  const { nome, email, telefone, senha, cidade } = req.body;

  if (!nome || !email || !telefone || !senha || !cidade) {
    return res.status(400).json({ error: 'Dados incompletos. Por favor, preencha todos os campos.' });
  }

  const checkQuery = `SELECT id FROM clientes WHERE email = ? OR telefone = ?`;
  db.get(checkQuery, [email, telefone], (err, row) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Erro ao verificar duplicidade.' });
    }
    
    if (row) {
      return res.status(409).json({ error: 'E-mail ou telefone já cadastrado.' });
    }

    const insertQuery = `INSERT INTO clientes (nome, email, telefone, senha, cidade) VALUES (?, ?, ?, ?, ?)`;
    db.run(insertQuery, [nome, email, telefone, senha, cidade], function(err) {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'Erro ao salvar cliente.' });
      }
      res.json({ message: 'Cadastro de cliente realizado com sucesso!', id: this.lastID });
    });
  });
});

app.post('/cadastro-prestador', (req, res) => {
  const { nome, email, servico, descricao, telefone, senha, cidade } = req.body;

  if (!nome || !email || !servico || !descricao || !telefone || !senha || !cidade) {
    return res.status(400).json({ error: 'Dados incompletos. Por favor, preencha todos os campos.' });
  }

  const checkQuery = `SELECT id FROM prestadores WHERE (email = ? OR telefone = ?) AND servico = ?`;
  db.get(checkQuery, [email, telefone, servico], (err, row) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Erro ao verificar duplicidade para este serviço.' });
    }
    
    if (row) {
      return res.status(409).json({ error: 'Você já está cadastrado para este serviço com este e-mail ou telefone.' });
    }

    const insertQuery = `INSERT INTO prestadores (nome, email, servico, descricao, telefone, senha, cidade) VALUES (?, ?, ?, ?, ?, ?, ?)`;
    db.run(insertQuery, [nome, email, servico, descricao, telefone, senha, cidade], function(err) {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'Erro ao salvar prestador.' });
      }
      res.json({ message: 'Cadastro de prestador realizado com sucesso!', id: this.lastID });
    });
  });
});

app.get('/prestadores/:servico', (req, res) => {
  const { servico } = req.params;
  const query = `SELECT nome, email, descricao, telefone FROM prestadores WHERE servico = ?`;
  db.all(query, [servico], (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Erro ao buscar prestadores.' });
    }
    res.json(rows);
  });
});

app.get('/prestadores/cidade/:cidade', (req, res) => {
  const { cidade } = req.params;
  const query = `SELECT id, nome, email, descricao, telefone, servico FROM prestadores WHERE cidade = ?`;
  db.all(query, [cidade], (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Erro ao buscar prestadores por cidade.' });
    }
    res.json(rows);
  });
});

app.post('/login', (req, res) => {
  const { email, senha, userType } = req.body;

  if (!email || !senha || !userType) {
    return res.status(400).json({ error: 'Dados de login incompletos.' });
  }

  let tableName = '';
  if (userType === 'cliente') {
    tableName = 'clientes';
  } else if (userType === 'colaborador') {
    tableName = 'prestadores';
  } else {
    return res.status(400).json({ error: 'Tipo de usuário inválido.' });
  }

  const query = `SELECT id, nome, cidade FROM ${tableName} WHERE email = ? AND senha = ?`;

  db.get(query, [email, senha], (err, row) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Erro ao buscar usuário.' });
    }

    if (!row) {
      return res.status(401).json({ success: false, message: 'E-mail ou senha incorretos.' });
    }
    
    res.json({ 
      success: true, 
      message: 'Login bem-sucedido!', 
      user: { id: row.id, nome: row.nome, type: userType, cidade: row.cidade },
      redirectUrl: userType === 'cliente' ? 'pagina-cliente.html' : 'pagina-colaborador.html'
    });
  });
});

app.post('/interesse', (req, res) => {
  const { clienteId, prestadorId } = req.body;

  if (!clienteId || !prestadorId) {
    return res.status(400).json({ error: 'Dados incompletos para registrar interesse.' });
  }

  const dataInteresse = new Date().toISOString();
  const insertQuery = `INSERT INTO interesses (cliente_id, prestador_id, data_interesse) VALUES (?, ?, ?)`;
  
  db.run(insertQuery, [clienteId, prestadorId, dataInteresse], function(err) {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Erro ao registrar interesse.' });
    }
    res.json({ message: 'Interesse registrado com sucesso! O prestador será notificado.', id: this.lastID });
  });
});

app.get('/interesses/:prestadorId', (req, res) => {
  const { prestadorId } = req.params;
  const query = `
    SELECT i.id, c.nome AS nome_cliente, c.email AS email_cliente, c.telefone AS telefone_cliente, i.status
    FROM interesses AS i
    JOIN clientes AS c ON i.cliente_id = c.id
    WHERE i.prestador_id = ? AND i.status = 'pendente'
  `;

  db.all(query, [prestadorId], (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Erro ao buscar interesses.' });
    }
    res.json(rows);
  });
});

app.post('/confirmar-atendimento', (req, res) => {
  const { interesseId } = req.body;

  if (!interesseId) {
    return res.status(400).json({ error: 'ID do interesse não fornecido.' });
  }

  const updateQuery = `UPDATE interesses SET status = 'confirmado' WHERE id = ?`;
  db.run(updateQuery, [interesseId], function(err) {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Erro ao confirmar atendimento.' });
    }
    res.json({ message: 'Atendimento confirmado com sucesso!' });
  });
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
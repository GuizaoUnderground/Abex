const sqlite3 = require('sqlite3').verbose(); // Importa o módulo sqlite3

// Conecta-se ao banco de dados ou o cria se não existir
const db = new sqlite3.Database('./banco.db', (err) => {
  if (err) {
    // Se ocorrer um erro, exibe uma mensagem no console
    console.error('Erro ao conectar ao banco de dados:', err.message);
  } else {
    // Se a conexão for bem-sucedida, exibe uma mensagem no console
    console.log('Conectado ao banco de dados SQLite.');
    // Cria as tabelas necessárias, caso não existam
    db.run(`
      CREATE TABLE IF NOT EXISTS clientes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        telefone TEXT NOT NULL,
        senha TEXT NOT NULL,
        cidade TEXT NOT NULL
      )
    `);
    db.run(`
      CREATE TABLE IF NOT EXISTS prestadores (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL,
        email TEXT NOT NULL,
        servico TEXT NOT NULL,
        descricao TEXT,
        telefone TEXT NOT NULL,
        senha TEXT NOT NULL,
        cidade TEXT NOT NULL,
        UNIQUE(email, servico)  
      )
    `);
    // Adiciona a nova tabela para gerenciar os interesses
    db.run(`
      CREATE TABLE IF NOT EXISTS interesses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        cliente_id INTEGER NOT NULL,
        prestador_id INTEGER NOT NULL,
        data_interesse TEXT NOT NULL,
        status TEXT DEFAULT 'pendente', -- 'pendente', 'confirmado', 'cancelado'
        FOREIGN KEY (cliente_id) REFERENCES clientes(id),
        FOREIGN KEY (prestador_id) REFERENCES prestadores(id)
      )
    `);
  }
});

// Exporta o objeto de conexão para ser usado em outros arquivos
module.exports = db;
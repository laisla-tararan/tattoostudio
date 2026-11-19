require('dotenv').config()
const fs = require('fs')
const path = require('path')
const express = require('express')
const mysql = require('mysql2/promise')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const crypto = require('crypto')
const cookieparser = require('cookie-parser')
const Mustache = require('mustache')

const app = express()

app.use(express.urlencoded({ extended: false }))
app.use(cookieparser())

app.use((req, res, next) => {
  const metodo = String(req.body?._method || '').toUpperCase()
  if (req.method === 'POST' && ['PUT', 'DELETE'].includes(metodo)) {
    req.method = metodo
  }
  next()
})

const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  dateStrings: true
})

// Funções auxiliares
function mostrar(nome, dados = {}) {
  const arquivo = path.join(__dirname, 'paginas', `${nome}.html`)
  return Mustache.render(fs.readFileSync(arquivo, 'utf8'), dados)
}

function criptografar(texto) {
  const cifra = crypto.createCipheriv(
    'aes-256-cbc',
    process.env.CRIPTO_CHAVE,
    process.env.CRIPT_IV
  )
  return cifra.update(texto, 'utf8', 'hex') + cifra.final('hex')
}

function descriptografar(texto) {
  const decifra = crypto.createDecipheriv(
    'aes-256-cbc',
    process.env.CRIPTO_CHAVE,
    process.env.CRIPT_IV
  )
  return decifra.update(texto, 'hex', 'utf8') + decifra.final('utf8')
}

async function excluir(res, tabela, id, volta, motivo) {
  try {
    await db.query(`DELETE FROM ${tabela} WHERE id = ?`, [id])
    res.redirect(volta)
  } catch (erro) {
    if (erro.code === 'ER_ROW_IS_REFERENCED_2') {
      res.status(409).send(
        `<p>Não foi possível excluir: ${motivo}</p><p><a href="${volta}">Voltar</a></p>`
      )
    }
    console.error(erro)
    res.status(500).send(`<p>Erro ao excluir.</p><p><a href="${volta}">Voltar</a></p>`)
  }
}

async function mostrarProjetos(req, res, erro = null) {
  const [projetos] = await db.query('SELECT * FROM projetos')
  const [listaClientes] = await db.query('SELECT id, nome FROM clientes')
  const editar = projetos.find((projeto) => String(projeto.id) === req.query.editar)

  const clientes = listaClientes.map((cliente) => ({
    ...cliente,
    selecionado: editar && cliente.id === editar.cliente_id ? 'selected' : ''
  }))

  res.send(
    mostrar('projetos', {
      projetos,
      clientes,
      erro,
      editando: Boolean(editar),
      acao: editar ? `/projetos/${editar.id}` : 'projetos',
      form: editar || {}
    })
  )
}

//Login
app.get('/', (req, res) => res.send(mostrar('login')))

app.post('/login', async (req, res) => {
  const { email, senha } = req.body
  const [usuarios] = await db.query('SELECT * FROM usuarios WHERE email = ?', [email])
  const usuario = usuarios[0]

  if (!usuario || !(await bcrypt.compare(senha, usuario.senha))) {
    return res.send(mostrar('login', { erro: 'Email ou senha inválidos' }))
  }

  const token = jwt.sign(
    { id: usuario.id, nome: usuario.nome },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  )

  res.cookie('token', token, { httpOnly: true })
  res.redirect('/principal')
})

app.post('/sair', (req, res) => {
  res.clearCookie('token')
  res.redirect('/')
})

app.use((req, res, next) => {
  try {
    req.usuario = jwt.verify(req.cookies.token, process.env.JWT_SECRET)
    next()
  } catch (erro) {
    res.redirect('/')
  }
})

app.get('/principal', (req, res) => {
  res.send(mostrar('principal', { nome: req.usuario.nome }))
})

//Clientes
app.get('/clientes', async (req, res) => {
  const busca = req.query.busca || ''
  const [lista] = await db.query('SELECT * FROM clientes WHERE nome LIKE ?', [`%${busca}%`])
  const clientes = lista.map((cliente) => ({
    ...cliente,
    cpf: descriptografar(cliente.cpf)
  }))

  const editar = clientes.find((cliente) => String(cliente.id) === req.query.editar)

  res.send(
    mostrar('clientes', {
      busca,
      clientes,
      editando: Boolean(editar),
      acao: editar ? `/clientes/${editar.id}` : 'clientes',
      form: editar || {}
    })
  )
})

app.post('/clientes', async (req, res) => {
  const { nome, cpf, telefone, email } = req.body
  await db.query(
    'INSERT INTO clientes (nome, cpf, telefone, email) VALUE (?, ?, ?, ?)',
    [nome, criptografar(cpf), telefone, email]
  )

  res.redirect('/clientes')
})

app.put('/clientes/:id', async (req, res) => {
  const { nome, cpf, telefone, email } = req.body
  await db.query(
    'UPDATE clientes SET nome = ?, cpf = ?, telefone = ?, email = ? WHERE id = ?',
    [nome, criptografar(cpf), telefone, email, req.params.id]
  )

  res.redirect('/clientes')
})

app.delete('/clientes/:id', async (req, res) => {
  await excluir(
    res,
    'clientes',
    req.params.id,
    '/clientes',
    'O cliente já possui projetos cadastrados.'
  )
})

//Projetos
app.get('/projetos', (req, res) => mostrarProjetos(req, res))

app.post('/projetos', async (req, res) => {
  const { cliente_id, descricao, valor, data_inicio, data_fim } = req.body

  if (!cliente_id) {
    return mostrarProjetos(req, res, 'Cliente ID é obrigatório')
  }

  await db.query(
    'INSERT INTO projetos (cliente_id, descricao, data_inicio, data_fim) VALUE (?, ?, ?, ?)',
    [cliente_id, descricao, data_inicio, data_fim]
  )

  res.redirect('/projetos')
})

app.put('/projetos/:id', async (req, res) => {
  const { cliente_id, descricao, valor, data_inicio, data_fim } = req.body

  if (!cliente_id) {
    return mostrarProjetos(req, res, 'Cliente ID é obrigatório')
  }

  await db.query(
    'UPDATE projetos SET cliente_id = ?, descricao = ?, valor = ?, data_inicio = ?, data_fim = ? WHERE id = ?',
    [cliente_id, descricao, valor, data_inicio, data_fim, req.params.id]
  )

  res.redirect('/projetos')
})

app.delete('/projetos/:id', async (req, res) => {
  await excluir(
    res, 'projetos', req.params.id, '/projetos', 'O projeto já possui agendamentos.'
  )
})

//Sessões
app.get('/sessoes', async (req, res) => {
  const [lista] = await db.query('SELECT sessoes.*, usuarios.nome AS tatuador, projetos.titulo_tatuagem AS projeto, clientes.nome AS cliente FROM sessoes INNER JOIN usuarios ON usuarios.id = sessoes.usuario_id INNER JOIN projetos ON projetos.id = sessoes.projeto_id INNER JOIN clientes ON clientes.id = projetos.cliente_id ORDER BY sessoes.data_agendamento')
  const [projetos] = await db.query(
    'SELECT id, titulo_tatuagem FROM projetos ORDER BY titulo_tatuagem'
  )

  const sessoes = lista.map((sessao) => ({
    ...sessao,
    data_br: new Date(sessao.data_agendamento).toLocaleDateString('pt-BR'),
    data_input: (sessao.data_agendamento || '').slice(0, 16).replace(' ', 'T')
  }))

  res.send(mostrar('sessoes', { sessoes, projetos }))
})

app.post('/sessoes', async (req, res) => {
  const { projeto_id, data_agendamento } = req.body

  await db.query(
    'INSERT INTO sessoes (usuario_id, projeto_id, data_agendamento) VALUES (?, ?, ?)',
    [req.usuario.id, projeto_id, data_agendamento]
  )

  res.redirect('/sessoes')

})

app.put('/sessoes/:id', async (req, res) => {
  await db.query(
    'UPDATE sessoes SET data_agendamento = ? WHERE id = ?',
    [req.body.data_agendamento.replace(' ', 'T'), req.params.id]
  )

  res.redirect('/sessoes')
})

app.delete('/sessoes/:id', async (req, res) => {
  await excluir(
    res, 'sessoes', req.params.id, '/sessoes', 'A sessão não pode ser excluída.'
  )
})

const porta = process.env.PORT || 3000
app.listen(porta, () => console.log(`Oficina rodando em http://localhost:${porta}`))
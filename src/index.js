const express = require('express');
const { PrismaClient } = require('@prisma/client');

const app = express();
const prisma = new PrismaClient();
const port = Number(process.env.PORT) || 3000;

app.use(express.json());

const asyncHandler = (handler) => (req, res, next) => {
  Promise.resolve(handler(req, res, next)).catch(next);
};

const parseId = (value) => {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
};

const validateUser = (body, partial = false) => {
  const data = {};

  if (!partial || body.name !== undefined) {
    if (typeof body.name !== 'string' || !body.name.trim()) {
      return { error: 'O campo name e obrigatorio.' };
    }
    data.name = body.name.trim();
  }

  if (!partial || body.email !== undefined) {
    if (typeof body.email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
      return { error: 'Informe um email valido.' };
    }
    data.email = body.email.trim().toLowerCase();
  }

  return { data };
};

app.get('/health', asyncHandler(async (req, res) => {
  await prisma.$queryRaw`SELECT 1`;
  res.json({ status: 'ok', database: 'connected' });
}));

app.get('/users', asyncHandler(async (req, res) => {
  const users = await prisma.user.findMany({ orderBy: { id: 'asc' } });
  res.json(users);
}));

app.get('/users/:id', asyncHandler(async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ error: 'ID invalido.' });

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return res.status(404).json({ error: 'Usuario nao encontrado.' });
  res.json(user);
}));

app.post('/users', asyncHandler(async (req, res) => {
  const result = validateUser(req.body);
  if (result.error) return res.status(400).json({ error: result.error });

  const user = await prisma.user.create({ data: result.data });
  res.status(201).json(user);
}));

app.put('/users/:id', asyncHandler(async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ error: 'ID invalido.' });

  const result = validateUser(req.body);
  if (result.error) return res.status(400).json({ error: result.error });

  const user = await prisma.user.update({ where: { id }, data: result.data });
  res.json(user);
}));

app.delete('/users/:id', asyncHandler(async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ error: 'ID invalido.' });

  await prisma.user.delete({ where: { id } });
  res.status(204).end();
}));

app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'JSON invalido.' });
  }
  if (err.code === 'P2002') {
    return res.status(409).json({ error: 'Ja existe um usuario com esse email.' });
  }
  if (err.code === 'P2025') {
    return res.status(404).json({ error: 'Usuario nao encontrado.' });
  }

  console.error(err);
  res.status(500).json({ error: 'Erro interno do servidor.' });
});

const server = app.listen(port, '0.0.0.0', () => {
  console.log(`API pronta na porta ${port}`);
});

const shutdown = async () => {
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
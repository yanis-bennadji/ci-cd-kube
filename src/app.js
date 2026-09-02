const express = require('express');

const APP_VERSION = process.env.APP_VERSION || 'dev';
const APP_ENV = process.env.APP_ENV || 'development';
const GIT_SHA = process.env.GIT_SHA || 'unknown';

const items = new Map();
let nextId = 1;

function seed() {
  items.clear();
  nextId = 1;
  for (const name of ['pipeline', 'docker', 'kubernetes']) {
    items.set(nextId, { id: nextId, name });
    nextId += 1;
  }
}
seed();

function createApp() {
  const app = express();
  app.use(express.json());
  app.disable('x-powered-by');

  app.get('/', (req, res) => {
    res.json({
      service: 'ci-cd-kube',
      version: APP_VERSION,
      environment: APP_ENV,
      commit: GIT_SHA,
    });
  });

  app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', uptime: process.uptime() });
  });

  app.get('/ready', (req, res) => {
    res.status(200).json({ status: 'ready' });
  });

  app.get('/api/items', (req, res) => {
    res.json({ count: items.size, items: [...items.values()] });
  });

  app.get('/api/items/:id', (req, res) => {
    const id = Number(req.params.id);
    const item = items.get(id);
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }
    res.json(item);
  });

  app.post('/api/items', (req, res) => {
    const { name } = req.body || {};
    if (typeof name !== 'string' || name.trim() === '') {
      return res.status(400).json({ error: 'Field "name" is required' });
    }
    const item = { id: nextId, name: name.trim() };
    items.set(nextId, item);
    nextId += 1;
    res.status(201).json(item);
  });

  app.delete('/api/items/:id', (req, res) => {
    const id = Number(req.params.id);
    if (!items.delete(id)) {
      return res.status(404).json({ error: 'Item not found' });
    }
    res.status(204).end();
  });

  app.use((req, res) => {
    res.status(404).json({ error: 'Unknown route' });
  });

  return app;
}

module.exports = { createApp, seed, APP_VERSION, APP_ENV, GIT_SHA };

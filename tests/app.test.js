const { test, describe, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const { createApp, seed } = require('../src/app');

let app;

beforeEach(() => {
  seed();
  app = createApp();
});

describe('Health endpoints', () => {
  test('GET /health returns 200 with status ok', async () => {
    const res = await request(app).get('/health');
    assert.equal(res.status, 200);
    assert.equal(res.body.status, 'ok');
  });

  test('GET /ready returns 200 with status ready', async () => {
    const res = await request(app).get('/ready');
    assert.equal(res.status, 200);
    assert.equal(res.body.status, 'ready');
  });
});

describe('Root endpoint', () => {
  test('GET / exposes the service name and its build metadata', async () => {
    const res = await request(app).get('/');
    assert.equal(res.status, 200);
    assert.equal(res.body.service, 'ci-cd-kube');
    assert.ok(res.body.version, 'version must be set');
    assert.ok(res.body.environment, 'environment must be set');
  });
});

describe('Items API', () => {
  test('GET /api/items returns the 3 seeded items', async () => {
    const res = await request(app).get('/api/items');
    assert.equal(res.status, 200);
    assert.equal(res.body.count, 3);
    assert.equal(res.body.items.length, 3);
  });

  test('GET /api/items/:id returns an existing item', async () => {
    const res = await request(app).get('/api/items/1');
    assert.equal(res.status, 200);
    assert.equal(res.body.id, 1);
    assert.equal(res.body.name, 'pipeline');
  });

  test('GET /api/items/:id returns 404 when the item does not exist', async () => {
    const res = await request(app).get('/api/items/999');
    assert.equal(res.status, 404);
    assert.equal(res.body.error, 'Item not found');
  });

  test('POST /api/items creates an item and makes it retrievable', async () => {
    const res = await request(app).post('/api/items').send({ name: 'ingress' });
    assert.equal(res.status, 201);
    assert.equal(res.body.name, 'ingress');

    const list = await request(app).get('/api/items');
    assert.equal(list.body.count, 4);
  });

  test('POST /api/items rejects a blank name with 400', async () => {
    const res = await request(app).post('/api/items').send({ name: '   ' });
    assert.equal(res.status, 400);
  });

  test('POST /api/items rejects a body without a name with 400', async () => {
    const res = await request(app).post('/api/items').send({});
    assert.equal(res.status, 400);
  });

  test('DELETE /api/items/:id removes an existing item', async () => {
    const res = await request(app).delete('/api/items/2');
    assert.equal(res.status, 204);

    const check = await request(app).get('/api/items/2');
    assert.equal(check.status, 404);
  });

  test('DELETE /api/items/:id returns 404 when the item does not exist', async () => {
    const res = await request(app).delete('/api/items/999');
    assert.equal(res.status, 404);
  });
});

describe('Unknown routes', () => {
  test('GET on an unknown route returns 404', async () => {
    const res = await request(app).get('/does-not-exist');
    assert.equal(res.status, 404);
    assert.equal(res.body.error, 'Unknown route');
  });
});

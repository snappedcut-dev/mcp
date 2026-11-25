import { test } from 'node:test';
import assert from 'node:assert/strict';
import { handle, TOOLS, call } from '../src/tools.mjs';

const deps = { version: '0.0.0' };

test('initialize answers with the protocol version and the server name', async () => {
  const r = await handle({ method: 'initialize' }, deps);
  assert.equal(r.serverInfo.name, 'snappedcut');
  assert.ok(r.capabilities.tools);
});

test('notifications get no reply', async () => {
  assert.equal(await handle({ method: 'notifications/initialized' }, deps), null);
  assert.equal(await handle({ method: 'notifications/cancelled' }, deps), null);
});

test('tools/list returns every tool with a schema', async () => {
  const { tools } = await handle({ method: 'tools/list' }, deps);
  assert.equal(tools.length, TOOLS.length);
  for (const t of tools) {
    assert.ok(t.name && t.description, `${t.name} needs a description`);
    assert.equal(t.inputSchema.type, 'object');
  }
});

test('no tool takes a duration — the price comes from the bundle', async () => {
  // The server reads the timeline out of project.json. A duration in the
  // schema would tell the model it can set the price.
  for (const t of TOOLS) {
    assert.ok(!('seconds' in (t.inputSchema.properties ?? {})), `${t.name} must not take seconds`);
  }
});

test('export_presets needs no key', async () => {
  const r = await call('export_presets', {}, deps);
  const presets = JSON.parse(r.content[0].text);
  assert.ok(presets.some((p) => p.id === 'vertical'));
});

test('a tool failure comes back as a readable result, not a dead turn', async () => {
  const r = await handle(
    { method: 'tools/call', params: { name: 'account', arguments: {} } },
    { snapcut: () => { throw new Error('No key.'); } },
  );
  assert.equal(r.isError, true);
  assert.match(r.content[0].text, /No key/);
});

test('an unknown method is a JSON-RPC method-not-found', async () => {
  await assert.rejects(() => handle({ method: 'nope' }, deps), (e) => e.code === -32601);
});

test('run_tool uploads local inputs first, and passes asset ids through', async () => {
  const uploads = [];
  const created = [];
  const client = {
    upload: async (bytes, options) => { uploads.push(options); return { id: 'ast_uploaded000000000' }; },
    create: async (request) => { created.push(request); return { job: { id: 'job_t' }, charged: 0 }; },
  };
  const r = await call(
    'run_tool',
    { tool: 'compress-video', inputs: ['/tmp/a.mp4', 'ast_already000000000'], params: { quality: 'small' } },
    { snapcut: () => client, readFile: async () => new Uint8Array(4) },
  );
  assert.deepEqual(uploads, [{ name: 'a.mp4', contentType: 'video/mp4' }]);
  assert.deepEqual(created, [{ kind: 'tool', tool: 'compress-video', inputs: ['ast_uploaded000000000', 'ast_already000000000'], params: { quality: 'small' } }]);
  assert.match(r.content[0].text, /job_t/);
});

test('render_design sends its idempotency key as an option, not in the body', async () => {
  const seen = [];
  const client = { create: async (...a) => { seen.push(a); return { job: { id: 'job_d' }, charged: 4 }; } };
  await call('render_design', { design: { clips: [] }, idempotencyKey: 'k1', outputs: [{ preset: 'square' }] }, { snapcut: () => client });
  assert.deepEqual(seen, [[{ design: { clips: [] }, outputs: [{ preset: 'square' }] }, { idempotencyKey: 'k1' }]]);
});

test('a cloud tool with no key says how to get one', async () => {
  const r = await handle(
    { method: 'tools/call', params: { name: 'list_operations', arguments: {} } },
    { snapcut: () => { throw new Error('No key. Set SNAPCUT_KEY — a cloud render spends credits.'); } },
  );
  assert.equal(r.isError, true);
  assert.match(r.content[0].text, /SNAPCUT_KEY/);
});

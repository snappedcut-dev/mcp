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

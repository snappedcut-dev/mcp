#!/usr/bin/env node
/**
 * Snapped Cut as an MCP server.
 *
 * JSON-RPC over stdio, so a model can queue a cloud render, watch it and save
 * the file. Needs SNAPCUT_KEY — a render spends credits, and nothing here will
 * spend them without one.
 *
 *   {
 *     "mcpServers": {
 *       "snappedcut": {
 *         "command": "npx",
 *         "args": ["-y", "@snappedcut/mcp"],
 *         "env": { "SNAPCUT_KEY": "sk_snapcut_..." }
 *       }
 *     }
 *   }
 *
 * Options: --base <url> for a self-hosted install.
 */
import { readFile, writeFile } from 'node:fs/promises';
import { createInterface } from 'node:readline';
import { createRequire } from 'node:module';
import { SnappedCut } from '@snappedcut/sdk';
import { handle } from './tools.mjs';

const argv = process.argv.slice(2);
const flag = (name, fallback) => {
  const at = argv.indexOf(name);
  return at === -1 ? fallback : argv[at + 1];
};

const base = flag('--base', process.env.SNAPCUT_BASE ?? 'https://snappedcut.com');
const version = createRequire(import.meta.url)('../package.json').version;

/* Built on first use, not at startup: `export_presets` answers without a key,
   and a server that exits because it has no key cannot tell a client that. */
let cached;
const snapcut = () => {
  const key = process.env.SNAPCUT_KEY;
  if (!key) throw new Error('No key. Set SNAPCUT_KEY — a cloud render spends credits.');
  cached ??= new SnappedCut({ key, base });
  return cached;
};

const deps = { snapcut, readFile, writeFile, version };
const send = (value) => process.stdout.write(`${JSON.stringify(value)}\n`);

const lines = createInterface({ input: process.stdin });
for await (const line of lines) {
  if (!line.trim()) continue;

  let message;
  try {
    message = JSON.parse(line);
  } catch {
    send({ jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error' } });
    continue;
  }

  try {
    const result = await handle(message, deps);
    // A notification has no id and must get no reply at all.
    if (result !== null && message.id !== undefined) send({ jsonrpc: '2.0', id: message.id, result });
  } catch (error) {
    if (message.id !== undefined) {
      send({
        jsonrpc: '2.0',
        id: message.id,
        error: { code: error?.code ?? -32603, message: String(error?.message ?? error) },
      });
    }
  }
}

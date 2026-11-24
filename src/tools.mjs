import { EXPORT_PRESETS } from './presets.mjs';

/**
 * The tools, and the JSON-RPC dispatch around them.
 *
 * `handle` takes its dependencies rather than importing them, so the protocol
 * can be tested without a key, a network or a server process.
 */

export const TOOLS = [
  {
    name: 'export_presets',
    description: 'List the export presets cloud_render accepts, with their sizes. Needs no key.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'account',
    description: 'How many credits are left, and what things cost.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'cloud_render',
    description:
      'Render a project bundle on Snapped Cut servers. Costs credits. The price is read ' +
      'from the timeline in the bundle itself, so it cannot be set here. Returns the job, ' +
      'what it was charged, and — if `out` is given — waits and saves the finished file.',
    inputSchema: {
      type: 'object',
      properties: {
        bundle: { type: 'string', description: 'Path to the .zip bundle.' },
        kind: {
          type: 'string',
          enum: ['cloud-render', 'cloud-render-4k'],
          description: 'cloud-render-4k costs more because the encode really is more work.',
        },
        out: { type: 'string', description: 'Where to save the finished file. Waits for the render if given.' },
      },
      required: ['bundle'],
    },
  },
  {
    name: 'job_status',
    description: 'Check a cloud render queued earlier.',
    inputSchema: {
      type: 'object',
      properties: { id: { type: 'string', description: 'The job id.' } },
      required: ['id'],
    },
  },
];

const text = (value) => ({
  content: [{ type: 'text', text: typeof value === 'string' ? value : JSON.stringify(value, null, 2) }],
});

export async function call(name, args, deps) {
  const { snapcut, readFile, writeFile } = deps;

  switch (name) {
    case 'export_presets':
      return text(EXPORT_PRESETS);

    case 'account':
      return text(await snapcut().account());

    case 'cloud_render': {
      if (!args?.bundle) throw new Error('cloud_render needs a bundle path.');
      const client = snapcut();
      const job = await client.render(await readFile(args.bundle), {
        kind: args.kind ?? 'cloud-render',
      });
      if (!args.out) return text(job);
      const bytes = await client.wait(job.id);
      await writeFile(args.out, bytes);
      return text({ ...job, output: args.out, bytes: bytes.byteLength });
    }

    case 'job_status': {
      if (!args?.id) throw new Error('job_status needs a job id.');
      return text(await snapcut().job(args.id));
    }

    default:
      throw new Error(`Unknown tool ${name}.`);
  }
}

export async function handle(message, deps) {
  switch (message.method) {
    case 'initialize':
      return {
        protocolVersion: '2024-11-05',
        capabilities: { tools: {} },
        serverInfo: { name: 'snappedcut', version: deps.version },
      };

    // Notifications carry no id and get no reply.
    case 'notifications/initialized':
    case 'notifications/cancelled':
      return null;

    case 'ping':
      return {};

    case 'tools/list':
      return { tools: TOOLS };

    case 'tools/call': {
      const { name, arguments: args } = message.params ?? {};
      try {
        return await call(name, args, deps);
      } catch (error) {
        // A tool failure is a result the model can read and recover from, not
        // a protocol error that kills the turn.
        return { ...text(`${error}`), isError: true };
      }
    }

    default:
      throw Object.assign(new Error(`Unknown method ${message.method}.`), { code: -32601 });
  }
}

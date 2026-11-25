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
  {
    name: 'list_operations',
    description: 'Every cloud operation: the render kinds with their parameters and prices, every free micro-tool with its params, and the size presets. Call this before run_tool or render_design.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'upload_asset',
    description: 'Upload a local media file (video, audio, image) or a bundle .zip, for use by id in render_design and run_tool. Assets live 7 days.',
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Local file path.' },
        contentType: { type: 'string', description: 'MIME type; guessed from the extension if absent.' },
      },
      required: ['path'],
    },
  },
  {
    name: 'render_design',
    description:
      'Render a video from a declarative design. Costs credits per output per started minute (4K costs four times). ' +
      'design = { width, height, fps, background, clips: [{ type: video|audio|image|text|shape, asset (uploaded id) or url, start, duration, from, x, y (pixels from centre), scale, text, size, color, ... }] }. ' +
      'Strings may hold {{name}}, filled from vars. outputs renders several sizes at once (e.g. [{preset:"landscape"},{preset:"vertical",fit:"cover"}]).',
    inputSchema: {
      type: 'object',
      properties: {
        design: { type: 'object' },
        vars: { type: 'object' },
        outputs: { type: 'array', items: { type: 'object' } },
        format: { type: 'string', enum: ['mp4', 'webm', 'mkv', 'mov'] },
        preset: { type: 'string' },
        destination: { type: 'object', description: '{type:"saved",id} or {type:"presigned-put",url}' },
        priority: { type: 'string', enum: ['interactive', 'background'] },
        idempotencyKey: { type: 'string', description: 'Reuse it on a retry and nothing is charged twice.' },
        out: { type: 'string', description: 'Save the first output here. Waits for the render if given.' },
      },
      required: ['design'],
    },
  },
  {
    name: 'batch_render',
    description: 'Render one design many times with different vars, in one call (up to 100). Returns a job per item.',
    inputSchema: {
      type: 'object',
      properties: {
        design: { type: 'object' },
        items: { type: 'array', items: { type: 'object' }, description: 'One vars object per render.' },
        outputs: { type: 'array', items: { type: 'object' } },
      },
      required: ['design', 'items'],
    },
  },
  {
    name: 'compile_design',
    description: 'Check a design and see what it compiles to (duration, size, assets) without rendering or spending anything.',
    inputSchema: { type: 'object', properties: { design: { type: 'object' }, vars: { type: 'object' } }, required: ['design'] },
  },
  {
    name: 'run_tool',
    description: 'Run one free micro-tool (compress, trim, convert, gif, captions, ...) over local files or uploaded asset ids. list_operations names the tools and their params.',
    inputSchema: {
      type: 'object',
      properties: {
        tool: { type: 'string' },
        inputs: { type: 'array', items: { type: 'string' }, description: 'Local paths or asset ids (ast_...).' },
        params: { type: 'object' },
        out: { type: 'string', description: 'Where to save the result. Waits if given.' },
      },
      required: ['tool', 'inputs'],
    },
  },
  {
    name: 'download_output',
    description: 'Save a finished job output to a local file. index picks one of several outputs.',
    inputSchema: {
      type: 'object',
      properties: { id: { type: 'string' }, index: { type: 'integer' }, out: { type: 'string' } },
      required: ['id', 'out'],
    },
  },
  {
    name: 'get_usage',
    description: 'Renders and credits over a range, grouped by day, week, month, endUser, key or operation.',
    inputSchema: {
      type: 'object',
      properties: {
        from: { type: 'number', description: 'Epoch ms' },
        to: { type: 'number', description: 'Epoch ms' },
        groupBy: { type: 'string', enum: ['day', 'week', 'month', 'endUser', 'key', 'operation'] },
        endUserId: { type: 'string' },
      },
    },
  },
  {
    name: 'list_storage_destinations',
    description: 'The S3-compatible buckets saved on the account, which a render can be delivered into.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'test_storage_destination',
    description: 'Prove a saved destination can be written to (writes one small text object).',
    inputSchema: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] },
  },
  {
    name: 'list_webhooks',
    description: 'The webhook endpoints on the account, with their events.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'webhook_deliveries',
    description: 'Recent deliveries to one webhook endpoint: attempts, status, last answer.',
    inputSchema: { type: 'object', properties: { id: { type: 'string' }, limit: { type: 'integer' } }, required: ['id'] },
  },
];

const TYPES = {
  mp4: 'video/mp4', mov: 'video/quicktime', webm: 'video/webm', mkv: 'video/x-matroska', m4v: 'video/mp4',
  mp3: 'audio/mpeg', wav: 'audio/wav', m4a: 'audio/mp4', ogg: 'audio/ogg', aac: 'audio/aac',
  png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp', gif: 'image/gif',
  zip: 'application/zip', json: 'application/json',
};
const typeOf = (path) => TYPES[String(path).split('.').pop()?.toLowerCase()] ?? 'application/octet-stream';

const uploadPath = async (client, readFile, path, contentType) =>
  client.upload(await readFile(path), { name: String(path).split('/').pop(), contentType: contentType ?? typeOf(path) });

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

    case 'list_operations':
      return text(await snapcut().operations());

    case 'upload_asset':
      if (!args?.path) throw new Error('upload_asset needs a path.');
      return text(await uploadPath(snapcut(), readFile, args.path, args.contentType));

    case 'compile_design': {
      if (!args?.design) throw new Error('compile_design needs a design.');
      const { seconds, size, assets } = await snapcut().compileDesign(args.design, args.vars);
      return text({ seconds, size, assets, note: 'Valid. render_design will render it.' });
    }

    case 'render_design': {
      if (!args?.design) throw new Error('render_design needs a design.');
      const client = snapcut();
      // The key is a header, not part of the job.
      const { out, idempotencyKey, ...request } = args;
      const made = await client.create(request, { idempotencyKey });
      if (!out) return text({ ...made, note: 'Queued. Poll with job_status, then download_output.' });
      const bytes = await client.wait(made.job.id);
      await writeFile(out, bytes);
      return text({ id: made.job.id, out, bytes: bytes.byteLength, charged: made.charged });
    }

    case 'batch_render':
      if (!args?.design) throw new Error('batch_render needs a design.');
      return text(
        await snapcut().batch(
          (args.items ?? []).map((vars) => ({ vars })),
          { design: args.design, ...(args.outputs ? { outputs: args.outputs } : {}) },
        ),
      );

    case 'run_tool': {
      if (!args?.tool) throw new Error('run_tool needs a tool.');
      const client = snapcut();
      const inputs = [];
      for (const input of args.inputs ?? []) {
        inputs.push(/^ast_/.test(input) ? input : (await uploadPath(client, readFile, input)).id);
      }
      const made = await client.create({ kind: 'tool', tool: args.tool, inputs, params: args.params ?? {} });
      if (!args.out) return text({ ...made, note: 'Queued. Poll with job_status, then download_output.' });
      const bytes = await client.wait(made.job.id);
      await writeFile(args.out, bytes);
      return text({ id: made.job.id, out: args.out, bytes: bytes.byteLength });
    }

    case 'download_output': {
      if (!args?.id || !args?.out) throw new Error('download_output needs an id and an out path.');
      const bytes = await snapcut().output(args.id, args.index ?? 0);
      await writeFile(args.out, bytes);
      return text({ id: args.id, out: args.out, bytes: bytes.byteLength });
    }

    case 'get_usage':
      return text(await snapcut().usage(args ?? {}));

    case 'list_storage_destinations':
      return text(await snapcut().destinations.list());

    case 'test_storage_destination':
      if (!args?.id) throw new Error('test_storage_destination needs an id.');
      return text(await snapcut().destinations.test(args.id));

    case 'list_webhooks':
      return text(await snapcut().webhooks.list());

    case 'webhook_deliveries':
      if (!args?.id) throw new Error('webhook_deliveries needs an id.');
      return text(await snapcut().webhooks.deliveries(args.id, args.limit ?? 50));

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

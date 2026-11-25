# @snappedcut/mcp

An [MCP](https://modelcontextprotocol.io) server for [Snapped Cut](https://snappedcut.com).
JSON-RPC over stdio, so Claude and other MCP clients can upload media, render
designs and bundles, run the free tools, watch the jobs and save the files.

```json
{
  "mcpServers": {
    "snappedcut": {
      "command": "npx",
      "args": ["-y", "@snappedcut/mcp"],
      "env": { "SNAPCUT_KEY": "sk_snapcut_..." }
    }
  }
}
```

Get a key from [your account page](https://snappedcut.com/account).

## Tools

| | |
| --- | --- |
| `export_presets` | The presets `cloud_render` accepts, with their sizes. **Needs no key.** |
| `account` | Credits left and the current price list. |
| `cloud_render` | Render a bundle on our servers. Costs credits. With `out`, waits and saves the file. |
| `job_status` | Check a render queued earlier. |
| `list_operations` | Every operation, its parameters and prices, and the presets. |
| `upload_asset` | Upload a local media file or bundle; returns an asset id (kept 7 days). |
| `render_design` | Render a declarative design, to one or several `outputs`. Costs credits. `idempotencyKey` makes a retry free. With `out`, waits and saves the first output. |
| `batch_render` | One design, many `vars`, up to 100 renders in one call. |
| `compile_design` | Check a design without rendering or spending anything. |
| `run_tool` | Run a free micro-tool over local files (uploaded for you) or asset ids. |
| `download_output` | Save a finished job's output; `index` picks one of several. |
| `get_usage` | Renders and credits, grouped by day, week, month, endUser, key or operation. |
| `list_storage_destinations` / `test_storage_destination` | Saved S3-compatible buckets, and a write test. |
| `list_webhooks` / `webhook_deliveries` | Webhook endpoints, and recent deliveries to one. |

## The model cannot set the price

No tool takes a duration, deliberately. The server reads the timeline
out of the bundle's own `project.json` and prices on that — a duration supplied
by the caller would be a price supplied by the caller, and the caller here is a
language model. What it cost comes back in the result.

A render that fails server-side is **already refunded** by the time the tool
reports it.

## Nothing spends credits by accident

`export_presets` answers without a key. Every tool that can spend money asks for
`SNAPCUT_KEY` at the moment it is called and fails with a readable message if it
is missing — the server does not exit at startup, because a process that exits
cannot tell a client why.

Tool failures come back as `isError` results the model can read and recover
from, not as protocol errors that kill the turn.

## What this does not do

**It does not edit video.** Decode, cut, filter and encode run in a browser on
WebCodecs, on the viewer's own machine — an MCP server in Node cannot do that,
and this one does not pretend to. It drives the parts that run on our
machines: the render and tool queue.

Headless local rendering — driving the real editor in a browser — lives in the
main repository rather than here, because it needs the app and a browser, not a
package.

## Options

`--base <url>` or `SNAPCUT_BASE` for a self-hosted install. Defaults to
`https://snappedcut.com`.

MIT

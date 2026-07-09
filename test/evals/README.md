# Evals

Codegen evaluation suite for the Payload CMS skill (`tools/claude-plugin/skills/payload/`).

## Variants

Three orthogonal knobs select what runs (defaults: direct LLM, skill on):

| Knob          | Values                 | Default | Selects                                             |
| ------------- | ---------------------- | ------- | --------------------------------------------------- |
| `EVAL_RUNNER` | `llm` · `claude-code`  | `llm`   | harness — direct AI-SDK call vs the Claude Code CLI |
| `EVAL_SKILL`  | `on` · `off`           | `on`    | whether the Payload skill is provided               |
| `EVAL_MODEL`  | a model id (see below) | —       | runner model override                               |

`EVAL_MODEL` is interpreted per runner, and overrides only the **runner** (the LLM scorer keeps its own default):

- `llm` — a key from `models.ts` (e.g. `anthropic:claude-sonnet-4-6`, `openai:gpt-5.2`). Unset -> key-based default (OpenAI when `OPENAI_API_KEY` is set, else Anthropic).
- `claude-code` — a bare `claude --model` name (e.g. `claude-opus-4-6`). Unset -> `claude-opus-4-6`.

The skill is delivered per harness: system-prompt injection for `llm`, embedded in the workdir's `.claude/skills/` for `claude-code`.

The `claude-code` runner requires the `claude` CLI on `PATH` and sandboxes it via a fresh `CLAUDE_CONFIG_DIR` so your user-level `CLAUDE.md`, skills, and settings are never visible to the agent. It authenticates in two steps, automatically:

1. **API key (default):** uses `ANTHROPIC_API_KEY` (or a copied `~/.claude/.credentials.json`) in a per-run temp sandbox — the original path, unchanged.
2. **OAuth fallback:** if step 1 is rejected — e.g. a managed-settings org pin that requires first-party login and refuses API keys — it falls back to a **persistent, isolated** config dir in your user config (`~/.config/payload-evals/claude-code`, outside the repo) whose OAuth session you seed **once** (the API key is stripped from the subprocess in this mode):

   ```bash
   CLAUDE_CONFIG_DIR="${XDG_CONFIG_HOME:-$HOME/.config}/payload-evals/claude-code" claude auth login --console
   # (use --sso or --claudeai instead, to match how your org logs in)
   ```

   The runner prints this exact command (with the resolved path) when the fallback is needed.

If neither works, the runner fails with the exact fix (set `ANTHROPIC_API_KEY` or run the login above).

## Running

`pnpm test:eval` is a single launcher ([cli.ts](cli.ts)). With no flags it shows
an interactive picker (runner -> skill -> suite -> model); pass flags to skip the
prompts:

```bash
pnpm test:eval                                          # interactive picker
pnpm test:eval --runner=llm --skill=on --suite=collections
pnpm test:eval --suite=fields --model=anthropic:claude-opus-4-8
pnpm test:eval --runner=claude-code --skill=off --suite=all
pnpm test:eval --suite=config --rerun -t cors-serverurl
pnpm test:eval --help
```

Suites: `all` (default), `collections`, `fields`, `config`, `mcp`, `negative`,
`official-plugins`, `building-plugins`. Each flag maps to the matching env var
below; any flag you omit is prompted for in a TTY, or defaulted in CI
(`runner=llm`, `skill=on`, `suite=all`). The launcher is just a front-end —
setting `EVAL_RUNNER` / `EVAL_SKILL` / `EVAL_MODEL` directly works too.

## Reusing previous results

By default, evals with identical parameters reuse their latest completed result
instead of running again. The CLI let you choose whether to skip these
cases or rerun all selected cases.

Use `--rerun` or set `EVAL_RERUN=true` to always run every selected case.

## Required env vars

- `OPENAI_API_KEY` **or** `ANTHROPIC_API_KEY` — at least one is required. Both the runner and the LLM scorer default to OpenAI models when `OPENAI_API_KEY` is set, and otherwise fall back to Anthropic (`claude-sonnet-4-6` runner, `claude-haiku-4-5` scorer).
- The `claude-code` runner uses `ANTHROPIC_API_KEY` by default; if that's rejected (e.g. an org OAuth pin), it automatically falls back to a one-time login into an isolated sandbox config dir (see Variants above).

## Optional env knobs

- `EVAL_AGENT_CONCURRENCY` — max concurrent agent processes. Default `2`.
- `EVAL_KEEP_WORKDIR=1` — keep the per-case tmpdir for debugging.
- `EVAL_RERUN=true` — run cases even when identical parameters were already evaluated.

## Architecture

See `~/.claude/plans/2026-05-06_ai-evals-agent-runners_agent-eval-runners/2-DESIGN.md`
for the agent-runner design and rationale.

Every dataset row gives the model one starter config and one task. The runner
asks the model to return a complete edited `payload.config.ts`, then verifies it.

```text
agent generates config
-> TypeScript check
-> verify() runs
-> config can check the imported generated config without booting Payload
-> ast can check the TypeScript parser's source-level summary
-> payload.* can boot the generated config and inspect real database state
-> score(...) can ask the LLM scorer for a score
```

TypeScript and `expect` failures stop the case early and score `0`. If `verify`
returns `await score(...)`, that scorer result becomes the final result. If
`verify` passes without calling `score`, the case passes deterministically.

## Writing Evals

Add cases to one of the files in `datasets/`. A case has:

- `category` - dashboard grouping.
- `configPath` - folder under `fixtures/` that contains the starter
  `payload.config.ts` the model edits.
- `input` - the task prompt given to the model.
- `setup` - optional test data setup that runs after Payload boots and before the agent.
- `verify` - the check that runs after the generated config typechecks.

Simple scorer-only case:

```ts
{
  category: 'config',
  configPath: 'config/codegen/cors-serverurl',
  input: 'Allow CORS from "https://myapp.com" and set serverURL.',
  verify: async ({ score }) => {
    return await score('cors contains "https://myapp.com" and serverURL is set correctly')
  },
}
```

Deterministic config checks use `config`. This imports the generated config but
does not boot Payload or connect to the database. Field schemas are flattened by
Payload schema path, so nested fields use keys like `seo.metaTitle` and block
fields use keys like `layout.hero.heading`:

```ts
{
  category: 'collections',
  configPath: 'collections/codegen/posts-title-content',
  input: 'Add a posts collection with title and content fields.',
  verify: async ({
    config: {
      collections: { posts },
    },
    expect,
    score,
  }) => {
    expect(posts).toBeDefined()
    expect(posts?.fields.title).toMatchObject({ required: true, type: 'text' })
    expect(posts?.fields.content).toMatchObject({ type: 'richText' })

    return await score('posts collection has title text and content richText fields')
  },
}
```

The TypeScript parser is still available as `ast` for source-level checks
that should not import/execute the generated config:

```ts
verify: ({ ast, expect }) => {
  expect(ast.collections.some((collection) => collection.slug === 'posts')).toBe(true)
}
```

Runtime checks use `payload`. The first `payload.*` call lazily boots the
generated config with a real Payload Local API. If `payload` is never used,
nothing boots. Runtime evals run in an isolated Payload boot with a freshly
dropped database, so cases should assert the final state and leave cleanup to
the harness.

```ts
{
  category: 'collections',
  configPath: 'collections/runtime/simple-post',
  input: 'Add an onInit hook that creates a seeded post.',
  verify: async ({ expect, payload }) => {
    const { docs } = await payload.find({
      collection: 'posts',
      where: { title: { equals: 'Seeded by runtime eval' } },
    })

    expect(docs).toHaveLength(1)
  },
}
```

You can combine runtime and scorer checks. Runtime failure stops the case with
score `0`; runtime success continues to the scorer:

```text
agent generates config
-> TypeScript check
-> verify()
-> expect(payload result).toHaveLength(1)
-> return await score('expected outcome', payload result)
```

Use this when a case needs both facts: "does the generated config boot and write
the right data?" and "how complete was the result overall?"

### MCP data-operation evals

MCP cases verify outcomes without requiring a particular tool name or input shape. Think of every
case as three distinct phases:

```text
setup (Local API allowed) -> agent (MCP only) -> verify (inspect the outcome)
```

| Phase         | Runs in                          | Purpose                                                                | API and auditing rules                                                                                                                                     |
| ------------- | -------------------------------- | ---------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **1. Setup**  | Parent test process              | Create the exact starting state through `setup()`                      | Local API is allowed. These operations are not part of the agent audit or efficiency score.                                                                |
| **2. Agent**  | Isolated agent and MCP processes | Let the agent perform the requested task                               | Every Payload operation and MCP tool attempt is recorded. Any Payload request whose `req.payloadAPI` is not `MCP` is blocked and makes the case score `0`. |
| **3. Verify** | Parent test process              | Inspect database state, the final response, provenance, and efficiency | Local API reads are available again. Verification activity is not counted as agent activity.                                                               |

The per-case audit environment exists only during the agent phase. Fixture `beforeOperation` hooks
use it to activate the guard, so setup and verification cannot contaminate the agent's operation
counts. Payload operations and completed MCP tool calls are kept in execution order in one
`audit.json` file per case.

Each MCP runtime case gets its own temporary, file-backed SQLite database. File-backed storage lets
setup, the MCP child process, and verification share data without requiring a database server,
while per-case directories let independent agents run concurrently. Each directory, including any
SQLite sidecar files, is removed after verification.

If Claude Code produces no agent event for 90 seconds, the runner kills the process and the case
fails.

`scoreMCPExecution` then requires an audited operation against the expected entity and scores the
complete agent transcript. A non-MCP attempt or missing required operation scores `0`; failed tool
calls, calls beyond the case's allowance, and excess modification attempts reduce the score. Write
cases assert final database state, while read cases additionally assert the final assistant response.

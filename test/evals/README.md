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

- `llm` — a key from `models.ts` (e.g. `anthropic:claude-sonnet-4-6`, `openai:gpt-5.2`). Unset → key-based default (OpenAI when `OPENAI_API_KEY` is set, else Anthropic).
- `claude-code` — a bare `claude --model` name (e.g. `claude-opus-4-6`). Unset → `claude-opus-4-6`.

The skill is delivered per harness: system-prompt injection for `llm`, embedded in the workdir's `.claude/skills/` for `claude-code`.

The `claude-code` runner requires the `claude` CLI on `PATH` and an authenticated session (`claude login` or `ANTHROPIC_API_KEY`). It sandboxes `claude` via a fresh `CLAUDE_CONFIG_DIR`, so your user-level `CLAUDE.md`, skills, and settings are never visible to the agent.

## Running

`pnpm test:eval` is a single launcher ([cli.ts](cli.ts)). With no flags it shows
an interactive picker (runner → skill → suite → model); pass flags to skip the
prompts:

```bash
pnpm test:eval                                          # interactive picker
pnpm test:eval --runner=llm --skill=on --suite=collections
pnpm test:eval --suite=fields --model=anthropic:claude-opus-4-8
pnpm test:eval --runner=claude-code --skill=off --suite=all
pnpm test:eval --suite=config --no-cache -t cors-serverurl
pnpm test:eval --help
```

Suites: `all` (default), `collections`, `fields`, `config`, `negative`,
`official-plugins`, `building-plugins`. Each flag maps to the matching env var
below; any flag you omit is prompted for in a TTY, or defaulted in CI
(`runner=llm`, `skill=on`, `suite=all`). The launcher is just a front-end —
setting `EVAL_RUNNER` / `EVAL_SKILL` / `EVAL_MODEL` directly works too.

## Required env vars

- `OPENAI_API_KEY` **or** `ANTHROPIC_API_KEY` — at least one is required for **all** runs. Both the runner and the LLM scorer default to OpenAI models when `OPENAI_API_KEY` is set, and otherwise fall back to Anthropic (`claude-sonnet-4-6` runner, `claude-haiku-4-5` scorer).
- `ANTHROPIC_API_KEY` — additionally required for the `claude-code` runner (`EVAL_RUNNER=claude-code`), unless you've run `claude login` (the runner falls back to copying your `~/.claude/.credentials.json` into the sandbox).

## Optional env knobs

- `EVAL_AGENT_CONCURRENCY` — max concurrent agent processes. Default `2`.
- `EVAL_KEEP_WORKDIR=1` — keep the per-case tmpdir for debugging.
- `EVAL_NO_CACHE=true` — bypass result cache reads.

## Architecture

See `~/.claude/plans/2026-05-06_ai-evals-agent-runners_agent-eval-runners/2-DESIGN.md`
for the agent-runner design and rationale.

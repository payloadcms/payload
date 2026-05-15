# Evals

Codegen evaluation suite for the Payload CMS skill (`tools/claude-plugin/skills/payload/`).

## Variants

Set `EVAL_VARIANT` to switch lanes (default: `skill`):

| Variant                      | Runner          | Skill                      |
| ---------------------------- | --------------- | -------------------------- |
| `skill` (default)            | direct LLM      | injected via system prompt |
| `baseline`                   | direct LLM      | none                       |
| `agent-claude-code`          | Claude Code CLI | embedded in workdir        |
| `agent-claude-code-baseline` | Claude Code CLI | none                       |

Agent lanes require the `claude` CLI on `PATH` and an authenticated session
(`claude login` or `ANTHROPIC_API_KEY`). The runner sandboxes `claude` via a
fresh `CLAUDE_CONFIG_DIR`, so the developer's user-level `CLAUDE.md`, skills,
and settings are never visible to the agent.

## Running

```bash
pnpm test:eval                              # LLM + skill (default)
pnpm test:eval:baseline                     # LLM, no skill
pnpm test:eval:agent                        # agent + skill
pnpm test:eval:agent:baseline               # agent, no skill

pnpm test:eval:collections                  # single suite — see package.json
pnpm test:eval:collections:agent            # single suite, agent + skill
pnpm test:eval:collections:agent:baseline   # single suite, agent, no skill
```

## Required env vars

- `OPENAI_API_KEY` — required for **all** variants. The LLM scorer is OpenAI-based even when the runner is an agent.
- `ANTHROPIC_API_KEY` — required for agent variants. The Claude Code CLI runs inside a sandboxed `CLAUDE_CONFIG_DIR`, so OAuth/keychain auth from your global `~/.claude/` is intentionally not used.

## Optional env knobs

- `EVAL_AGENT_MODEL` — model passed to `claude --model`. Default `claude-opus-4-6`.
- `EVAL_AGENT_CONCURRENCY` — max concurrent agent processes. Default `2`.
- `EVAL_KEEP_WORKDIR=1` — keep the per-case tmpdir for debugging.
- `EVAL_NO_CACHE=true` — bypass result cache reads.

## Architecture

See `~/.claude/plans/2026-05-06_ai-evals-agent-runners_agent-eval-runners/2-DESIGN.md`
for the agent-runner design and rationale.

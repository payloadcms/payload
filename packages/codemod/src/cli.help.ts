export function renderHelp({ command }: { command: string }): string {
  return `Usage:
  ${command} [path] [options]
  ${command} upgrade [run | prompt] [options]

Commands:
  (none)              Run transforms only against [path] (default: cwd)
  upgrade             Detect the project and choose an upgrade target
  upgrade run         Preview and install compatible releases; migrate v3 -> v4 when selected
  upgrade prompt      Print a project-specific upgrade prompt

Transform options:
  --transform <name>  Run a single transform by name
  --list              Print registered transforms
  --dry, --dry-run    Analyze only; write nothing
  --print             Print transformed sources to stdout instead of writing

Upgrade options:
  --agent <name>      Coding agent to hand off to (claude, codex); skips the picker
  --tag <target>      Exact Payload version or dist-tag (required without a terminal)
  --package-manager <name>  Use npm, pnpm, yarn, or bun for installation
  --dry, --dry-run    Preview changes; write and install nothing
  --force             Skip the dirty-git-tree warning
  --yes               Skip upgrade confirmation after preview; still choose a target

General options:
  -h, --help          Show this help
`
}

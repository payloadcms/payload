export function renderHelp({ command }: { command: string }): string {
  return `Usage:
  ${command} [path] [options]
  ${command} upgrade [run | prompt] [options]

Commands:
  (none)              Run transforms only against [path] (default: cwd)
  upgrade             Pick how to run the full v3 -> v4 upgrade
  upgrade run         Bump Payload deps, install, then run transforms in cwd
  upgrade prompt      Print the upgrade orchestration prompt

Transform options:
  --transform <name>  Run a single transform by name
  --list              Print registered transforms
  --dry, --dry-run    Analyze only; write nothing
  --print             Print transformed sources to stdout instead of writing

Upgrade options:
  --agent <name>      Coding agent to hand off to (claude, codex); skips the picker
  --tag <dist-tag>    Dist-tag to resolve Payload versions from
  --dry, --dry-run    Preview changes; write and install nothing
  --force             Skip the dirty-git-tree warning

General options:
  -h, --help          Show this help
`
}

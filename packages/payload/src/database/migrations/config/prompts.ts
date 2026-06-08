import readline from 'readline'

import type { ConfigChange } from './types.js'

function ask(question: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close()
      resolve(answer.trim().toLowerCase())
    })
  })
}

export async function resolvePrompts(
  changes: ConfigChange[],
  isTTY = process.stdout.isTTY,
): Promise<{ shouldAbort: boolean }> {
  for (const change of changes) {
    if (change.type === 'drafts_enabled') {
      if (isTTY) {
        const answer = await ask(
          `\n[payload migrate] Drafts enabled for "${change.slug}".\nHow should existing documents be treated? [published/draft] (default: draft): `,
        )
        change.initialStatus = answer === 'published' ? 'published' : 'draft'
      } else {
        change.initialStatus = 'draft'
        console.info(
          `[payload migrate] No TTY — defaulting existing "${change.slug}" docs to _status: 'draft'`,
        )
      }
    }

    if (change.type === 'locale_removed' || change.type === 'versions_disabled') {
      if (isTTY) {
        const answer = await ask(
          `\n[payload migrate] WARNING: "${change.type}" for "${(change as any).slug ?? (change as any).locale}" is destructive. Continue? [y/N]: `,
        )
        if (answer !== 'y') {
          console.error('[payload migrate] Aborted.')
          return { shouldAbort: true }
        }
      } else {
        if (!process.env.PAYLOAD_FORCE_DESTRUCTIVE_MIGRATION) {
          console.error(
            `[payload migrate] Destructive change "${change.type}" requires explicit confirmation. ` +
              `Set PAYLOAD_FORCE_DESTRUCTIVE_MIGRATION=true to proceed non-interactively.`,
          )
          return { shouldAbort: true }
        }
      }
    }
  }

  return { shouldAbort: false }
}

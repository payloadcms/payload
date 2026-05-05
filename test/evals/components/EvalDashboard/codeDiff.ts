import { structuredPatch } from 'diff'
import { getSingletonHighlighter, type Highlighter } from 'shiki'

export type RenderedCode = {
  added?: number
  html: string
  mode: 'diff' | 'file'
  removed?: number
}

const THEMES = { dark: 'github-dark', light: 'github-light' } as const
const LANG = 'typescript'

let highlighterPromise: null | Promise<Highlighter> = null

function getHighlighter(): Promise<Highlighter> {
  if (!highlighterPromise) {
    highlighterPromise = getSingletonHighlighter({
      langs: [LANG],
      themes: [THEMES.light, THEMES.dark],
    })
  }
  return highlighterPromise
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function fallback(text: string, mode: 'diff' | 'file'): RenderedCode {
  return {
    html: `<pre class="eval-diff eval-diff--fallback"><code>${escapeHtml(text)}</code></pre>`,
    mode,
  }
}

/**
 * Highlights a single line of TypeScript and returns the inner spans of Shiki's
 * single-line `<pre><code><span class="line">…</span></code></pre>` output.
 */
function highlightLine(line: string, highlighter: Highlighter): string {
  if (line === '') {
    return '&nbsp;'
  }
  const html = highlighter.codeToHtml(line, { lang: LANG, themes: THEMES })
  const match = html.match(/<span class="line">([\s\S]*?)<\/span><\/code>/)
  return match?.[1] ?? escapeHtml(line)
}

export async function renderCodegenFile({ modified }: { modified: string }): Promise<RenderedCode> {
  try {
    const highlighter = await getHighlighter()
    const html = highlighter.codeToHtml(modified, { lang: LANG, themes: THEMES })
    return { html: `<div class="eval-diff eval-diff--file">${html}</div>`, mode: 'file' }
  } catch {
    return fallback(modified, 'file')
  }
}

export async function renderCodegenDiff({
  modified,
  starter,
}: {
  modified: string
  starter: string
}): Promise<RenderedCode> {
  try {
    const highlighter = await getHighlighter()
    const patch = structuredPatch('starter', 'modified', starter, modified, '', '', { context: 3 })

    let added = 0
    let removed = 0
    const rows: string[] = []

    for (const hunk of patch.hunks) {
      rows.push(
        `<div class="eval-diff__hunk-header">@@ -${hunk.oldStart},${hunk.oldLines} +${hunk.newStart},${hunk.newLines} @@</div>`,
      )
      let oldLine = hunk.oldStart
      let newLine = hunk.newStart
      for (const raw of hunk.lines) {
        const marker = raw[0]
        const text = raw.slice(1)
        const highlighted = highlightLine(text, highlighter)
        if (marker === '+') {
          added++
          rows.push(
            `<div class="eval-diff__line" data-line="add"><span class="eval-diff__num">${newLine}</span><span class="eval-diff__marker">+</span><span class="eval-diff__code">${highlighted}</span></div>`,
          )
          newLine++
        } else if (marker === '-') {
          removed++
          rows.push(
            `<div class="eval-diff__line" data-line="del"><span class="eval-diff__num">${oldLine}</span><span class="eval-diff__marker">-</span><span class="eval-diff__code">${highlighted}</span></div>`,
          )
          oldLine++
        } else {
          rows.push(
            `<div class="eval-diff__line" data-line="context"><span class="eval-diff__num">${newLine}</span><span class="eval-diff__marker">&nbsp;</span><span class="eval-diff__code">${highlighted}</span></div>`,
          )
          oldLine++
          newLine++
        }
      }
    }

    return {
      added,
      html: `<div class="eval-diff"><pre><code>${rows.join('')}</code></pre></div>`,
      mode: 'diff',
      removed,
    }
  } catch {
    return fallback(`--- starter\n+++ modified\n${modified}`, 'diff')
  }
}

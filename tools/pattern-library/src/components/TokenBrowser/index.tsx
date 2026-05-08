import './index.css'
import { useEffect, useState } from 'react'

type TokenGroup = {
  label: string
  prefix: string
  tokens: TokenEntry[]
}

type TokenEntry = {
  name: string
  value: string
}

const TOKEN_GROUPS: { label: string; prefix: string }[] = [
  { label: 'Background', prefix: '--bg-' },
  { label: 'Text', prefix: '--text-' },
  { label: 'Border', prefix: '--border-' },
  { label: 'Icon', prefix: '--icon-' },
  { label: 'Color Palette', prefix: '--color-' },
  { label: 'Spacing', prefix: '--spacer-' },
  { label: 'Radius', prefix: '--radius-' },
  { label: 'Elevation', prefix: '--elevation-' },
]

const CATEGORY_PREFIXES: Record<string, string[]> = {
  colors: [
    '--bg-',
    '--border-',
    '--icon-',
    '--text-',
    '--special-',
    '--fullscreen-',
    '--multiplayer-',
  ],
  elevations: ['--elevation-'],
  palette: ['--color-'],
  radius: ['--radius-'],
  spacing: ['--spacer-'],
  typography: ['--font-family-', '--text-body-', '--text-heading-', '--text-letter-'],
  utilities: ['--accessibility-'],
}

const PREFIX_LABELS: Record<string, string> = {
  '--accessibility-': 'Accessibility',
  '--bg-': 'Background',
  '--border-': 'Border',
  '--color-': 'Color Palette',
  '--elevation-': 'Elevation',
  '--font-family-': 'Font Families',
  '--fullscreen-': 'Fullscreen',
  '--icon-': 'Icon',
  '--multiplayer-': 'Multiplayer',
  '--radius-': 'Radius',
  '--spacer-': 'Spacing',
  '--special-': 'Special',
  '--text-': 'Text',
  '--text-body-': 'Body Text',
  '--text-heading-': 'Heading Text',
  '--text-letter-': 'Letter Spacing',
}

function readTokensByPrefix(prefix: string): TokenEntry[] {
  const style = getComputedStyle(document.documentElement)
  const tokens: TokenEntry[] = []

  for (const prop of style) {
    if (prop.startsWith(prefix)) {
      tokens.push({ name: prop, value: style.getPropertyValue(prop).trim() })
    }
  }

  return tokens.sort((a, b) => a.name.localeCompare(b.name))
}

function isColorValue(value: string): boolean {
  return (
    value.startsWith('#') ||
    value.startsWith('rgb') ||
    value.startsWith('hsl') ||
    value.startsWith('oklch') ||
    value.startsWith('color(')
  )
}

export function TokenBrowser({ category }: { category: null | string }) {
  const [groups, setGroups] = useState<TokenGroup[]>([])

  useEffect(() => {
    const activePrefixes = category ? CATEGORY_PREFIXES[category] : null

    const groupsToLoad = activePrefixes
      ? activePrefixes.map((prefix) => ({ label: PREFIX_LABELS[prefix] ?? prefix, prefix }))
      : TOKEN_GROUPS

    const loaded = groupsToLoad
      .map(({ label, prefix }) => ({
        label,
        prefix,
        tokens: readTokensByPrefix(prefix),
      }))
      .filter((g) => g.tokens.length > 0)

    setGroups(loaded)
  }, [category])

  return (
    <div className="token-browser">
      <h2 className="token-browser__heading">Design Tokens</h2>
      {groups.map((group) => (
        <section className="token-browser__group" key={group.prefix}>
          <h3 className="token-browser__group-title">{group.label}</h3>
          <div className="token-browser__grid">
            {group.tokens.map((token) => (
              <div className="token-browser__entry" key={token.name}>
                {isColorValue(token.value) && (
                  <div className="token-browser__swatch" style={{ backgroundColor: token.value }} />
                )}
                <div className="token-browser__meta">
                  <code className="token-browser__name">{token.name}</code>
                  <span className="token-browser__value">{token.value}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}

const WORKSPACE_FILE = 'pnpm-workspace.yaml'
const NOT_ALLOWED_SUFFIX = '(only dependency versions in the audit plan may change)'
const TRUST_NOTE =
  '> The table above comes from the diff. The section below is agent analysis. Check it before you trust it.'

const DEPENDENCY_SECTIONS = [
  'dependencies',
  'devDependencies',
  'peerDependencies',
  'optionalDependencies',
]

// Plain semver ranges and dist-tags only: no `/`, `:`, `#` or leading `.`, so no git, URL, or path specs.
const SEMVER_RANGE_PATTERN = /^[0-9A-Za-z^~<>=*][0-9A-Za-z.+\-^~<>=|* ]*$/
const CATALOG_SPEC_PATTERN = /^catalog:[\w-]*$/
const WORKSPACE_SPEC_PATTERN = /^workspace:[0-9A-Za-z.+\-^~<>=|* ]*$/
const NPM_ALIAS_SPEC_PATTERN = /^npm:(?<aliasName>(?:@[\w.-]+\/)?[\w.-]+)@(?<range>.+)$/

const TOP_LEVEL_KEY_PATTERN = /^[^\s#]/
// One `  <key>: <value>` scalar per line, printable ASCII only. Quoted forms exclude escapes,
// so the raw text is the value.
const SCALAR_ENTRY_PATTERN =
  /^ {2}(?:'(?<singleKey>(?:(?!['\\`])[\x20-\x7e])*)'|"(?<doubleKey>(?:(?!["\\`])[\x20-\x7e])*)"|(?<bareKey>\w[\w./@>-]*)): +(?<rawValue>'(?:(?!['\\`])[\x20-\x7e])*'|"(?:(?!["\\`])[\x20-\x7e])*"|[0-9A-Za-z^=<](?:(?![#'"`:,[\]{}\\])[\x21-\x7e])*)(?<comment> +#.*)?$/

const NPM_NAME_SOURCE = String.raw`(?:@[a-z0-9][\w.-]*\/)?[a-z0-9][\w.-]*`
// A `>` inside a range must follow ` `, `|` or `@`; pnpm splits parent>child at any other `>`.
const SELECTOR_RANGE_SOURCE = String.raw`(?:[0-9A-Za-z.+\-^~<=*| ]|(?<=[ |@])>)+`
const OVERRIDE_SELECTOR_PATTERN = new RegExp(
  `^(?:${NPM_NAME_SOURCE}(?:@${SELECTOR_RANGE_SOURCE})?(?<![ |@])>)?(?<targetName>${NPM_NAME_SOURCE})(?:@${SELECTOR_RANGE_SOURCE})?$`,
)

const SAFE_PATH_SEGMENT_PATTERN = /^[\w@./>-]+$/
const SAFE_TABLE_CELL_PATTERN = /^(?:(?![`\\])[\x20-\x7e])+$/
const ADVISORY_ID_PATTERN = /^GHSA(?:-[0-9a-z]{4}){3}$/

/**
 * Dependency names that a patch may change. On `monorepo` scope, relock modules and
 * vulnerable finding packages are included because overrides target the vulnerable module.
 */
export function selectAllowedDependencies({ report, scope }) {
  const isMonorepo = scope === 'monorepo'
  const names = new Set()
  const majors = new Set()

  for (const action of report.plan.actions) {
    if (action.type === 'bump') {
      names.add(action.dependency)
      if (action.crossesMajor === true) {
        majors.add(action.dependency)
      }
    }

    if (action.type === 'relock' && isMonorepo) {
      names.add(action.module)
    }
  }

  if (isMonorepo) {
    for (const finding of report.findings) {
      names.add(finding.package)
    }
  }

  return { majors, names }
}

/**
 * Compares two package.json texts by parsed value. The only allowed difference is a changed
 * string version of an existing, planned key in a dependency section; anything else is a violation.
 */
export function diffManifest({ after, allowed, before, file, majors }) {
  const changes = []
  const violations = []

  let beforeManifest
  let afterManifest
  try {
    beforeManifest = JSON.parse(before)
    afterManifest = JSON.parse(after)
  } catch {
    return { changes, violations: [`${file}: not valid JSON`] }
  }

  let afterWithoutDependencies = afterManifest

  if (isPlainObject(beforeManifest) && isPlainObject(afterManifest)) {
    for (const section of DEPENDENCY_SECTIONS) {
      const beforeSection = beforeManifest[section]
      const afterSection = afterManifest[section]

      if (!isPlainObject(beforeSection) || !isPlainObject(afterSection)) {
        continue
      }

      const sectionResult = diffDependencySection({
        after: afterSection,
        allowed,
        before: beforeSection,
        file,
        majors,
        section,
      })
      changes.push(...sectionResult.changes)
      violations.push(...sectionResult.violations)

      // Spreading keeps the key's position, so the remaining diff still sees key order changes.
      afterWithoutDependencies = { ...afterWithoutDependencies, [section]: beforeSection }
    }
  }

  for (const { kind, path } of findDifferences({
    after: afterWithoutDependencies,
    before: beforeManifest,
    path: [],
  })) {
    violations.push(formatViolation({ file, kind, path: formatPath({ segments: path }) }))
  }

  return { changes, violations }
}

/**
 * Line-based diff of pnpm-workspace.yaml. Top-level sections must keep the same keys in the same
 * order, and each section must be byte-identical except `catalog` (and `overrides` on `monorepo`),
 * where only planned `  <key>: <value>` scalar entries may change.
 */
export function diffWorkspaceYaml({ after, allowed, before, majors, scope }) {
  const beforeSections = splitTopLevelSections({ text: before })
  const afterSections = splitTopLevelSections({ text: after })
  const editableSections = scope === 'monorepo' ? ['catalog', 'overrides'] : ['catalog']

  const beforeKeys = beforeSections.map((section) => section.key)
  const afterKeys = afterSections.map((section) => section.key)
  if (!isSameSequence({ after: afterKeys, before: beforeKeys })) {
    return {
      changes: [],
      violations: [
        formatViolation({ file: WORKSPACE_FILE, kind: 'changed', path: 'top-level keys' }),
      ],
    }
  }

  const changes = []
  const violations = []

  beforeSections.forEach((beforeSection, index) => {
    const afterSection = afterSections[index]
    if (
      formatSectionText({ section: beforeSection }) === formatSectionText({ section: afterSection })
    ) {
      return
    }

    const { key } = afterSection
    const isEditable =
      editableSections.includes(key) &&
      beforeSection.header === `${key}:` &&
      afterSection.header === `${key}:`

    if (!isEditable) {
      violations.push(
        formatViolation({ file: WORKSPACE_FILE, kind: 'changed', path: key ?? '(preamble)' }),
      )
      return
    }

    const sectionResult = diffScalarSection({
      after: afterSection,
      allowed,
      before: beforeSection,
      majors,
    })
    changes.push(...sectionResult.changes)
    violations.push(...sectionResult.violations)
  })

  return { changes, violations }
}

export function renderChangeTable({ advisories, changes }) {
  const rows = [...changes]
    .sort(
      (left, right) => left.file.localeCompare(right.file) || left.name.localeCompare(right.name),
    )
    .map(({ file, from, isMajor, name, to }) => {
      const fromCell = from === null ? '(new)' : formatCode({ value: from })
      const toCell = isMajor ? `${formatCode({ value: to })} **major**` : formatCode({ value: to })

      return `| ${formatCode({ value: name })} | ${fromCell} | ${toCell} | ${formatCode({ value: file })} |`
    })

  const advisoryLinks = [...new Set(advisories)].sort().map((advisory) => {
    if (!ADVISORY_ID_PATTERN.test(advisory)) {
      throw new Error(
        `invalid advisory id in change table: ${formatPath({ segments: [advisory] })}`,
      )
    }

    return `[${advisory}](https://github.com/advisories/${advisory})`
  })

  return [
    '| Package | From | To | File |',
    '| --- | --- | --- | --- |',
    ...rows,
    '',
    `Fixes: ${advisoryLinks.join(', ')}`,
    '',
    TRUST_NOTE,
  ].join('\n')
}

function diffDependencySection({ after, allowed, before, file, majors, section }) {
  const changes = []
  const violations = []
  const addViolation = ({ kind, name }) =>
    violations.push(
      formatViolation({ file, kind, path: formatPath({ segments: [section, name] }) }),
    )

  for (const name of Object.keys(before)) {
    if (!Object.hasOwn(after, name)) {
      addViolation({ kind: 'removed', name })
    }
  }

  for (const name of Object.keys(after)) {
    if (!Object.hasOwn(before, name)) {
      addViolation({ kind: 'added', name })
      continue
    }

    const from = before[name]
    const to = after[name]
    if (findDifferences({ after: to, before: from, path: [] }).length === 0) {
      continue
    }

    if (!allowed.has(name)) {
      violations.push(`${file}: ${formatPath({ segments: [section, name] })} not in audit plan`)
      continue
    }

    const isVersionChange =
      typeof from === 'string' && typeof to === 'string' && isAllowedSpecChange({ from, to })
    if (!isVersionChange) {
      addViolation({ kind: 'changed', name })
      continue
    }

    changes.push({ file, from, isMajor: majors.has(name), name, to })
  }

  if (!hasSameKeyOrder({ after, before })) {
    violations.push(formatViolation({ file, kind: 'changed', path: section }))
  }

  return { changes, violations }
}

/** Every difference between two parsed JSON values, including key order changes. */
function findDifferences({ after, before, path }) {
  if (before === undefined) {
    return [{ kind: 'added', path }]
  }

  if (after === undefined) {
    return [{ kind: 'removed', path }]
  }

  if (isPlainObject(before) && isPlainObject(after)) {
    const keys = [...new Set([...Object.keys(before), ...Object.keys(after)])]
    const differences = keys.flatMap((key) =>
      findDifferences({
        after: Object.hasOwn(after, key) ? after[key] : undefined,
        before: Object.hasOwn(before, key) ? before[key] : undefined,
        path: [...path, key],
      }),
    )

    if (!hasSameKeyOrder({ after, before })) {
      differences.push({ kind: 'changed', path })
    }

    return differences
  }

  if (Array.isArray(before) && Array.isArray(after)) {
    const length = Math.max(before.length, after.length)

    return Array.from({ length }, (_, index) =>
      findDifferences({
        after: after[index],
        before: before[index],
        path: [...path, String(index)],
      }),
    ).flat()
  }

  if (before === after) {
    return []
  }

  return [{ kind: 'changed', path }]
}

function diffScalarSection({ after, allowed, before, majors }) {
  const { key: section } = after
  const parsedBefore = parseScalarSection({ section: before })
  const parsedAfter = parseScalarSection({ section: after })
  const problems = [...new Set([...parsedBefore.problems, ...parsedAfter.problems])]

  if (problems.length > 0) {
    return {
      changes: [],
      violations: problems.map((path) =>
        formatViolation({ file: WORKSPACE_FILE, kind: 'changed', path }),
      ),
    }
  }

  const changes = []
  const violations = []

  if (!isSameSequence({ after: parsedAfter.comments, before: parsedBefore.comments })) {
    violations.push(
      formatViolation({ file: WORKSPACE_FILE, kind: 'changed', path: `${section} comment` }),
    )
  }

  for (const name of parsedBefore.entries.keys()) {
    if (!parsedAfter.entries.has(name)) {
      violations.push(
        formatViolation({
          file: WORKSPACE_FILE,
          kind: 'removed',
          path: formatPath({ segments: [section, name] }),
        }),
      )
    }
  }

  for (const [name, afterEntry] of parsedAfter.entries) {
    const beforeEntry = parsedBefore.entries.get(name) ?? null
    const isUnchanged =
      beforeEntry?.rawValue === afterEntry.rawValue && beforeEntry?.comment === afterEntry.comment
    if (isUnchanged) {
      continue
    }

    const result = classifyScalarEntry({ afterEntry, allowed, beforeEntry, majors, name, section })
    if (result.violation) {
      violations.push(result.violation)
      continue
    }

    changes.push(result.change)
  }

  return { changes, violations }
}

function classifyScalarEntry({ afterEntry, allowed, beforeEntry, majors, name, section }) {
  const path = formatPath({ segments: [section, name] })
  const kind = beforeEntry ? 'changed' : 'added'
  const violation = formatViolation({ file: WORKSPACE_FILE, kind, path })

  if (!beforeEntry && section === 'catalog') {
    return { violation }
  }

  const isNonVersionChange =
    beforeEntry &&
    (beforeEntry.comment !== afterEntry.comment || beforeEntry.value === afterEntry.value)
  if (isNonVersionChange) {
    return { violation }
  }

  const target = section === 'overrides' ? findOverrideTarget({ key: name }) : name
  if (target === null) {
    return { violation }
  }

  if (!allowed.has(target)) {
    return { violation: `${WORKSPACE_FILE}: ${path} not in audit plan` }
  }

  const from = beforeEntry?.value ?? null
  if (!isAllowedSpecChange({ from, to: afterEntry.value })) {
    return { violation }
  }

  return {
    change: { file: WORKSPACE_FILE, from, isMajor: majors.has(target), name, to: afterEntry.value },
  }
}

function parseScalarSection({ section }) {
  const entries = new Map()
  const comments = []
  const problems = []

  for (const { line, lineNumber } of section.bodyLines) {
    if (line.trim() === '') {
      continue
    }

    if (line.trimStart().startsWith('#')) {
      comments.push(line)
      continue
    }

    const match = SCALAR_ENTRY_PATTERN.exec(line)
    if (!match) {
      problems.push(`${section.key} (line ${lineNumber})`)
      continue
    }

    const { bareKey, comment = '', doubleKey, rawValue, singleKey } = match.groups
    const name = singleKey ?? doubleKey ?? bareKey
    if (entries.has(name)) {
      problems.push(formatPath({ segments: [section.key, name] }))
      continue
    }

    entries.set(name, { comment, rawValue, value: unquote({ rawValue }) })
  }

  return { comments, entries, problems }
}

/** Sections start at each column-0 line; lines before the first key form a keyless preamble. */
function splitTopLevelSections({ text }) {
  const sections = [{ bodyLines: [], header: null, key: null }]

  text.split('\n').forEach((line, index) => {
    if (TOP_LEVEL_KEY_PATTERN.test(line)) {
      sections.push({ bodyLines: [], header: line, key: line.split(':')[0] })
      return
    }

    sections.at(-1).bodyLines.push({ line, lineNumber: index + 1 })
  })

  return sections
}

/**
 * The package an override key targets, parsed with the same parent>child split pnpm uses.
 * Returns null for any key outside the `[parent[@range]>]name[@range]` grammar.
 */
function findOverrideTarget({ key }) {
  return OVERRIDE_SELECTOR_PATTERN.exec(key)?.groups.targetName ?? null
}

/**
 * A spec change is allowed only between the same protocol, and an npm alias must keep its
 * target package. A new entry (`from` null) must be a plain range.
 */
function isAllowedSpecChange({ from, to }) {
  const target = parseSpec({ spec: to })
  if (!target) {
    return false
  }

  if (from === null) {
    return target.protocol === 'semver'
  }

  const source = parseSpec({ spec: from })

  return source?.protocol === target.protocol && source.aliasName === target.aliasName
}

function parseSpec({ spec }) {
  if (SEMVER_RANGE_PATTERN.test(spec)) {
    return { aliasName: null, protocol: 'semver' }
  }

  if (CATALOG_SPEC_PATTERN.test(spec)) {
    return { aliasName: null, protocol: 'catalog' }
  }

  if (WORKSPACE_SPEC_PATTERN.test(spec)) {
    return { aliasName: null, protocol: 'workspace' }
  }

  const aliasMatch = NPM_ALIAS_SPEC_PATTERN.exec(spec)
  if (aliasMatch && SEMVER_RANGE_PATTERN.test(aliasMatch.groups.range)) {
    return { aliasName: aliasMatch.groups.aliasName, protocol: 'npm' }
  }

  return null
}

function formatViolation({ file, kind, path }) {
  return `${file}: ${path} ${kind} ${NOT_ALLOWED_SUFFIX}`
}

/**
 * Untrusted keys with unusual characters are JSON-quoted, with `<`, `>` and non-printable-ASCII
 * escaped, so they cannot inject markers or markup into logs or comments.
 */
function formatPath({ segments }) {
  if (segments.length === 0) {
    return '(root)'
  }

  return segments
    .map((segment) => {
      if (SAFE_PATH_SEGMENT_PATTERN.test(segment)) {
        return segment
      }

      return JSON.stringify(segment).replace(
        /[^\x20-\x3b\x3d\x3f-\x7e]/g,
        (character) => `\\u${character.charCodeAt(0).toString(16).padStart(4, '0')}`,
      )
    })
    .join('.')
}

/**
 * The table is trusted output, so it throws on any cell that could break out of its code span,
 * its row, or carry a hidden marker. Escaped `|` stays literal in GFM tables, even in code spans.
 */
function formatCode({ value }) {
  const isSafe =
    typeof value === 'string' &&
    SAFE_TABLE_CELL_PATTERN.test(value) &&
    !value.includes('<!--') &&
    !value.includes('-->')

  if (!isSafe) {
    throw new Error(`unsafe value in change table: ${formatPath({ segments: [String(value)] })}`)
  }

  return `\`${value.replaceAll('|', '\\|')}\``
}

function formatSectionText({ section }) {
  const bodyText = section.bodyLines.map(({ line }) => line)

  if (section.header === null) {
    return bodyText.join('\n')
  }

  return [section.header, ...bodyText].join('\n')
}

function unquote({ rawValue }) {
  if (rawValue.startsWith("'") || rawValue.startsWith('"')) {
    return rawValue.slice(1, -1)
  }

  return rawValue
}

function hasSameKeyOrder({ after, before }) {
  const sharedBeforeKeys = Object.keys(before).filter((key) => Object.hasOwn(after, key))
  const sharedAfterKeys = Object.keys(after).filter((key) => Object.hasOwn(before, key))

  return isSameSequence({ after: sharedAfterKeys, before: sharedBeforeKeys })
}

function isSameSequence({ after, before }) {
  return before.length === after.length && before.every((value, index) => value === after[index])
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

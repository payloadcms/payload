import { createHash } from 'node:crypto'

/** Final reports must retain the full warm sample groups, including both graph layers. */
export const hasFinalPerformanceSamples = ({ report }) => {
  const methods = [
    'current-drafts-native',
    'branch-native',
    'branch-guarded-core',
    'published-native',
  ]
  const graphMethods = ['current-drafts-native-raw-graph', 'branch-guarded-core-raw-graph']
  const valid = (measurement) =>
    Number.isSafeInteger(measurement?.iterations) &&
    measurement.iterations >= 40 &&
    Array.isArray(measurement.samples) &&
    measurement.samples.length === measurement.iterations &&
    measurement.samples.every((sample) => Number.isFinite(sample) && sample >= 0)
  const workloads = report.gate?.map(({ workload }) => workload) ?? []
  return (
    workloads.length === 5 &&
    new Set(workloads).size === 5 &&
    workloads.every((workload) =>
      methods.every((method) =>
        valid(
          report.measurements?.find(
            (measurement) => measurement.workload === workload && measurement.method === method,
          ),
        ),
      ),
    ) &&
    graphMethods.every((method) =>
      valid(report.graph?.measurements?.find((measurement) => measurement.method === method)),
    )
  )
}

/** Keep executed counters separate: nested plan nodes and lookup counters overlap. */
export const summarizeNativePlan = ({ adapter, explanation }) => {
  if (adapter === 'sqlite') {
    const details = explanation?.map(({ detail }) => detail).filter(Boolean) ?? []
    return [
      'Actual rows examined: unavailable from SQLite EXPLAIN QUERY PLAN.',
      ...[...new Set(details)].slice(0, 12),
      ...(details.length > 12
        ? [`Plan has ${details.length} entries; representative entries shown.`]
        : []),
    ]
  }
  if (adapter === 'postgres') {
    const document = explanation?.[0]?.['QUERY PLAN']?.[0]
    const root = document?.Plan
    if (!root) return ['Executed PostgreSQL plan unavailable.']
    const nodes = []
    const visit = ({ node }) => {
      nodes.push(node)
      for (const child of node.Plans ?? []) visit({ node: child })
    }
    visit({ node: root })
    const scans = nodes.filter((node) => /Scan/.test(node['Node Type']))
    return [
      `Executed plan nodes: ${[...new Set(nodes.map((node) => node['Node Type']))].join(', ')}.`,
      `Root actual rows/loop: ${value(root['Actual Rows'])}; loops: ${value(root['Actual Loops'])}; execution ms: ${value(document['Execution Time'])}.`,
      `Root inclusive buffers hit/read: ${value(root['Shared Hit Blocks'])}/${value(root['Shared Read Blocks'])}; temp blocks read/written: ${value(root['Temp Read Blocks'])}/${value(root['Temp Written Blocks'])}.`,
      'Rows below are per-loop native counters, not an additive rows-examined total.',
      ...scans
        .slice(0, 12)
        .map(
          (node) =>
            `${node['Node Type']} ${node['Relation Name'] ?? node['CTE Name'] ?? ''}${node['Index Name'] ? ` via ${node['Index Name']}` : ''}: rows/loop ${value(node['Actual Rows'])}, loops ${value(node['Actual Loops'])}, removed by filter/loop ${value(node['Rows Removed by Filter'])}.`,
        ),
      ...(scans.length > 12
        ? [`${scans.length} scan nodes in complete plan; first 12 shown.`]
        : []),
    ]
  }
  if (adapter === 'mongodb' || adapter === 'mongoose') {
    const lines = []
    const stages = new Set()
    const indexes = new Set()
    const visitPlan = ({ node }) => {
      if (!node || typeof node !== 'object') return
      if (node.stage) stages.add(node.stage)
      if (node.indexName) indexes.add(node.indexName)
      for (const [key, child] of Object.entries(node)) {
        if (['rejectedPlans', 'allPlansExecution'].includes(key)) continue
        if (Array.isArray(child)) child.forEach((node) => visitPlan({ node }))
        else if (child && typeof child === 'object') visitPlan({ node: child })
      }
    }
    const cursor = ({ stats, planner, label }) => {
      visitPlan({ node: planner?.winningPlan })
      if (stats)
        lines.push(
          `${label}: docs examined ${value(stats.totalDocsExamined)}, keys examined ${value(stats.totalKeysExamined)}, returned ${value(stats.nReturned)}, execution ms ${value(stats.executionTimeMillis)}.`,
        )
    }
    cursor({
      stats: explanation?.executionStats,
      planner: explanation?.queryPlanner,
      label: 'Root execution',
    })
    for (const [index, stage] of (explanation?.stages ?? []).entries()) {
      if (stage.$cursor)
        cursor({
          stats: stage.$cursor.executionStats,
          planner: stage.$cursor.queryPlanner,
          label: `Cursor stage ${index}`,
        })
      if (stage.$lookup)
        lines.push(
          `Lookup stage ${index} (${stage.$lookup.from ?? 'target unavailable'}): docs examined ${value(stage.totalDocsExamined)}, keys examined ${value(stage.totalKeysExamined)}, collection scans ${value(stage.collectionScans)}, indexes ${stage.indexesUsed?.join(', ') || 'unavailable'}.`,
        )
    }
    return [
      ...(lines.length ? lines : ['Executed MongoDB scan counters unavailable.']),
      `Winning plan stages: ${[...stages].join(', ') || 'unavailable'}; indexes: ${[...indexes].join(', ') || 'unavailable'}.`,
      'Cursor/lookup counters are reported separately and are not summed.',
    ]
  }
  return ['Native plan format unavailable.']
}

export const renderNativeEvidence = ({ entries, sourceDigest }) => {
  const sections = []
  const methods = ['current-drafts-native', 'branch-native', 'published-native']
  const final = entries.filter(
    ({ evidence, report }) =>
      evidence === 'final' &&
      report.environment?.evidence === 'final' &&
      report.environment?.sourceDigest?.value === sourceDigest &&
      report.environment?.isSourceUnchanged === true,
  )
  const representative = []
  for (const adapter of ['mongodb', 'postgres', 'sqlite']) {
    const candidates = final
      .filter((entry) => entry.key.startsWith(`${adapter}-`))
      .sort((a, b) => size(a) - size(b))
    for (const entry of [candidates[0], candidates.at(-1)]) {
      if (entry && !representative.includes(entry)) representative.push(entry)
    }
  }
  representative.push(...entries.filter(({ evidence }) => evidence === 'diagnostic'))
  for (const { key, report, evidence, reportSHA256 } of representative) {
    const environment = report.environment ?? {}
    const isFinal = evidence === 'final'
    const source = environment.sourceDigest?.value ?? 'unavailable (predates source pinning)'
    const measurements = report.measurements ?? []
    const adapter = key.split('-')[0]
    const details = []
    if (report.graph) {
      details.push(
        `Raw graph: ${report.graph.coordinates ?? 'unavailable'} logical coordinates at depth ${report.graph.depth ?? 'unavailable'} (not a native rows-examined counter). ${report.graph.measurements?.map((measurement) => `${measurement.method}: ${value(measurement.calls)} native commands, p50/p95 ${value(measurement.p50)}/${value(measurement.p95)} ms`).join('; ') || 'Timing/command details unavailable'}. Executed graph-plan scan counters were not captured; the raw report retains its native statements. Scalar native explanations follow.\n`,
      )
    }
    for (const measurement of measurements) {
      if (!methods.includes(measurement.method)) continue
      // Historical failures illustrate the two earlier native bottlenecks without a forensic dump.
      if (
        !isFinal &&
        !['range-page-and-total', 'relationship-predicate'].includes(measurement.workload)
      )
        continue
      const plans = measurement.plans ?? []
      details.push(
        `### ${measurement.workload} / ${measurement.method}\n\nCalls: ${value(measurement.calls)}. Warm p50/p95: ${value(measurement.p50)}/${value(measurement.p95)} ms. Returned/total: ${value(measurement.returnedDocuments)}/${value(measurement.totalDocs)}.\n`,
      )
      if (!plans.length)
        details.push('Native explanation unavailable for this captured operation.\n')
      for (const [index, plan] of plans.entries()) {
        const statement = plan.statement?.sql ?? JSON.stringify(plan.statement?.pipeline ?? null)
        const fingerprint = createHash('sha256').update(statement).digest('hex')
        details.push(
          `Statement ${index + 1} SHA-256: \`${fingerprint}\`.\n\n${summarizeNativePlan({
            adapter,
            explanation: plan.explanation,
          })
            .map((line) => `- ${line}`)
            .join('\n')}\n`,
        )
      }
    }
    sections.push(
      `## ${key} — ${isFinal ? 'final representative' : 'historical diagnostic; never final coverage'}\n\nReport SHA-256: \`${reportSHA256}\`. Implementation source SHA-256: \`${source}\`. Node ${environment.node ?? 'unavailable'}; ${environment.platform ?? 'unavailable'}/${environment.architecture ?? 'unavailable'}; database version ${environment.databaseVersion ?? 'not recorded in this historical report'}.\n\n${report.error ? `Captured failure: ${String(report.error.message).replaceAll('\n', ' ')}\n\n` : ''}${details.join('\n')}`,
    )
  }
  return `Written with AI\n\n# Representative native execution evidence\n\nCurrent implementation/harness SHA-256: \`${sourceDigest}\`. Final representatives select the smallest and largest available measured scenario per adapter; this is a plan sample, not full matrix approval. Only unchanged-source final reports count in [RESULTS.md](./RESULTS.md). Explicitly supplied historical diagnostics below retain their original failure status and cannot establish current performance.\n\nThese are compact summaries of actual captured native explanations, not compiler predictions. Statement and raw-report fingerprints tie summaries to the retained JSON; full SQL/pipelines, plans, samples and CPU profiles stay in the documented local artifact directory. Missing counters are labeled unavailable. PostgreSQL node counters overlap, and SQLite exposes no runtime rows-examined counter.\n\n${sections.length ? sections.join('\n') : 'No representative native plans have been supplied for publication. Final matrix coverage remains pending.\n'}`
}

const value = (number) =>
  Number.isFinite(number)
    ? Number.isInteger(number)
      ? String(number)
      : number.toFixed(3)
    : 'unavailable'
const size = ({ report }) =>
  report.scenario.documents * (report.scenario.branches + 1) * report.scenario.locales

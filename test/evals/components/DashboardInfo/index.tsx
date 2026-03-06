import React from 'react'

export function DashboardInfo() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'calc(var(--base) * 1.5)',
        marginBottom: 'calc(var(--base) * 2)',
      }}
    >
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 700, margin: '0 0 6px' }}>Eval Dashboard</h1>
        <p style={{ color: 'var(--theme-elevation-500)', fontSize: '0.875rem', margin: 0 }}>
          A local workspace for measuring and comparing LLM quality using Payload.
        </p>
      </div>

      {/* Cards */}
      <div
        style={{
          display: 'grid',
          gap: 'var(--base)',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        }}
      >
        {/* What are evals */}
        <Card
          body="Evals are automated tests that ask an LLM questions about Payload (QA) or ask it to modify a real config file (Codegen)."
          title="What are evals?"
        />

        {/* Eval Results */}
        <Card
          body="Browse every cached result — filter by pass/fail, category, or type. Expand any row to read the full answer, scorer reasoning, and per-call token usage."
          title="Eval Results"
        />

        {/* Vitest Report */}
        <Card
          body="The Vitest Report shows the raw test output from the last eval run — which spec files passed or failed, individual test timing, and error details. Generate one with:"
          code="pnpm run test:eval:report eval.collections"
          title="Vitest Report"
        />
      </div>

      {/* Divider */}
      <div
        style={{
          borderTop: '1px solid var(--theme-elevation-100)',
          marginTop: 'calc(var(--base) * 0.5)',
        }}
      />
    </div>
  )
}

function Card({ body, code, title }: { body: string; code?: string; title: string }) {
  return (
    <div
      style={{
        background: 'var(--theme-elevation-50)',
        border: '1px solid var(--theme-elevation-150)',
        borderRadius: 'var(--style-radius-m)',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        padding: 'calc(var(--base) * 1.25)',
      }}
    >
      <span
        style={{
          color: 'var(--theme-elevation-900)',
          fontSize: '0.875rem',
          fontWeight: 700,
        }}
      >
        {title}
      </span>
      <p
        style={{
          color: 'var(--theme-elevation-600)',
          fontSize: '0.8rem',
          lineHeight: 1.6,
          margin: 0,
        }}
      >
        {body}
      </p>
      {code && (
        <code
          style={{
            background: 'var(--theme-elevation-100)',
            borderRadius: '4px',
            color: 'var(--theme-elevation-800)',
            display: 'block',
            fontSize: '0.72rem',
            marginTop: '4px',
            padding: '5px 10px',
          }}
        >
          {code}
        </code>
      )}
    </div>
  )
}

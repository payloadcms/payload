import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Payload Test Instance',
}

export default function Home() {
  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h1>🚀 Payload Test Instance</h1>
      <p style={{ marginTop: '1rem', marginBottom: '2rem' }}>
        Test instance for Payload CMS with GCS storage and MCP server integration.
      </p>

      <div style={{ display: 'flex', gap: '1rem', flexDirection: 'column' }}>
        <Link
          href="/admin"
          style={{
            padding: '1rem',
            background: '#0070f3',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '4px',
            textAlign: 'center',
          }}
        >
          Go to Admin Panel
        </Link>

        <Link
          href="/api/graphql-playground"
          style={{
            padding: '1rem',
            background: '#e535ab',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '4px',
            textAlign: 'center',
          }}
        >
          GraphQL Playground
        </Link>
      </div>

      <div
        style={{ marginTop: '2rem', padding: '1rem', background: '#f5f5f5', borderRadius: '4px' }}
      >
        <h2>Quick Start:</h2>
        <ol style={{ marginTop: '1rem', paddingLeft: '1.5rem' }}>
          <li>
            Login with: <code>test@payloadcms.com</code> / <code>test</code>
          </li>
          <li>Upload some test images to the Media collection</li>
          <li>Upload documents to the Documents collection</li>
          <li>Test the MCP server from Claude Desktop</li>
        </ol>
      </div>

      <div
        style={{ marginTop: '2rem', padding: '1rem', background: '#fffbeb', borderRadius: '4px' }}
      >
        <h3>API Endpoints:</h3>
        <ul style={{ marginTop: '1rem', paddingLeft: '1.5rem' }}>
          <li>
            <code>GET /api/media</code> - List media assets
          </li>
          <li>
            <code>POST /api/media</code> - Upload media
          </li>
          <li>
            <code>GET /api/documents</code> - List documents
          </li>
          <li>
            <code>POST /api/graphql</code> - GraphQL endpoint
          </li>
        </ul>
      </div>
    </div>
  )
}

import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_frontend/')({
  component: HomePage,
  head: () => ({
    meta: [{ title: 'Payload TanStack Blank Template' }],
  }),
})

function HomePage() {
  return (
    <div className="home">
      <div className="content">
        <picture>
          <source srcSet="https://raw.githubusercontent.com/payloadcms/payload/main/packages/ui/src/assets/payload-favicon.svg" />
          <img
            alt="Payload Logo"
            height={65}
            src="https://raw.githubusercontent.com/payloadcms/payload/main/packages/ui/src/assets/payload-favicon.svg"
            width={65}
          />
        </picture>
        <h1>Welcome to your new project.</h1>
        <div className="links">
          <a className="admin" href="/admin" rel="noopener noreferrer" target="_blank">
            Go to admin panel
          </a>
          <a
            className="docs"
            href="https://payloadcms.com/docs"
            rel="noopener noreferrer"
            target="_blank"
          >
            Documentation
          </a>
        </div>
      </div>
      <div className="footer">
        <p>Update this page by editing</p>
        <code className="codeLink">src/app/_frontend/index.tsx</code>
      </div>
    </div>
  )
}

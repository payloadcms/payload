import { createPayloadRequest, type SanitizedConfig } from 'payload'
import { formatAdminURL } from 'payload/shared'

export const GET = (config: Promise<SanitizedConfig>) => async (request: Request) => {
  const req = await createPayloadRequest({
    config,
    request,
  })

  if (
    (!req.payload.config.graphQL.disable &&
      !req.payload.config.graphQL.disablePlaygroundInProduction &&
      process.env.NODE_ENV === 'production') ||
    process.env.NODE_ENV !== 'production'
  ) {
    const endpoint = formatAdminURL({
      apiRoute: req.payload.config.routes.api,
      path: req.payload.config.routes.graphQL as `/${string}`,
    })
    return new Response(renderGraphiQLPage(endpoint), {
      headers: {
        'Content-Type': 'text/html',
      },
      status: 200,
    })
  } else {
    return new Response('Route Not Found', { status: 404 })
  }
}

// Pinned CDN assets for the GraphiQL IDE. Versions are pinned and each asset carries
// a Subresource Integrity (SRI) hash so the browser rejects tampered CDN responses.
// GraphiQL replaces the deprecated, unmaintained graphql-playground; the explorer
// plugin provides the point-and-click schema navigator. Assets are loaded from the
// CDN at runtime rather than bundled, so this adds no weight to @payloadcms/next.
const cdnAssets = {
  explorerScript: {
    integrity: 'sha384-5p6hGdlOTvUy6Wf0GauxCz+xM9YB/YYvcGG+bf9msr2eyd+KVIxgRkepHgUijedJ',
    url: 'https://unpkg.com/@graphiql/plugin-explorer@3.2.6/dist/index.umd.js',
  },
  explorerStyle: {
    integrity: 'sha384-YN9MumWidbWKuNj8VfH5ggrFvm9YqAoIOMnKYpeGL3dr7Eg1qnQ+SAqSthdNZCjz',
    url: 'https://unpkg.com/@graphiql/plugin-explorer@3.2.6/dist/style.css',
  },
  graphiqlScript: {
    integrity: 'sha384-8NGfVj4CVlqHajlZj+bPJT4thxPMHMJYn7DWK2CvtopLd02E7qsPHazniBYvVjOO',
    url: 'https://unpkg.com/graphiql@3.9.0/graphiql.min.js',
  },
  graphiqlStyle: {
    integrity: 'sha384-QMux00XgRtwRLSYIY3kw2rj1ovk5AuuliAchk+HSQbqdbGFnz9GYuqIlOqxhwCE2',
    url: 'https://unpkg.com/graphiql@3.9.0/graphiql.min.css',
  },
  react: {
    integrity: 'sha384-DGyLxAyjq0f9SPpVevD6IgztCFlnMF6oW/XQGmfe+IsZ8TqEiDrcHkMLKI6fiB/Z',
    url: 'https://unpkg.com/react@18.3.1/umd/react.production.min.js',
  },
  reactDom: {
    integrity: 'sha384-gTGxhz21lVGYNMcdJOyq01Edg0jhn/c22nsx0kyqP0TxaV5WVdsSH1fSDUf5YJj1',
    url: 'https://unpkg.com/react-dom@18.3.1/umd/react-dom.production.min.js',
  },
}

// GraphiQL's UMD bundles must load in dependency order: react, then react-dom, then
// graphiql (reads React/ReactDOM), then the explorer plugin (reads GraphiQL.React and
// GraphiQL.GraphQL). Plain (non-async) script tags preserve that order.
const renderGraphiQLPage = (endpoint: string): string => `<!doctype html>
<html lang="en">
  <head>
    <title>GraphiQL</title>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      body {
        margin: 0;
      }
      #graphiql {
        height: 100dvh;
      }
      .graphiql-loading {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100dvh;
        font-family: sans-serif;
      }
    </style>
    <link rel="stylesheet" href="${cdnAssets.graphiqlStyle.url}" integrity="${cdnAssets.graphiqlStyle.integrity}" crossorigin="anonymous" />
    <link rel="stylesheet" href="${cdnAssets.explorerStyle.url}" integrity="${cdnAssets.explorerStyle.integrity}" crossorigin="anonymous" />
  </head>
  <body>
    <div id="graphiql"><div class="graphiql-loading">Loading GraphiQL…</div></div>
    <script src="${cdnAssets.react.url}" integrity="${cdnAssets.react.integrity}" crossorigin="anonymous"></script>
    <script src="${cdnAssets.reactDom.url}" integrity="${cdnAssets.reactDom.integrity}" crossorigin="anonymous"></script>
    <script src="${cdnAssets.graphiqlScript.url}" integrity="${cdnAssets.graphiqlScript.integrity}" crossorigin="anonymous"></script>
    <script src="${cdnAssets.explorerScript.url}" integrity="${cdnAssets.explorerScript.integrity}" crossorigin="anonymous"></script>
    <script>
      const endpoint = ${JSON.stringify(endpoint)}
      const fetcher = GraphiQL.createFetcher({
        url: endpoint,
        fetch: (input, init) => fetch(input, { ...init, credentials: 'include' }),
      })
      const explorer = GraphiQLPluginExplorer.explorerPlugin()
      const root = ReactDOM.createRoot(document.getElementById('graphiql'))
      root.render(React.createElement(GraphiQL, { fetcher, plugins: [explorer] }))
    </script>
  </body>
</html>`

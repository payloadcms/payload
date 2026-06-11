import { createPayloadRequest, type SanitizedConfig } from 'payload'
import { formatAdminURL } from 'payload/shared'

const renderGraphiQL = (endpoint: string) => `
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Payload GraphiQL</title>
    <style>
      body {
        margin: 0;
      }

      #graphiql {
        height: 100dvh;
      }

      .loading {
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 4rem;
      }
    </style>
    <link
      rel="stylesheet"
      href="https://esm.sh/graphiql@5.2.2/dist/style.css"
      integrity="sha384-f6GHLfCwoa4MFYUMd3rieGOsIVAte/evKbJhMigNdzUf52U9bV2JQBMQLke0ua+2"
      crossorigin="anonymous"
    />
    <link
      rel="stylesheet"
      href="https://esm.sh/@graphiql/plugin-explorer@5.1.1/dist/style.css"
      integrity="sha384-vTFGj0krVqwFXLB7kq/VHR0/j2+cCT/B63rge2mULaqnib2OX7DVLUVksTlqvMab"
      crossorigin="anonymous"
    />
    <script type="importmap">
      {
        "imports": {
          "react": "https://esm.sh/react@19",
          "react/": "https://esm.sh/react@19/",
          "react-dom": "https://esm.sh/react-dom@19",
          "react-dom/": "https://esm.sh/react-dom@19/",
          "graphiql": "https://esm.sh/graphiql@5.2.2?standalone&external=react,react-dom,@graphiql/react,graphql",
          "graphiql/": "https://esm.sh/graphiql@5.2.2/",
          "@graphiql/plugin-explorer": "https://esm.sh/@graphiql/plugin-explorer@5.1.1?standalone&external=react,@graphiql/react,graphql",
          "@graphiql/react": "https://esm.sh/@graphiql/react@0.37.3?standalone&external=react,react-dom,graphql,@graphiql/toolkit,@emotion/is-prop-valid",
          "@graphiql/toolkit": "https://esm.sh/@graphiql/toolkit@0.11.3?standalone&external=graphql",
          "graphql": "https://esm.sh/graphql@16.13.2",
          "@emotion/is-prop-valid": "data:text/javascript,"
        },
        "integrity": {
          "https://esm.sh/react@19.2.5": "sha384-ZNmUQ9QQgyl95nnD/FJTBQn2ZEPTbWtMuWCXTKWNuF6Si7nC+6bvSgk5LWu+ELHn",
          "https://esm.sh/react-dom@19.2.5": "sha384-qtNxBzn9gBs3CmJItMuvIVyjW3VIU0/rzGhCm9MippVU1BpR/c4VgaFYDIg/FrY2",
          "https://esm.sh/graphiql@5.2.2": "sha384-MBVZMq1pmz8DwpwIWPWLk2tmS6tGiSi6WwbXvy9NhuDYASAAWd2m96xbxLqszig9",
          "https://esm.sh/graphiql@5.2.2?standalone&external=react,react-dom,@graphiql/react,graphql": "sha384-SzHBEbcQfhvmwqh5Vtat9k7b/kIzmdVO3KMzQiAYwcxCA9x7vZwFRUgjzN1AeV3q",
          "https://esm.sh/@graphiql/plugin-explorer@5.1.1": "sha384-83REbLb9KtIhL/6J1n91SLoP0648KOKZLIDdHRx/a0E7T3ajq6PzKz+815SCfN52",
          "https://esm.sh/@graphiql/react@0.37.3?standalone&external=react,react-dom,graphql,@graphiql/toolkit,@emotion/is-prop-valid": "sha384-iZsbTy9B0VcX2BOTdqMuX0uJ9Hff5GbG2QeOt4OeMp0GHza76dwQaYQYNYkZkIVq",
          "https://esm.sh/@graphiql/toolkit@0.11.3?standalone&external=graphql": "sha384-ZsnupyYmzpNjF1Z/81zwi4nV352n4P7vm0JOFKiYnAwVGOf9twnEMnnxmxabMBXe",
          "https://esm.sh/graphql@16.13.2": "sha384-TQg9alwG3P9fzBErDW011vKuyTnrwpBZsl3SdMAh6DwBcv9ezFOl0djGI/68VOyy"
        }
      }
    </script>
    <script type="module">
      import React from 'react';
      import ReactDOM from 'react-dom/client';
      import { GraphiQL, HISTORY_PLUGIN } from 'graphiql';
      import { createGraphiQLFetcher } from '@graphiql/toolkit';
      import { explorerPlugin } from '@graphiql/plugin-explorer';
      import 'graphiql/setup-workers/esm.sh';

      const fetcher = createGraphiQLFetcher({
        url: '${endpoint}',
      });
      const plugins = [HISTORY_PLUGIN, explorerPlugin()];

      function App() {
        return React.createElement(GraphiQL, {
          fetcher,
          plugins,
          defaultEditorToolsVisibility: true,
        });
      }

      const container = document.getElementById('graphiql');
      const root = ReactDOM.createRoot(container);
      root.render(React.createElement(App));
    </script>
  </head>
  <body>
    <div id="graphiql">
      <div class="loading">Loading…</div>
    </div>
  </body>
</html>
`

export const GET = (config: Promise<SanitizedConfig>) => async (request: Request) => {
  const req = await createPayloadRequest({
    config,
    request,
  })

  const isGraphQLDisabled = req.payload.config.graphQL.disable
  const isGraphiQLDisabled =
    process.env.NODE_ENV === 'production' &&
    req.payload.config.graphQL.disablePlaygroundInProduction

  if (isGraphQLDisabled || isGraphiQLDisabled) {
    return new Response('Route Not Found', { status: 404 })
  }

  const endpoint = formatAdminURL({
    apiRoute: req.payload.config.routes.api,
    path: req.payload.config.routes.graphQL as `/${string}`,
  })

  return new Response(renderGraphiQL(endpoint), {
    headers: {
      'Content-Type': 'text/html',
    },
    status: 200,
  })
}

import { createFileRoute } from '@tanstack/react-router'

import { getPublishedPosts } from './posts.functions'

export const Route = createFileRoute('/_frontend/')({
  component: HomePage,
  head: () => ({
    meta: [
      { title: 'Payload + TanStack Start + Cloudflare' },
      {
        name: 'description',
        content: 'A single-Worker example using Payload, TanStack Start, Cloudflare D1, and R2.',
      },
    ],
  }),
  loader: () => getPublishedPosts(),
})

function HomePage() {
  const { docs } = Route.useLoaderData()

  return (
    <main data-test="payload-ui-barrel-sentinel">
      <section className="hero">
        <div className="eyebrow">One Worker. Two frameworks. No separate CMS server.</div>
        <h1>Payload meets TanStack Start on Cloudflare.</h1>
        <p className="lede">
          Payload serves the admin and API, TanStack Start renders the frontend, D1 stores content,
          and R2 stores uploads—all inside one Cloudflare Worker.
        </p>
        <div className="actions">
          <a className="button buttonPrimary" href="/admin">
            Open Payload admin
          </a>
          <a className="button" href="/api/posts" target="_blank" rel="noreferrer">
            Inspect REST API
          </a>
        </div>
      </section>

      <section className="stack" aria-labelledby="stack-heading">
        <div>
          <p className="sectionLabel">Request path</p>
          <h2 id="stack-heading">Cloudflare-native from edge to storage</h2>
        </div>
        <ol className="flow">
          <li>
            <span>01</span>
            <strong>TanStack Start</strong>
            <small>SSR, routing, and server functions</small>
          </li>
          <li>
            <span>02</span>
            <strong>Payload 4</strong>
            <small>Admin, auth, Local API, and REST</small>
          </li>
          <li>
            <span>03</span>
            <strong>D1 + R2</strong>
            <small>Relational content and object storage</small>
          </li>
        </ol>
      </section>

      <section className="posts" aria-labelledby="posts-heading">
        <div className="postsHeader">
          <div>
            <p className="sectionLabel">Local API example</p>
            <h2 id="posts-heading">Published posts</h2>
          </div>
          <code>{"payload.find({ collection: 'posts' })"}</code>
        </div>

        {docs.length > 0 ? (
          <div className="postGrid">
            {docs.map((post) => (
              <article className="postCard" key={post.id}>
                <time dateTime={post.publishedAt || undefined}>
                  {post.publishedAt
                    ? new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(
                        new Date(post.publishedAt),
                      )
                    : 'Draft'}
                </time>
                <h3>{post.title}</h3>
                <p>{post.excerpt}</p>
                <span>/{post.slug}</span>
              </article>
            ))}
          </div>
        ) : (
          <div className="emptyState">
            <p>No published posts yet.</p>
            <span>Create one in Payload admin and set its publish date to see it here.</span>
          </div>
        )}
      </section>
    </main>
  )
}

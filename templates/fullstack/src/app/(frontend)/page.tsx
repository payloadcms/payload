import Link from 'next/link'

export default function HomePage() {
  return (
    <section className="template-post__intro">
      <h1>Payload Fullstack Template</h1>
      <p>Manage content in the admin panel and publish posts from your Payload API.</p>
      <p>
        <Link href="/admin">Open admin panel</Link>
      </p>
    </section>
  )
}

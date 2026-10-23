export default function Home() {
  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>Payload CMS - Secure File Upload Example</h1>
      <p>
        This example demonstrates how to implement secure file uploads using{' '}
        <strong>Pompelmi</strong>, an in-process security scanner.
      </p>
      <p>
        Go to <a href="/admin">/admin</a> to access the Payload admin panel and try uploading files
        to the Media collection.
      </p>
      <h2>Features:</h2>
      <ul>
        <li>ZIP bomb detection</li>
        <li>YARA-based malware scanning</li>
        <li>In-process scanning (no cloud APIs required)</li>
        <li>Automatic rejection of malicious files</li>
      </ul>
      <p>
        Learn more about <a href="https://github.com/jkomyno/pompelmi">Pompelmi on GitHub</a>.
      </p>
    </div>
  )
}

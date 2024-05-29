import { Header } from './_components/Header'

import './_css/app.scss'

export const metadata = {
  title: 'Payload UI + Next.js App Router Example',
  description: 'An example of how to consume the Payload UI Library from any React application.',
}

export default async function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props

  return (
    <html lang="en">
      <body>
        <Header />
        <main>{children}</main>
      </body>
    </html>
  )
}

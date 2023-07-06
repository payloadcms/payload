import { AuthProvider } from './_components/Auth'
import { Header } from './_components/Header'

import './app.scss'

import classes from './index.module.scss'

export const metadata = {
  title: 'Payload Auth + Next.js App Router Example',
  description: 'An example of how to authenticate with Payload from a Next.js app.',
}

export default async function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props

  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <Header />
          <div className={classes.page}>{children}</div>
        </AuthProvider>
      </body>
    </html>
  )
}

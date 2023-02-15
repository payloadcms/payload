import type { AppProps } from 'next/app'

import { AuthProvider } from '../components/Auth'
import { Header } from '../components/Header'

import '../css/app.scss'

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <AuthProvider>
      <Header />
      <Component {...pageProps} />
    </AuthProvider>
  )
}

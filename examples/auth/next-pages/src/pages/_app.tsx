import type { AppProps } from 'next/app'

import { Header } from '../components/Header'
import { AuthProvider } from '../providers/Auth'

import '../css/app.scss'

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <AuthProvider
      // To toggle between the REST and GraphQL APIs,
      // change the `api` prop to either `rest` or `gql`
      api="rest" // change this to `gql` to use the GraphQL API
    >
      <Header />
      {/* typescript flags this `@ts-expect-error` declaration as unneeded, but types are breaking the build process
      Remove these comments when the issue is resolved
      See more here: https://github.com/facebook/react/issues/24304
      */}
      {/* @ts-expect-error */}
      <Component {...pageProps} />
    </AuthProvider>
  )
}

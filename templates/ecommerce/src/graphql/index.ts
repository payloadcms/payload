import { ApolloClient, InMemoryCache } from '@apollo/client'

let CLIENT: ApolloClient<unknown>

// By re-using the client if `NODE_ENV === 'production'`,
// we'll leverage Apollo caching
// to reduce the calls made to commonly needed assets
// like MainMenu, Footer, etc.

export function getApolloClient(): ApolloClient<unknown> {
  if (!CLIENT || process.env.NODE_ENV !== 'production') {
    CLIENT = new ApolloClient({
      ssrMode: true,
      uri: `${process.env.NEXT_PUBLIC_SERVER_URL}/api/graphql`,
      cache: new InMemoryCache(),
    })
  }

  return CLIENT
}

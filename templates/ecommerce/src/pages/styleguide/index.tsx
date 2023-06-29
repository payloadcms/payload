import React from 'react'
import { gql } from '@apollo/client'
import { GetStaticProps } from 'next'

import { Gutter } from '../../components/Gutter'
import { getApolloClient } from '../../graphql'
import { FOOTER, HEADER, SETTINGS } from '../../graphql/globals'

const Typography: React.FC = () => {
  return (
    <Gutter>
      <h1>Typography</h1>
      <h1>H1: Lorem ipsum dolor sit amet officia deserunt.</h1>
      <h2>H2: Lorem ipsum dolor sit amet in culpa qui officia deserunt consectetur.</h2>
      <h3>
        H3: Lorem ipsum dolor sit amet in culpa qui officia deserunt consectetur adipiscing elit.
      </h3>
      <h4>
        H4: Lorem ipsum dolor sit amet, consectetur adipiscing elit lorem ipsum dolor sit amet,
        consectetur adipiscing elit.
      </h4>
      <h5>
        H5: Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor
        incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam.
      </h5>
      <h6>
        H6: Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor
        incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam.
      </h6>
      <p>
        P: Lorem ipsum dolor sit amet, consectetur adipiscing elit consectetur adipiscing elit, sed
        do eiusmod tempor incididunt ut labore et dolore magna aliqua. dolore magna aliqua. Quis
        nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Lorem ipsum
        doalor sit amet in culpa qui officia deserunt consectetur adipiscing elit.
      </p>
    </Gutter>
  )
}

export const getStaticProps: GetStaticProps = async () => {
  const apolloClient = getApolloClient()

  const { data } = await apolloClient.query({
    query: gql(`
      query {
        ${HEADER}
        ${FOOTER}
        ${SETTINGS}
      }
    `),
  })

  return {
    props: {
      header: data?.Header || null,
      footer: data?.Footer || null,
    },
  }
}

export default Typography

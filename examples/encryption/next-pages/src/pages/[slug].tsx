import React from 'react'
import {
  GetStaticProps,
  GetStaticPropsContext,
  GetStaticPaths
} from 'next'
import { Collapsible } from '@faceless-ui/collapsibles'
import { Accordion } from '../components/Accordion'
import { Gutter } from '../components/Gutter'
import RichText from '../components/RichText'
import { TextArea } from '../components/Textarea';
import { VerticalPadding } from '../components/VerticalPadding'
import { User, Page, MainMenu } from '../payload-types'

const Page: React.FC<{
  mainMenu: MainMenu
  page: Page
  user: User
}> = (props) => {
  const {
    page: {
      title,
      content,
    },
    user
  } = props

  const [fetchedUserDOB, setFetchedUserDOB] = React.useState<string | undefined>(undefined)

  const fetchUserDOB = React.useCallback(async (): Promise<string | null> => {
    try {
      const req = await fetch(
        `${process.env.NEXT_PUBLIC_CMS_URL}/api/users/${user.id}/userDOB`,
        {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        },
      )

      const res = await req.json()
      setFetchedUserDOB(res.value)

    } catch (e) {
      console.error(e) // eslint-disable-line no-console
    }
    return null
  }, [])

  return (
    <React.Fragment>
      <VerticalPadding
        top='small'
        bottom='small'
      >
        <Gutter>
          <h1>{title}</h1>
          <RichText content={content} />
          <h2>Date of Birth</h2>
          <Collapsible>
            <Accordion
              onToggle={fetchUserDOB}
              label={
                <>
                  <div>••••••••••••</div>
                </>
              }
            >
              <TextArea value={fetchedUserDOB} disabled />
            </Accordion>
          </Collapsible>
        </Gutter>
      </VerticalPadding>
    </React.Fragment>
  )
}

export default Page;

export const getStaticProps: GetStaticProps = async (
  context: GetStaticPropsContext,
) => {
  const { params } = context;
  const slug = params?.slug || 'home';

  const pageQuery = await fetch(`${process.env.NEXT_PUBLIC_CMS_URL}/api/pages?where[slug][equals]=${slug}`).then(
    (res) => res.json(),
  );

  const usersQuery = await fetch(`${process.env.NEXT_PUBLIC_CMS_URL}/api/users`).then(
    (res) => res.json(),
  );

  return {
    props: {
      page: pageQuery.docs[0],
      user: usersQuery.docs[0],
    },
  };
};

export const getStaticPaths: GetStaticPaths<{ slug: string }> = async () => {
  const pagesQuery: { docs: Page[] } = await fetch(`${process.env.NEXT_PUBLIC_CMS_URL}/api/pages?limit=100`).then(
    (res) => res.json(),
  );

  return {
    paths: pagesQuery.docs.map((page) => ({
      params: {
        slug: page.slug,
      },
    })),
    fallback: 'blocking',
  };
};

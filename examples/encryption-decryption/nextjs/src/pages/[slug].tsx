import React from 'react';
import {
  GetStaticProps,
  GetStaticPropsContext,
  GetStaticPaths
} from 'next';
import type { Page, MainMenu } from '../../../cms/src/payload-types';
import RichText from '../components/RichText';
import { Gutter } from '../components/Gutter';
import { VerticalPadding } from '../components/VerticalPadding';

const Page: React.FC<{
  mainMenu: MainMenu
  page: Page
}> = (props) => {
  const {
    page: {
      title,
      content,
    },
  } = props;

  return (
    <React.Fragment>
      <VerticalPadding
        top='small'
        bottom='small'
      >
        <Gutter>
          <h1>{title}</h1>
          <RichText content={content} />
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

  return {
    props: {
      page: pageQuery.docs[0],
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

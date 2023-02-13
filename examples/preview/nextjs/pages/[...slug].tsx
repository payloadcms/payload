import React from 'react';
import {
  GetStaticProps,
  GetStaticPropsContext,
  GetStaticPaths
} from 'next';
import qs from 'qs';
import { ParsedUrlQuery } from 'querystring';
import type { Page, MainMenu } from '../payload-types';
import { revalidationRate } from '../revalidationRate';
import { Gutter } from '../components/Gutter';
import RichText from '../components/RichText';

import classes from './index.module.scss';

const Page: React.FC<Page & {
  mainMenu: MainMenu
  preview?: boolean
}> = (props) => {
  const {
    title,
    richText,
  } = props;

  return (
    <main>
      <Gutter>
        <h1 className={classes.hero}>{title}</h1>
        <RichText content={richText} />
      </Gutter>
    </main>
  )
}

export default Page;

interface IParams extends ParsedUrlQuery {
  slug: string[]
}

// when 'preview' cookies are set in the browser, getStaticProps runs on every request :)
// NOTE: 'slug' is an array (i.e. [...slug].tsx)
export const getStaticProps: GetStaticProps = async (
  context: GetStaticPropsContext,
) => {
  const {
    preview,
    previewData,
    params
  } = context;

  const {
    payloadToken
  } = previewData as {
    payloadToken: string
  } || {};

  let { slug } = params as IParams || {};
  if (!slug) slug = ['home'];

  let doc = {};
  let notFound = false;

  const lastSlug = slug[slug.length - 1];

  // when previewing, send the payload token to bypass draft access control
  const lowerCaseSlug = lastSlug.toLowerCase(); // NOTE: let the url be case insensitive

  let pageReq;
  let pageData;

  const query = qs.stringify({
    draft: preview && true
  })

  pageReq = await fetch(`${process.env.NEXT_PUBLIC_CMS_URL}/api/pages?where[slug][equals]=${lowerCaseSlug}&depth=2&${query}`, {
    headers: {
      ...preview ? {
        Authorization: `JWT ${payloadToken}`
      } : {}
    }
  });
  if (pageReq.ok) {
    pageData = await pageReq.json();
  }

  if (pageData) {
    const { docs } = pageData;

    if (docs.length > 0) {
      const slugChain = `/${slug.join('/')}`;
      // 'slug' is not unique, need to match the correct result to its last-most breadcrumb
      const foundDoc = docs.find((doc) => {
        const { breadcrumbs } = doc;
        const hasBreadcrumbs = breadcrumbs && Array.isArray(breadcrumbs) && breadcrumbs.length > 0;
        if (hasBreadcrumbs) {
          const lastCrumb = breadcrumbs[breadcrumbs.length - 1];
          return lastCrumb.url === slugChain;
        }
      })

      if (foundDoc) {
        doc = foundDoc
      } else notFound = true
    } else notFound = true;
  } else notFound = true;

  return ({
    props: {
      ...doc,
      preview: preview || null,
      collection: 'pages'
    },
    notFound,
    revalidate: revalidationRate
  })
}

type Path = {
  params: {
    slug: string[]
  }
};

type Paths = Path[];

export const getStaticPaths: GetStaticPaths = async () => {
  let paths: Paths = [];
  let pagesReq;
  let pagesData;

  pagesReq = await fetch(`${process.env.NEXT_PUBLIC_CMS_URL}/api/pages?where[_status][equals]=published&depth=0&limit=300`);
  pagesData = await pagesReq.json();

  if (pagesReq?.ok) {
    const { docs: pages } = pagesData;

    if (pages && Array.isArray(pages) && pages.length > 0) {
      paths = pages.map((page) => {
        const {
          slug,
          breadcrumbs,
        } = page;

        let slugs = [slug];

        const hasBreadcrumbs = breadcrumbs && Array.isArray(breadcrumbs) && breadcrumbs.length > 0;

        if (hasBreadcrumbs) {
          slugs = breadcrumbs.map((crumb: any) => {
            const { url } = crumb;
            let slug;
            if (url) {
              const split = url.split('/');
              slug = split[split.length - 1];
            }
            return slug;
          })
        }

        return ({ params: { slug: slugs } })
      });
    }
  }

  return {
    paths,
    fallback: true
  }
}

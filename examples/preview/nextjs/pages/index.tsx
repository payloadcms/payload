import { GetStaticProps } from 'next';
import Page, { getStaticProps as sharedGetStaticProps } from './[...slug]';

export default Page;

export const getStaticProps: GetStaticProps = async (ctx) => {
  const func = sharedGetStaticProps.bind(this);
  return func(ctx);
};

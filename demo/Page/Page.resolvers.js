import Page from './Page.model';
import { modelById, find, create } from '../../src/resolvers';

export default {
  Query: {
    page: async (parent, args) => {

      const query = {
        Model: Page,
        id: args.id,
        locale: args.locale,
        fallback: args['fallbackLocale']
      };

      return await modelById(query);
    },
    pages: async (parent, args) => {

      const query = {
        Model: Page,
        locale: args.locale,
        fallback: args['fallbackLocale']
      };

      return await find(query);
    }
  },
  Mutation: {
    createPage: async (parent, args) => {

      const query = {
        Model: Page,
        locale: args.locale,
        input: args.input
      };

      return await create(query)
    }
  }
}

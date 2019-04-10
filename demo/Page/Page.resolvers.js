import Page from './Page.model';
import { modelById } from '../../src/resolvers';

export default {
  Query: {
    page: async (parent, args) => {

      const query = {
        Model: Page,
        id: args.id,
        locale: args.locale,
        fallback: args['fallbackLocale']
      }

      return await modelById(query);
    },
    pages: async (parent, args) => {

    }
  }
}

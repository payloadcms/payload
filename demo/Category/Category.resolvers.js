import Category from './Category.model';
import { modelById, find, create } from '../../src/resolvers';

export default {
  Query: {
    category: async (parent, args) => {

      const query = {
        Model: Category,
        id: args.id,
        locale: args.locale,
        fallback: args['fallbackLocale']
      };

      return await modelById(query);
    },
    categories: async (parent, args) => {

      const query = {
        Model: Category,
        locale: args.locale,
        fallback: args['fallbackLocale']
      };

      return await find(query);
    }
  },
  Mutation: {
    createCategory: async (parent, args) => {

      const query = {
        Model: Category,
        locale: args.locale,
        input: args.input
      };

      return await create(query)
    }
  }
}

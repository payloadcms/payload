/* eslint-disable import/no-extraneous-dependencies */
import { Payload } from 'payload';
import { Config } from 'payload/config';
import GraphQL, { GraphQLFieldConfig } from 'graphql';
import { PayloadRequest } from 'payload/dist/express/types';
import { Response } from 'express';
import operation from './operation';
import { PasswordProtectionConfig } from '../types';

type Args = {
  collection: string
  password: string
  id: string
}

type MutationType = GraphQLFieldConfig<void, { req: PayloadRequest, res: Response }, Args>

const getMutation = (
  GraphQLArg: typeof GraphQL,
  payload: Payload,
  config: Config,
  options: PasswordProtectionConfig,
): MutationType => {
  const { GraphQLBoolean, GraphQLString, GraphQLNonNull } = GraphQLArg;

  return {
    type: GraphQLBoolean,
    args: {
      collection: {
        type: new GraphQLNonNull(GraphQLString),
      },
      password: {
        type: new GraphQLNonNull(GraphQLString),
      },
      id: {
        type: new GraphQLNonNull(GraphQLString),
      },
    },
    resolve: async (_, args, context) => {
      const { collection, password, id } = args;

      try {
        await operation({
          config,
          payload,
          options,
          collection,
          password,
          id,
          res: context.res,
        });

        return true;
      } catch {
        return false;
      }
    },
  };
};

export default getMutation;

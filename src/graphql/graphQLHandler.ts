import { graphqlHTTP } from 'express-graphql';
import { Response } from 'express';
import { PayloadRequest } from '../express/types';

const graphQLHandler = (req: PayloadRequest, res: Response) => {
  const { payload } = req;

  payload.errorResponses = null;

  return graphqlHTTP(
    async (request, response, { variables }) => ({
      schema: payload.schema,
      customFormatErrorFn: payload.customFormatErrorFn,
      extensions: payload.extensions,
      context: { req, res },
      validationRules: payload.validationRules(variables),
    }),
  );
};

export default graphQLHandler;

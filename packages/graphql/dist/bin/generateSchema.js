import fs from 'fs';
import { printSchema } from 'graphql';
import { configToSchema } from '../index.js';
export function generateSchema(config) {
    const outputFile = process.env.PAYLOAD_GRAPHQL_SCHEMA_PATH || config.graphQL.schemaOutputFile;
    const { schema } = configToSchema(config);
    fs.writeFileSync(outputFile, printSchema(schema));
}

//# sourceMappingURL=generateSchema.js.map
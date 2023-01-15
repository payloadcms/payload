import { OpenAPIV3, OpenAPIV3_1 } from "openapi-types";
import jsonSchemaToOpenapiSchema from "@openapi-contrib/json-schema-to-openapi-schema";
import { PayloadRequest } from "../../express/types";
import { getTranslation } from "../../utilities/getTranslation";
import entityToJsonSchema from "../entityToJsonSchema";

function adjustRefTargets(subject: unknown): void {
  const search = new RegExp("^#/definitions/");

  for (const [key, value] of Object.entries(subject)) {
    if (key === "$ref" && typeof value === "string") {
      subject[key] = value.replace(search, "#/components/schemas/");
    }

    if (typeof value === "object" && value !== null && value !== null) {
      adjustRefTargets(value);
    }
  }
}

async function generateV30Spec(
  req: PayloadRequest
): Promise<OpenAPIV3.Document> {
  return {
    openapi: "3.0.3",
    info: { title: "Payload CMS", version: "0.0.1" },
    servers: [
      {
        url: `${req.secure ? "https" : "http"}://${req.header("host")}`,
      },
    ],
    paths: Object.fromEntries(
      Object.entries(req.payload.collections).flatMap(([slug, collection]) => {
        const singular = getTranslation(
          collection.config.labels.singular,
          req.i18n
        );
        const plural = getTranslation(
          collection.config.labels.plural,
          req.i18n
        );
        const tags = [plural];

        const singleObjectResponses = {
          200: {
            description: `${singular} object`,
            content: {
              "text/json": {
                schema: { $ref: `#/components/schemas/${slug}` },
              },
            },
          },
          404: {
            description: `${singular} not found`,
          },
        } satisfies OpenAPIV3.ResponsesObject;

        return [
          [
            `/api/${slug}`,
            {
              get: {
                summary: `Retrieve a list of ${plural}`,
                tags,
                parameters: [
                  { in: "query", name: "page", schema: { type: "number" } },
                  { in: "query", name: "limit", schema: { type: "number" } },
                  {
                    in: "query",
                    name: "sort",
                    schema: {
                      type: "string",
                      enum: collection.config.fields.flatMap((field) => {
                        if (
                          field.type === "number" ||
                          field.type === "text" ||
                          field.type === "email" ||
                          field.type === "date"
                        ) {
                          return [field.name, `-${field.name}`];
                        }
                        return [];
                      }),
                    },
                  },
                  {
                    in: "query",
                    name: "where",
                    style: "deepObject",
                    schema: { type: "object", additionalProperties: true }, // TODO a more thorough description
                  },
                ],
                responses: {
                  200: {
                    description: `List of ${plural}`,
                    content: {
                      "text/json": {
                        schema: {
                          // TODO use jsonschema and convert
                          type: "object",
                          properties: {
                            docs: {
                              type: "array",
                              items: { $ref: `#/components/schemas/${slug}` },
                            },
                            totalDocs: { type: "number" },
                            limit: { type: "number" },
                            totalPages: { type: "number" },
                            page: { type: "number" },
                            pagingCounter: { type: "number" },
                            hasPrevPage: { type: "boolean" },
                            hasNextPage: { type: "boolean" },
                            prevPage: { type: "number", nullable: true },
                            nextPage: { type: "number", nullable: true },
                          },
                          required: [
                            "docs",
                            "totalDocs",
                            "limit",
                            "totalPages",
                            "page",
                            "pagingCounter",
                            "hasPrevPage",
                            "hasNextPage",
                            "prevPage",
                            "nextPage",
                          ],
                        },
                      },
                    },
                  },
                },
              },
              post: {
                summary: `Create a new ${singular}`,
                tags,
                requestBody: { $ref: `#/components/requestBodies/${slug}` },
                responses: {
                  201: {
                    description: `${singular} created successfully`,
                    content: {
                      "text/json": {
                        schema: {
                          type: "object",
                          properties: {
                            message: { type: "string" },
                            doc: {
                              type: "object",
                              properties: {
                                id: { type: "string" },
                                createdAt: {
                                  type: "string",
                                  format: "date-time",
                                },
                                updatedAt: {
                                  type: "string",
                                  format: "date-time",
                                },
                              },
                              required: ["id", "createdAt", "updatedAt"],
                            },
                          },
                          required: ["message", "doc"],
                        },
                      },
                    },
                  },
                },
              },
            } satisfies OpenAPIV3.PathItemObject,
          ],
          [
            `/api/${slug}/{id}`,
            {
              parameters: [
                {
                  in: "path",
                  name: "id",
                  description: `ID of the ${singular}`,
                  required: true,
                  schema: {
                    type: "string",
                  },
                },
              ],
              get: {
                summary: `Find a ${singular} by ID`,
                tags,
                responses: singleObjectResponses,
              },
              patch: {
                summary: `Update a ${singular}`,
                tags,
                responses: singleObjectResponses,
              },
              delete: {
                summary: `Delete a ${singular}`,
                tags,
                responses: singleObjectResponses,
              },
            } satisfies OpenAPIV3.PathItemObject,
          ],
        ];
      })
    ),
    components: {
      schemas: Object.fromEntries(
        await Promise.all(
          Object.entries(req.payload.collections).map(
            async ([slug, collection]) => {
              const schema = (await jsonSchemaToOpenapiSchema(
                entityToJsonSchema(req.payload.config, collection.config)
              )) as OpenAPIV3.SchemaObject;

              return [
                slug,
                {
                  ...schema,
                  title: getTranslation(
                    collection.config.labels.singular,
                    req.i18n
                  ),
                } satisfies OpenAPIV3.SchemaObject,
              ];
            }
          )
        )
      ),
      requestBodies: Object.fromEntries(
        await Promise.all(
          Object.entries(req.payload.collections).map(
            async ([slug, collection]) => {
              const schema = (await jsonSchemaToOpenapiSchema(
                entityToJsonSchema(req.payload.config, collection.config)
              )) as OpenAPIV3.SchemaObject;

              return [
                slug,
                {
                  description: getTranslation(
                    collection.config.labels.singular,
                    req.i18n
                  ),
                  content: {
                    "text/json": {
                      schema: {
                        ...schema,
                        properties: Object.fromEntries(
                          Object.entries(schema.properties).filter(
                            ([slug]) =>
                              !["id", "createdAt", "updatedAt"].includes(slug)
                          )
                        ),
                      },
                    },
                  },
                } satisfies OpenAPIV3.RequestBodyObject,
              ];
            }
          )
        )
      ),
    },
  };
}

// TODO
function generateV31Spec(req: PayloadRequest): OpenAPIV3_1.Document {
  return {
    openapi: "3.1.0",
    info: { title: "Payload CMS", version: "0.0.1" },
    components: {},
  };
}

async function openapiOperation({
  req,
}: {
  req: PayloadRequest;
}): Promise<OpenAPIV3.Document | OpenAPIV3_1.Document> {
  const spec = await (async function () {
    switch (req.payload.config.openapi.version) {
      case "3.0":
        return await generateV30Spec(req);
      case "3.1":
        return generateV31Spec(req);
    }
  })();

  adjustRefTargets(spec);
  return spec;
}

export default openapiOperation;

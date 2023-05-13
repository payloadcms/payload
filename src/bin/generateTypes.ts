/* eslint-disable no-nested-ternary */
import fs from 'fs';
import type { JSONSchema4 } from 'json-schema';
import { compile } from 'json-schema-to-typescript';
import { singular } from 'pluralize';
import { InterfaceDeclaration, Project, SourceFile, Writers } from 'ts-morph';
import { SanitizedCollectionConfig } from '../collections/config/types';
import loadConfig from '../config/load';
import { SanitizedConfig } from '../config/types';
import { Field } from '../fields/config/types';
import { entityToJSONSchema, generateEntityObject } from '../utilities/entityToJSONSchema';
import { toWords } from '../utilities/formatLabels';
import Logger from '../utilities/logger';

function configToJsonSchema(config: SanitizedConfig): JSONSchema4 {
  return {
    title: 'Config',
    type: 'object',
    additionalProperties: false,
    properties: {
      collections: generateEntityObject(config, 'collections'),
      globals: generateEntityObject(config, 'globals'),
    },
    required: ['collections', 'globals'],
    definitions: Object.fromEntries(
      [
        ...config.globals.map((global) => [
          global.slug,
          entityToJSONSchema(config, global),
        ]),
        ...config.collections.map((collection) => [
          collection.slug,
          entityToJSONSchema(config, collection),
        ]),
      ],
    ),
  };
}

const incorrectPropNameChars = [' ', '-', '.'];
function sanitizePropName(propName: string) {
  if (incorrectPropNameChars.some((char) => propName.includes(char))) {
    return `'${propName}'`;
  }
  return propName;
}

interface TsMorphContext {
  config: SanitizedConfig;
  baseCollection: SanitizedCollectionConfig;
  maxDepth: number;
}

function processFields(ctx: TsMorphContext, fields: Field[], iface: InterfaceDeclaration, prefix = '', visitedRelations: Set<string> = new Set()) {
  const depth = prefix.split('.').length;
  if (depth > ctx.maxDepth) {
    return;
  }
  // eslint-disable-next-line no-restricted-syntax
  for (const p of fields) {
    switch (p.type) {
      case 'text':
      case 'textarea':
      case 'number':
      case 'email':
      case 'checkbox':
      case 'date':
      case 'radio':
      case 'point':
      case 'select': {
        const pname = `${prefix}${p.name}`;
        iface.addProperty({ name: sanitizePropName(pname), type: 'WhereField', hasQuestionToken: true });
        break;
      }
      case 'row':
      case 'collapsible': {
        processFields(ctx, p.fields.filter((f) => 'name' in f && f.name !== 'id'), iface, prefix, visitedRelations);
        break;
      }
      case 'tabs': {
        for (let i = 0; i < p.tabs.length; i += 1) {
          const tab = p.tabs[i];
          const pname = `${prefix}${'name' in tab ? tab.name : ''}`;
          processFields(ctx, tab.fields.filter((f) => 'name' in f && f.name !== 'id'), iface, `${pname}.`, visitedRelations);
        }
        break;
      }
      case 'array': {
        const pname = `${prefix}${p.name}`;
        processFields(ctx, p.fields.filter((f) => 'name' in f && f.name !== 'id'), iface, `${pname}.`, visitedRelations);
        break;
      }
      case 'group': {
        const pname = `${prefix}${p.name}`;
        processFields(ctx, p.fields.filter((f) => 'name' in f && f.name !== 'id'), iface, `${pname}.`, visitedRelations);
        break;
      }
      case 'relationship': {
        const pname = `${prefix}${p.name}`;
        if (typeof p.relationTo === 'string') {
          // Do not recurse in relations we have already visited to prevent infinite loops
          if (!visitedRelations.has(p.relationTo)) {
            // eslint-disable-next-line no-param-reassign
            visitedRelations = new Set(visitedRelations); // Clone
            visitedRelations.add(p.relationTo);
            const targetCollection = ctx.config.collections.find((c) => c.slug === p.relationTo);
            iface.addProperty({ name: sanitizePropName(pname), type: 'WhereField', hasQuestionToken: true });
            processFields(ctx, targetCollection.fields, iface, `${pname}.`, visitedRelations);
          }
        }
        break;
      }
      default:
        break;
    }
  }
}

function buildWhereForCollection(ctx: TsMorphContext, cf: SanitizedCollectionConfig, sf: SourceFile) {
  const baseName = cf.typescript?.interface ? cf.typescript.interface : singular(toWords(cf.slug, true));
  const whereName = `${baseName}Where`;
  const iface = sf.addInterface({ name: whereName, isExported: true });
  iface.addProperty({ name: 'and', type: `${whereName}[]`, hasQuestionToken: true });
  iface.addProperty({ name: 'or', type: `${whereName}[]`, hasQuestionToken: true });
  // `id` field could be missing from the collection definition, so let's add it automatically
  if (!cf.fields.find((f) => 'name' in sf && sf.name === 'id')) {
    iface.addProperty({ name: 'id', type: 'WhereField', hasQuestionToken: true });
  }
  // Loop through baseType properties
  const visited = new Set<string>([cf.slug]);
  processFields(ctx, cf.fields, iface, '', visited);
  iface.addIndexSignature({ keyType: 'string', returnType: 'WhereField | Where[]' });
  return `${baseName}Where`;
}

async function applyTsMorph(config: SanitizedConfig, path: string) {
  const project = new Project();
  const f = project.addSourceFileAtPath(path);

  f.addImportDeclaration({
    moduleSpecifier: 'payload/dist/types',
    namedImports: [
      'Where',
      'WhereField',
    ],
  });

  const configInterface = f.getInterfaceOrThrow('Config');
  const collectionWheresProperty = configInterface.addProperty({ name: 'collectionWheres', type: '{}' });
  const collectionWheresTypes: { pname: string; ptype: string }[] = [];
  for (const collectionConfig of config.collections) {
    const pname = collectionConfig.slug;
    const ctx: TsMorphContext = {
      config,
      baseCollection: collectionConfig,
      maxDepth: 10,
    };
    collectionWheresTypes.push({ pname: sanitizePropName(pname), ptype: buildWhereForCollection(ctx, collectionConfig, f) });
  }

  collectionWheresProperty.setType(
    Writers.object(Object.fromEntries(collectionWheresTypes.map((p) => ([p.pname, p.ptype])))),
  );

  await project.save();
}

export async function generateTypes(): Promise<void> {
  const logger = Logger();
  const config = await loadConfig();
  const outputFile = process.env.PAYLOAD_TS_OUTPUT_PATH || config.typescript.outputFile;

  logger.info('Compiling TS types for Collections and Globals...');

  const jsonSchema = configToJsonSchema(config);

  await compile(jsonSchema, 'Config', {
    bannerComment: '/* tslint:disable */\n/**\n* This file was automatically generated by Payload CMS.\n* DO NOT MODIFY IT BY HAND. Instead, modify your source Payload config,\n* and re-run `payload generate:types` to regenerate this file.\n*/',
    style: {
      singleQuote: true,
    },
  }).then(async (compiled) => {
    fs.writeFileSync(outputFile, compiled);

    // Patch with ts-morph
    await applyTsMorph(config, outputFile);

    logger.info(`Types written to ${outputFile}`);
  });
}

// when generateTypes.js is launched directly
if (module.id === require.main.id) {
  generateTypes();
}

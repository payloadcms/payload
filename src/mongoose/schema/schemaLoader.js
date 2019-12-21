import mongoose from 'mongoose';
import fieldToSchemaMap from './fieldToSchemaMap';
import localizationPlugin from '../../localization/localization.plugin';
import autopopulate from '../autopopulate.plugin';
import paginate from '../paginate.plugin';
import buildQueryPlugin from '../buildQuery.plugin';
import validateGlobal from '../../utilities/validateGlobal';

class SchemaLoader {

  blockSchema;
  contentBlocks = {};
  collections = {};
  globals = {};
  globalModel = {};

  /**
   * Sets up schema and models using payload config
   * @param config
   * @param config.collections
   * @param config.globals
   * @param config.contentBlocks
   */
  constructor(config) {
    this.blockSchema = new mongoose.Schema({},
      { discriminatorKey: 'blockType', _id: false });
    this.blockSchema.plugin(autopopulate);
    this.blockSchemaLoader(config);
    this.collectionSchemaLoader(config);
    this.globalSchemaLoader(config);
  }

  blockSchemaLoader = config => {
    Object.values(config.contentBlocks).forEach(blockConfig => {
      // TODO: any kind of validation for blocks?
      const fields = {};

      const flexibleSchema = {};
      blockConfig.fields.forEach(field => {
        const fieldSchema = fieldToSchemaMap[field.type];
        if (fieldSchema) fields[field.name] = fieldSchema(field);
        if (field.type === 'flexible') {
          flexibleSchema[field.name] = field;
        }
      });

      const Schema = new mongoose.Schema(fields)
        .plugin(paginate)
        .plugin(localizationPlugin, config.localization)
        .plugin(buildQueryPlugin)
        .plugin(autopopulate, config.localization);

      const Model = mongoose.model(blockConfig.slug, Schema);

      const RefSchema = new mongoose.Schema(
        {
          relation: {
            type: mongoose.Schema.Types.ObjectId,
            autopopulate: true,
            ref: blockConfig.slug,
          }
        }, { _id: false }
      );
      RefSchema.plugin(autopopulate, config.localization);

      Object.values(flexibleSchema).forEach(flexible => {
        flexible.blocks.forEach(blockType => {
          Schema
            .path(flexible.name)
            .discriminator(blockType, RefSchema)
        });
      });

      this.contentBlocks[blockConfig.slug] = {
        config: blockConfig,
        Schema,
        RefSchema,
        Model,
      };
    });
  };


  globalSchemaLoader = config => {
    let globalSchemaGroups = {};
    const globalFields = {};
    Object.values(config.globals).forEach(globalConfig => {
      validateGlobal(globalConfig, this.globals);
      this.globals[globalConfig.label] = globalConfig;
      globalFields[globalConfig.slug] = {};

      globalConfig.fields.forEach(field => {
        const fieldSchema = fieldToSchemaMap[field.type];
        if (fieldSchema) globalFields[globalConfig.slug][field.name] = fieldSchema(field, { path: globalConfig.slug, localization: config.localization });
      });
      globalSchemaGroups[globalConfig.slug] = new mongoose.Schema(globalFields[globalConfig.slug], { _id: false })
        .plugin(localizationPlugin, config.localization)
        .plugin(autopopulate);
    });

    if (config.globals) {
      this.globalModel = mongoose.model(
        'global',
        new mongoose.Schema({ ...globalSchemaGroups, timestamps: false })
          .plugin(localizationPlugin, config.localization)
          .plugin(autopopulate)
      );
    }
  };
}

module.exports = SchemaLoader;

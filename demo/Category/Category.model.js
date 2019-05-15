import mongoose from 'mongoose';
import buildQuery from '../../src/plugins/buildQuery';
import paginate from '../../src/plugins/paginate';
import internationalization from '../../src/plugins/internationalization';
import payloadConfig from '.././payload.config';
import {schemaBaseFields} from '../../src/helpers/mongoose/schemaBaseFields';

const CategorySchema = new mongoose.Schema({
    ...schemaBaseFields,
    title: {type: String, intl: true, unique: true},
    description: {type: String, intl: true},
  },
  {timestamps: true}
);

CategorySchema.plugin(paginate);
CategorySchema.plugin(buildQuery);
CategorySchema.plugin(internationalization, payloadConfig.localization);

module.exports = mongoose.model('Category', CategorySchema);

import mongoose from 'mongoose';
import mongooseAutopopulate from 'mongoose-autopopulate';
import buildQuery from '../../src/plugins/buildQuery';
import paginate from '../../src/plugins/paginate';
import internationalization from '../../src/plugins/internationalization';
import payloadConfig from '.././payload.config';
import {schemaBaseFields} from '../../src/helpers/mongoose/schemaBaseFields';


const PageSchema = new mongoose.Schema({
    ...schemaBaseFields,
    title: {type: String, intl: true, unique: true},
    content: {type: String, intl: true},
    //slug: { type: String, intl: true, unique: true, required: true },
    metaTitle: String,
    metaDesc: String,
    categories: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      autopopulate: true
    }],
  },
  {timestamps: true}
);

PageSchema.plugin(paginate);
PageSchema.plugin(buildQuery);
PageSchema.plugin(internationalization, payloadConfig.localization);
PageSchema.plugin(mongooseAutopopulate);

module.exports = mongoose.model('Page', PageSchema);

import mongoose from 'mongoose';
import autopopulate from '../../src/plugins/autopopulate';
import buildQuery from '../../src/plugins/buildQuery';
import paginate from '../../src/plugins/paginate';
import internationalization from '../../src/plugins/internationalization';
import payloadConfig from '.././payload.config';
import { schemaBaseFields } from '../../src/helpers/mongoose/schemaBaseFields';

const CategorySchema = new mongoose.Schema({
  ...schemaBaseFields,
  title: { type: String, intl: true, unique: true },
  description: { type: String, intl: true },
  pages: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Page',
    autopopulate: true
  }],
},
  { timestamps: true }
);

CategorySchema.plugin(paginate);
CategorySchema.plugin(buildQuery);
CategorySchema.plugin(internationalization, payloadConfig.localization);
CategorySchema.plugin(autopopulate);

CategorySchema.post('find', function (results) {
  results.forEach(doc => {
    doc.setLocale(this.options.autopopulate.locale)
  })
});

module.exports = mongoose.model('Category', CategorySchema);

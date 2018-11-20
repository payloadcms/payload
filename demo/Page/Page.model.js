const mongoose = require('mongoose');
const mongooseStringQuery = require('mongoose-string-query');

const PageSchema = new mongoose.Schema({
  title: String,
  content: String,
  slug: String
});

PageSchema.plugin(mongooseStringQuery);

module.exports = mongoose.model('Page', PageSchema);

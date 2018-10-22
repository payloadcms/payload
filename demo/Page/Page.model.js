const mongoose = require('mongoose');

const PageSchema = new mongoose.Schema({
  title: String,
  content: String
});

module.exports = mongoose.model('Page', PageSchema);

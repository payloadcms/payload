const mongoose = require('mongoose');

const PageSchema = new mongoose.Schema({
  title: String,
  content: String
});

mongoose.model('Page', PageSchema);

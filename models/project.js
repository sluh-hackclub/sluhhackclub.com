const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  url: {
    type: String
  },
  creation_time: {
    // unix timestamp
    type: String,
    required: true
  },
  last_modified: {
    // unix timestamp
    type: String,
    required: true
  },
  deadline: {
    // unix timestamp
    type: String,
    required: true
  },
  alt_description: {
    // Something like "November 2018 Programming Project"
    type: String
  },
  long_title: {
    // Something like "C"
    type: String
  }
});

module.exports = mongoose.model('Project', projectSchema);

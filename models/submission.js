const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true
  },
  project_id: {
    type: String,
    required: true
  },
  timestamp: {
    // creation time, unix timestamp
    type: String,
    required: true
  },
  last_edit: {
    // unix timestamp
    type: String,
    required: true
  },
  url: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  notes: {
    type: String
  },
  grader_notes: {
    type: String
  },
  score: {
    type: String
  },
  reviewed: {
    type: Boolean,
    required: true
  },
  reviewer: {
    type: String
  }
});

module.exports = mongoose.model('Submission', submissionSchema);

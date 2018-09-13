const mongoose = require('mongoose');

const leaderboardEntrySchema = new mongoose.Schema({
  name: {
    type: String
  },
  current_score: {
    type: String
  },
  total_score: {
    type: String
  }
});

module.exports = mongoose.model('LeaderboardEntry', leaderboardEntrySchema);

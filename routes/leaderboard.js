const express = require('express');
const router = express.Router();

const LeaderboardEntry = require('../models/leaderboardEntry.js');

router.get('/', (req, res, next) => {
  // const newLeaderboardEntry = new LeaderboardEntry({
  //   name: 'Daniel Blittschau',
  //   current_score: '0',
  //   total_score: '500'
  // });
  // newLeaderboardEntry.save();
  let resOptions = {};
  if (req.session.loggedIn) {
    if (req.session.userType === 'student') {
      resOptions.loggedIn = true;
      resOptions.userType = 'student';
    } else if (req.session.userType === 'admin') {
      resOptions.loggedIn = true;
      resOptions.userType = 'admin';
    } else {
      resOptions.loggedIn = false;
    }
  } else {
    resOptions.loggedIn = false;
  }
  // BEGIN TEMPORARY DATA
  // resOptions.leaderboardRankings = [
  //   {name: 'Micah', currentProjectScore: '100', totalScore: '200'},
  //   {name: 'Daniel', currentProjectScore: '0', totalScore: '500'},
  //   {name: 'Ben', currentProjectScore: '0', totalScore: '500'},
  //   {name: 'Sean', currentProjectScore: '0', totalScore: '100'}
  // ];
  LeaderboardEntry.find({}).then(doc => {
    resOptions.rankedMemberCount = doc.length;
    resOptions.submissionCount = doc.length;
    // console.log(doc);
    resOptions.leaderboardRankings = doc;
    // console.log(resOptions.leaderboardRankings);
    resOptions.currentProject = 'Sorting Algorithm';
    // resOptions.submissionCount = '60';
    // resOptions.rankedMemberCount = await User.count();
    // END TEMPORARY DATA
    // sort array of rankings
    resOptions.leaderboardRankings.sort((a, b) => {
      return Number(b.totalScore) - Number(a.totalScore);
    });
    // limit array to 10 entries
    // disabled at the Micah's request
    // resOptions.leaderboardRankings.splice(10);
    res.render('pages/leaderboard.ejs', resOptions);
  });
});

module.exports = router;

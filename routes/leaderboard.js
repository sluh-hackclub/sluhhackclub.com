const express = require('express');
const router = express.Router();

const LeaderboardEntry = require('../models/leaderboardEntry.js');
const Project = require('../models/project.js');
const Submission = require('../models/submission.js');

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
    // resOptions.submissionCount = doc.length;
    // console.log(doc);
    resOptions.leaderboardRankings = doc;
    // console.log(resOptions.leaderboardRankings);
    // resOptions.currentProject = 'Sorting Algorithm';
    // resOptions.submissionCount = '60';
    // resOptions.rankedMemberCount = await User.count();
    // END TEMPORARY DATA
    // sort array of rankings
    resOptions.leaderboardRankings.sort((a, b) => {
      return Number(b.total_score) - Number(a.total_score);
    });
    // limit array to 10 entries
    // disabled at the Micah's request
    // resOptions.leaderboardRankings.splice(10);
    // first determine the latest project
    // find projects with unix timestamp greater than current time
    Project.find({}).then(doc => {
      // doc is an array of all documents
      // make a new array with all documents greater than current unix time
      const currentProjects = doc.filter(document => {
        return Number(document.deadline) > Math.round(new Date().getTime() / 1000);
      });
      // sort currentProjects array by deadline
      currentProjects.sort((a, b) => Number(a.deadline) - Number(b.deadline));
      const currentProject = currentProjects[0];
      if (currentProject === undefined) {
        // there is no current project
        resOptions.currentProjectExists = false;
        res.render('pages/leaderboard.ejs', resOptions);
      } else {
        // there is a current project
        resOptions.currentProjectExists = true;
        resOptions.currentProject = currentProject.name;
        Submission.countDocuments({'project_id': currentProject._id + ''}, (err, count) => {
          if (err) {
            console.error(err);
            const error = new Error('Internal server error');
            error.status = 500;
            next(error);
          } else {
            resOptions.submissionCount = count;
            res.render('pages/leaderboard.ejs', resOptions);
          }
        });
      }
    });
  });
});

module.exports = router;

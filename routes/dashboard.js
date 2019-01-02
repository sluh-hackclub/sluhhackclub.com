const express = require('express');
const router = express.Router();

const mongoose = require('mongoose');

const Project = require('../models/project.js');
const Submission = require('../models/submission.js');

const formatDate = require('../snippets/formatDate.js');
// const formatDate = date => {
//   var hours = date.getHours();
//   var minutes = date.getMinutes();
//   var ampm = hours >= 12 ? 'PM' : 'AM';
//   hours = hours % 12;
//   // hours = hours ? hours : 12; // the hour '0' should be '12'
//   hours = hours || 12; // the hour '0' should be '12'
//   minutes = minutes < 10 ? '0' + minutes : minutes;
//   var strTime = hours + ':' + minutes + ' ' + ampm;
//   return strTime + ' ' + (date.getMonth() + 1) + '/' + date.getDate() + '/' + date.getFullYear();
// };

router.get('/', (req, res, next) => {
  if (req.session.loggedIn) {
    if (req.session.userType === 'admin') {
      res.redirect('/admin');
    } else {
      const resOptions = {};
      resOptions.firstName = req.session.firstName;
      resOptions.lastName = req.session.lastName;
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
          // There is no current project
          resOptions.currentProjectExists = false;
          res.render('pages/dashboard.ejs', resOptions);
        } else {
          // There is a current project
          resOptions.currentProjectExists = true;
          resOptions.latestProjectId = currentProject._id;
          resOptions.latestProjectDeadline = formatDate(new Date(Number(currentProject.deadline) * 1000));
          resOptions.latestProjectName = currentProject.name;
          Submission.find({
            email: req.session.email,
            project_id: currentProject._id + ''
          }).then(doc => {
            if (doc.length > 0) {
              resOptions.latestProjectSubmitted = true;
            } else {
              resOptions.latestProjectSubmitted = false;
            }
            /* Removed checking for deadline passed because
            we already removed all projects with a
            passed deadline. It will fall under the case
            of no current project. */
            // if (Number(currentProject.deadline) * 1000 > new Date().getTime()) {
            //   // valid time
            //   resOptions.deadlinePassed = false;
            // } else {
            //   resOptions.deadlinePassed = true;
            // }
            res.render('pages/dashboard.ejs', resOptions);
          });
        }
      });
    }
  } else {
    res.redirect('/login');
  }
});

router.get('/projects', (req, res, next) => {
  if (req.session.loggedIn) {
    if (req.session.userType === 'admin') {
      res.redirect('/admin');
    } else {
      const resOptions = {};
      resOptions.entries = [];
      Project.find({}).then(doc => {
        let counter = 0;
        if (doc.length > 0) {
          doc.forEach((entry, index) => {
            resOptions.entries[index] = {};
            resOptions.entries[index].title = entry.name;
            resOptions.entries[index].deadline = formatDate(new Date(entry.deadline * 1000));
            resOptions.entries[index].id = entry._id;
            Submission.countDocuments({project_id: entry._id + ''}).then(submissionCount => {
              resOptions.entries[index].submissionCount = submissionCount;
              if (counter === doc.length - 1) {
                res.render('pages/studentprojects.ejs', resOptions);
              }
              counter++;
            });
          });
        } else {
          res.render('pages/studentprojects.ejs', {entries: []});
        }
      });
    }
  } else {
    res.redirect('/login');
  }
});

router.get('/projects/:projectId', (req, res, next) => {
  if (req.session.loggedIn) {

  }
});

router.get('/projects/:projectId/submit', (req, res, next) => {
  if (req.session.loggedIn) {
    if (req.session.userType === 'student') {
      const resOptions = {};
      // resOptions.projectId = req.params.projectId;
      // resOptions.projectTitle = 'Test nProject render';
      // resOptions.projectDescription = 'desc';
      // resOptions.projectLink = 'https://google.com/wow';
      // res.render('pages/submitproject.ejs', resOptions);
      if (mongoose.Types.ObjectId.isValid(req.params.projectId)) {
        Project.findById(req.params.projectId, (err, data) => {
          if (err) {
            console.error(err);
            const error = new Error('Internal server error');
            error.status = 500;
            next(error);
          } else {
            resOptions.projectId = req.params.projectId;
            resOptions.projectTitle = data.name;
            resOptions.projectDescription = data.description;
            resOptions.projectLink = data.url;
            if (Number(data.deadline) * 1000 > new Date().getTime()) {
              // valid time
              resOptions.deadlinePassed = false;
            } else {
              resOptions.deadlinePassed = true;
            }
            res.render('pages/submitproject.ejs', resOptions);
          }
        });
      } else {
        const error = new Error('Not found');
        error.status = 404;
        next(error);
      }
    } else {
      res.redirect('/admin');
    }
  } else {
    res.redirect('/login');
  }
});

module.exports = router;

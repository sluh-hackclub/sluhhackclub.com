const express = require('express');
const router = express.Router();

const mongoose = require('mongoose');

const User = require('../models/user.js');
const Submission = require('../models/submission.js');
const Project = require('../models/project.js');

const formatDate = date => {
  var hours = date.getHours();
  var minutes = date.getMinutes();
  var ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  // hours = hours ? hours : 12; // the hour '0' should be '12'
  hours = hours || 12; // the hour '0' should be '12'
  minutes = minutes < 10 ? '0' + minutes : minutes;
  var strTime = hours + ':' + minutes + ' ' + ampm;
  return strTime + ' ' + (date.getMonth() + 1) + '/' + date.getDate() + '/' + date.getFullYear();
};

router.get('/', (req, res, next) => {
  if (req.session.loggedIn && req.session.userType === 'admin') {
    let resOptions = {};
    resOptions.firstName = req.session.firstName;
    User.countDocuments({user_type: 'student'}, (err, count) => {
      if (err) {
        console.error(err);
        const error = new Error('Internal server error');
        error.status = 500;
        next(error);
      } else {
        // subtract one while there is a dummy student account
        resOptions.studentCount = count - 1;
        Submission.find({
          reviewed: false
        }).then(doc => {
          // console.log(doc);
          resOptions.newSubmissions = doc;
          res.render('pages/admin.ejs', resOptions);
          // console.log(typeof doc[0]._id.toString());
        });
      }
    });
  } else if (req.session.loggedIn && req.session.userType === 'student') {
    res.redirect('/dashboard');
  } else {
    res.redirect('/login');
  }
});

router.get('/submissions', (req, res, next) => {
  if (req.session.loggedIn && req.session.userType === 'admin') {
    Submission.find({}).then(doc => {
      let resOptions = {};
      resOptions.submissions = [];
      console.log(doc);
      let counter = 0;
      doc.forEach((entry, index) => {
        resOptions.submissions[index] = {};
        resOptions.submissions[index].title = entry.title;
        resOptions.submissions[index].reviewed = entry.reviewed;
        resOptions.submissions[index].id = entry._id;
        // TEMPORARY
        resOptions.submissions[index].project = 'Project Name';
        User.find({email: entry.email}).then(userDoc => {
          console.log('USER ' + entry.email);
          console.log(userDoc);
          resOptions.submissions[index].name = userDoc[0].last_name + ', ' + userDoc[0].first_name;
          console.log('COUNTER: ' + counter);
          if (counter === doc.length - 1) {
            console.log('DONE');
            console.log('RESOPTIONS:');
            console.log(resOptions);
            res.render('pages/submissions.ejs', resOptions);
          }
          counter++;
        });
      });
    });
  } else {
    res.redirect('/login');
  }
});

router.get('/submissions/:submissionId', (req, res, next) => {
  if (req.session.loggedIn && req.session.userType === 'admin') {
    const resOptions = {};
    resOptions.submissionId = req.params.submissionId;
    // check if the supplied object id is valid
    if (mongoose.Types.ObjectId.isValid(req.params.submissionId)) {
      Submission.findById(req.params.submissionId, (err, data) => {
        if (err) {
          console.error(err);
          const error = new Error('Internal server error');
          error.status = 500;
          next(error);
        } else {
          if (data === null) {
            // if there is nothing found for that object id
            const error = new Error('Not found');
            error.status = 404;
            next(error);
          } else {
            resOptions.submissionTitle = data.title;
            resOptions.submissionURL = data.url;
            resOptions.submissionNotes = data.notes;
            resOptions.submissionEmail = data.email;
            resOptions.submissionReviewed = data.reviewed;
            resOptions.submissionProjectId = data.project_id;
            // query db for user information
            User.find({
              email: resOptions.submissionEmail
            }, (err, data) => {
              if (err) {
                console.error(err);
                const error = new Error('Internal server error');
                error.status = 500;
                next(error);
              } else {
                // console.log(data);
                resOptions.submissionFirstName = data[0].first_name;
                resOptions.submissionLastName = data[0].last_name;
                res.render('pages/submission.ejs', resOptions);
              }
            });
          }
          // res.status(200).json({});
        }
      });
    } else {
      // invalid object id
      const error = new Error('Not found');
      error.status = 404;
      next(error);
    }
  } else {
    res.redirect('/login');
  }
});

router.get('/projects', (req, res, next) => {
  if (req.session.loggedIn && req.session.userType === 'admin') {
    Project.find({}).then(doc => {
      let resOptions = {};
      resOptions.entries = [];
      console.log(doc);
      let counter = 0;
      if (doc.length > 0) {
        doc.forEach((entry, index) => {
          resOptions.entries[index] = {};
          resOptions.entries[index].title = entry.name;
          resOptions.entries[index].deadline = formatDate(new Date(entry.deadline * 1000));
          resOptions.entries[index].id = entry._id;
          console.log('ID: ' + entry._id);
          console.log('typeof: ' + typeof entry._id);
          console.log('str: ' + entry._id.str);
          console.log('str typeof: ' + typeof entry._id.str);
          console.log('casted: ' + typeof (entry._id + ''));
          Submission.countDocuments({project_id: entry._id + ''}).then(submissionCount => {
            console.log('COUNT: ' + submissionCount);
            resOptions.entries[index].submissionCount = submissionCount;
            console.log('COUNTER: ' + counter);
            if (counter === doc.length - 1) {
              console.log('DONE');
              console.log('RESOPTIONS:');
              console.log(resOptions);
              res.render('pages/projectsadmin.ejs', resOptions);
            }
            counter++;
          });
        });
      } else {
        res.render('pages/projectsadmin.ejs', {entries: []});
      }
    });
  } else {
    res.redirect('/login');
  }
});

router.get('/projects/create', (req, res, next) => {
  if (req.session.loggedIn && req.session.userType === 'admin') {
    res.render('pages/createproject.ejs');
  } else {
    res.redirect('/login');
  }
});

router.get('/projects/:projectId', (req, res, next) => {
  res.render('pages/projectadmin.ejs', {
    projectId: '782934rwnf89dsfn',
    projectTitle: 'Project',
    projectDescription: 'Test Project Render'
  });
});

module.exports = router;

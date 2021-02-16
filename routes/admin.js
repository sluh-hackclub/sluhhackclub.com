const express = require('express');
const router = express.Router();

const mongoose = require('mongoose');

const User = require('../models/user.js');
const Submission = require('../models/submission.js');
const Project = require('../models/project.js');

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
          resOptions.newSubmissions = doc;
          // first determine the latest project
          // find projects with unix timestamp greater than current time
          Project.find({}).then(doc => {
            // doc is an array of all documents
            // make a new array with all documents greater than current unix time
            // console.log('test1')
            // console.log(doc)
            const currentProjects = doc.filter(document => {
              return Number(document.deadline) > Math.round(new Date().getTime() / 1000);
            });
            // console.log('test2')
            // console.log(currentProjects)
            // sort currentProjects array by deadline
            currentProjects.sort((a, b) => Number(a.deadline) - Number(b.deadline));
            const currentProject = currentProjects[0];
            if (currentProject === undefined) {
              // There is no current project
              resOptions.currentProjectExists = false;
              res.render('pages/admin.ejs', resOptions);
            } else {
              // There is a current project
              resOptions.currentProjectExists = true;
              resOptions.currentProjectTitle = currentProject.name;
              Submission.countDocuments({'project_id': currentProject._id + ''}, (err, count) => {
                if (err) {
                  console.error(err);
                  const error = new Error('Internal server error');
                  error.status = 500;
                  next(error);
                } else {
                  resOptions.currentProjectSubmissions = count;
                  res.render('pages/admin.ejs', resOptions);
                }
              });
            }
          });
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
    // This is the old, really bad and convoluted code that made way too many
    // database calls. I will try to refactor to use the new mongodb $lookup
    // and the corresponding mongoose populate().
    // console.time('oldCode')
    // Submission.find({}).then(doc => {
    //   let resOptions = {};
    //   resOptions.submissions = [];
    //   // console.log(doc);
    //   let counter = 0;
    //   let counter2 = 0;
    //   let noIdCounter = 0;
    //   doc.forEach((entry, index) => {
    //     resOptions.submissions[index] = {};
    //     resOptions.submissions[index].title = entry.title;
    //     resOptions.submissions[index].reviewed = entry.reviewed;
    //     resOptions.submissions[index].id = entry._id;
    //     // TEMPORARY
    //     // resOptions.submissions[index].project = 'Project Name';
    //     User.find({email: entry.email}).then(userDoc => {
    //       // console.log('USER ' + entry.email);
    //       // console.log(userDoc);
    //       resOptions.submissions[index].name = userDoc[0].last_name + ', ' + userDoc[0].first_name;
    //       // console.log('COUNTER: ' + counter);
    //       if (counter === doc.length - 1) {
    //         // console.log('DONE');
    //         // console.log('RESOPTIONS:');
    //         // console.log(resOptions);
    //         doc.forEach((entry, index) => {
    //           if (mongoose.Types.ObjectId.isValid(entry.project_id)) {
    //             Project.findById(entry.project_id, (err, data) => {
    //               if (err) {
    //                 console.error(err);
    //                 const error = new Error('Internal server error');
    //                 error.status = 500;
    //                 next(error);
    //               }
    //               resOptions.submissions[index].project = data.name;
    //               if (counter2 === doc.length - 1) {
    //                 // final render
    //                 res.render('pages/submissions.ejs', resOptions);
    //                 console.timeEnd('oldCode')
    //                 // console.log('begin resOptions');
    //                 // console.log(resOptions);
    //                 // console.log('end resOptions');
    //               }
    //               counter2++;
    //             });
    //           } else {
    //             // resOptions.submissions[index].project = 'Unknown Project';
    //             counter2++;
    //             noIdCounter++;
    //             if (noIdCounter === doc.length) {
    //               res.render('pages/submissions.ejs', resOptions);
    //             }
    //           }
    //           // counter2++;
    //         });
    //         // TODO res.render('pages/submissions.ejs', resOptions);
    //       }
    //       counter++;
    //     });
    //   });
    // });
    // End really bad and old code. Begin new, (hopefully) better code.
    console.time('newCode')
    const resOptions2 = {};
    resOptions2.submissions = [];
    Submission.find({}).populate('project_objectid', 'name').populate('user_objectid', 'first_name last_name').exec((err, submissions) => {
      // console.log(submissions);
      for (let i = 0; i < submissions.length; i++) {
        resOptions2.submissions[i] = {};
        resOptions2.submissions[i].title = submissions[i].title;
        if (submissions[i].project_objectid !== null) {
          resOptions2.submissions[i].project = submissions[i].project_objectid.name;
        }
        if (submissions[i].user_objectid !== null) {
          resOptions2.submissions[i].name = submissions[i].user_objectid.last_name + ', ' + submissions[i].user_objectid.first_name;
        }
        resOptions2.submissions[i].reviewed = submissions[i].reviewed;
        resOptions2.submissions[i].id = submissions[i]._id;
      }
      res.render('pages/submissions.ejs', resOptions2);
      // console.timeEnd('newCode')
      // console.log('begin resOptions2');
      // console.log(resOptions2);
      // console.log('end resOptions2');
    });
    // End better code
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
            // resOptions.submissionProjectId = data.project_id;
            // query db for user information
            User.find({
              email: resOptions.submissionEmail
            }, (err, userData) => {
              if (err) {
                console.error(err);
                const error = new Error('Internal server error');
                error.status = 500;
                next(error);
              } else {
                // console.log(userData);
                resOptions.submissionFirstName = userData[0].first_name;
                resOptions.submissionLastName = userData[0].last_name;
                // console.log(data.project_id);
                if (mongoose.Types.ObjectId.isValid(data.project_id)) {
                  Project.findById(data.project_id, (err, projectData) => {
                    if (err) {
                      console.error(err);
                      const error = new Error('Internal server error');
                      next(error);
                    } else {
                      if (!(projectData === undefined)) {
                        resOptions.projectTitle = projectData.name;
                      } else {
                        // bad project id
                      }
                      res.render('pages/submission.ejs', resOptions);
                    }
                  });
                } else {
                  res.render('pages/submission.ejs', resOptions);
                }
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
      // console.log(doc);
      let counter = 0;
      if (doc.length > 0) {
        doc.forEach((entry, index) => {
          resOptions.entries[index] = {};
          resOptions.entries[index].title = entry.name;
          resOptions.entries[index].deadline = formatDate(new Date(entry.deadline * 1000));
          resOptions.entries[index].id = entry._id;
          // console.log('ID: ' + entry._id);
          // console.log('typeof: ' + typeof entry._id);
          // console.log('str: ' + entry._id.str);
          // console.log('str typeof: ' + typeof entry._id.str);
          // console.log('casted: ' + typeof (entry._id + ''));
          Submission.countDocuments({project_id: entry._id + ''}).then(submissionCount => {
            // console.log('COUNT: ' + submissionCount);
            resOptions.entries[index].submissionCount = submissionCount;
            // console.log('COUNTER: ' + counter);
            if (counter === doc.length - 1) {
              // console.log('DONE');
              // console.log('RESOPTIONS:');
              // console.log(resOptions);
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
  const resOptions = {};
  if (req.session.loggedIn) {
    if (req.session.userType === 'admin') {
      if (mongoose.Types.ObjectId.isValid(req.params.projectId)) {
        Project.findById(req.params.projectId, (err, doc) => {
          if (err) {
            console.error(err);
            const error = new Error('Internal server error');
            error.status = 500;
            next(error);
          } else {
            if (doc === null) {
              const error = new Error('Not found');
              error.status = 404;
              next(error);
            } else {
              resOptions.projectId = req.params.projectId;
              resOptions.projectTitle = doc.name;
              resOptions.projectDescription = doc.description;
              resOptions.projectLink = doc.url;
              res.render('pages/projectadmin.ejs', resOptions);
            }
          }
        });
      } else {
        const error = new Error('Not found');
        error.status = 404;
        next(error);
      }
    } else {
      res.redirect('/dashboard');
    }
  } else {
    res.redirect('/login');
  }
  // res.render('pages/projectadmin.ejs', {
  //   projectId: '782934rwnf89dsfn',
  //   projectTitle: 'Project',
  //   projectDescription: 'Test Project Render (NOT DONE)',
  //   projectLink: 'https://github.com'
  // });
});

router.get('/users/search', (req, res, next) => {
  if (req.session.loggedIn && req.session.userType === 'admin') {
    res.redirect('/admin/users');
  } else {
    res.redirect('/login');
  }
});

router.get('/users/search/:userSearch', (req, res, next) => {
  if (req.session.loggedIn && req.session.userType === 'admin') {
    const resOptions = {};
    User.aggregate([
      { $project: { name: { $concat: [ '$first_name', ' ', '$last_name', ' ', '$email', ' ', '$student_id' ] }, email: 1, first_name: 1, last_name: 1 } },
      { $match: { name: { $regex: new RegExp(req.params.userSearch, 'i') } } }
    ])
      // .limit(3)
      .then(response => {
        // console.log(response);
        // response.forEach((item, index) => {
        //
        // });
        // res.status(200).json({
        //   success: true,
        //   results: response
        // });
        resOptions.entries = response;
        resOptions.searchTerm = req.params.userSearch;
        // console.log(resOptions);
        res.render('pages/usersearch.ejs', resOptions);
      });
  } else {
    res.redirect('/login');
  }
});

router.get('/users', (req, res, next) => {
  if (req.session.loggedIn && req.session.userType === 'admin') {
    const resOptions = {};
    User.aggregate([
      { $project: { name: { $concat: [ '$first_name', ' ', '$last_name', ' ', '$email', ' ', '$student_id' ] }, email: 1, first_name: 1, last_name: 1 } },
      { $match: { name: { $regex: new RegExp('', 'i') } } }
    ])
      // .limit(3)
      .then(response => {
        // console.log(response);
        // response.forEach((item, index) => {
        //
        // });
        // res.status(200).json({
        //   success: true,
        //   results: response
        // });
        resOptions.entries = response;
        // resOptions.searchTerm = req.params.userSearch;
        // console.log(resOptions);
        res.render('pages/allusers.ejs', resOptions);
      });
  } else {
    res.redirect('/login');
  }
});

module.exports = router;

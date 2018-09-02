const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const request = require('request');

const userTypes = require('./userTypes.json');

const User = require('./models/user.js');
const Submission = require('./models/submission.js');

router.post('/auth', (req, res, next) => {
  // if already logged in, redirect to dashboard
  if (req.session.loggedIn) {
    if (req.session.userType === 'student') {
      res.status(200).json({
        success: true,
        loggedIn: true,
        userType: 'student',
        redirectTo: '/dashboard'
      });
    } else if (req.session.userType === 'admin') {
      res.status(200).json({
        success: true,
        loggedIn: true,
        userType: 'admin',
        redirectTo: '/admin'
      });
    } else {
      // unknown user_type
      req.session.loggedIn = false;
      res.status(200).json({
        success: true,
        loggedIn: false,
        redirectTo: '/login'
      });
    }
  } else {
    if (req.body.email && req.body.password) {
      User.find({
        email: req.body.email
      }).then(doc => {
        if (doc.length > 0 && doc[0].password && doc[0].user_type && userTypes.indexOf(doc[0].user_type) !== -1) {
          bcrypt.compare(req.body.password, doc[0].password, (err, result) => {
            if (result) {
              req.session.email = doc[0].email;
              req.session.userType = doc[0].user_type;
              req.session.firstName = doc[0].first_name;
              req.session.lastName = doc[0].last_name;
              req.session.loggedIn = true;
              // console.log(doc[0]);
              if (doc[0].user_type === 'student') {
                res.status(200).json({
                  success: true,
                  loggedIn: true,
                  userType: 'student',
                  redirectTo: '/dashboard'
                });
              } else if (doc[0].user_type === 'admin') {
                res.status(200).json({
                  success: true,
                  loggedIn: true,
                  userType: 'admin',
                  redirectTo: '/admin'
                });
              }
            } else {
              // Login fail due to incorrect password
              req.session.loggedIn = false;
              res.status(200).json({
                success: true,
                loggedIn: false,
                message: 'Login unsuccessful: unknown email or password',
                redirectTo: '/login'
              });
            }
            if (err) {
              console.error(err);
              req.session.loggedIn = false;
              res.status(500).json({
                success: false,
                loggedIn: false,
                error: 'Internal server error',
                redirectTo: '/login'
              });
            }
          });
        } else {
          // No user
          req.session.loggedIn = false;
          res.status(200).json({
            success: true,
            loggedIn: false,
            message: 'Login unsuccessful: unknown email or password',
            redirectTo: '/login'
          });
        }
      });
    } else {
      // correct body not supplied
      res.status(400).json({
        success: false,
        loggedIn: false,
        error: 'Correct body not supplied',
        redirectTo: '/login'
      });
    }
  }
});

router.get('/logout', (req, res, next) => {
  // req.session.destroy();
  req.session.loggedIn = false;
  res.status(200).json({
    success: true,
    loggedIn: false,
    redirectTo: '/'
  });
});

router.patch('/submission/:submissionId', (req, res, next) => {
  if (req.session.loggedIn && req.session.userType === 'admin') {
    const id = req.params.submissionId;
    if (mongoose.Types.ObjectId.isValid(id)) {
      const updateOps = {};
      for (const ops in req.body) {
        if (req.body.hasOwnProperty(ops)) {
          updateOps[ops] = req.body[ops];
        }
      }
      // clear out bad parameters we don't want changed
      if (typeof updateOps._id !== 'undefined') {
        delete updateOps._id;
      }
      if (typeof updateOps.project_id !== 'undefined') {
        delete updateOps.project_id;
      }
      if (typeof updateOps.timestamp !== 'undefined') {
        delete updateOps.timestamp;
      }
      if (typeof updateOps.last_edit !== 'undefined') {
        delete updateOps.last_edit;
      }
      Submission.update({ _id: id }, { $set: updateOps })
        .exec()
        .then(result => {
          console.log(result);
        })
        .catch(error => {
          console.error(error);
        });
      res.status(200).json({});
    } else {
      res.status(400).json({
        success: false,
        error: 'Invalid submission id'
      });
    }
  } else {
    res.status(401).json({
      success: false,
      error: '401 Forbidden'
    });
  }
});

router.post('/slack_invite', (req, res, next) => {
  if (typeof req.body.email !== 'undefined') {
    request.post({
      url: 'https://sluhhackclub.slack.com/api/users.admin.invite',
      form: {
        email: req.body.email,
        token: process.env.SLACK_OAUTH,
        set_active: true
      }
    }, (error, httpResponse, body) => {
      if (error) {
        console.error(error);
        res.status(500).json({
          success: false,
          error: 'Internal server error'
        });
      } else {
        body = JSON.parse(body);
        // console.log(body);
        if (body.ok) {
          res.status(200).json({
            success: true,
            invited: true
          });
        } else if (body.error === 'already_invited' || body.error === 'already_in_team' || body.error === 'user_disabled') {
          res.status(200).json({
            success: true,
            invited: false,
            message: 'Already in workspace'
          });
        } else {
          console.error(body);
          res.status(500).json({
            success: false,
            error: 'Internal server error'
          });
        }
      }
    });
  } else {
    res.status(400).json({
      success: false,
      error: 'Bad request'
    });
  }
});

module.exports = router;

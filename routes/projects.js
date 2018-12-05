const express = require('express');
const router = express.Router();

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
  // res.status(200).send('<h1>Projects Index</h1>');
  const resOptions = {};
  if (req.session.loggedIn) {
    resOptions.loggedIn = true;
    if (req.session.userType === 'admin') {
      resOptions.userType = 'admin';
    } else if (req.session.userType === 'student') {
      resOptions.userType = 'student';
    }
  }
  resOptions.entries = [];
  Project.find({}).then(doc => {
    doc.forEach((entry, index) => {
      resOptions.entries[index] = {};
      resOptions.entries[index].title = entry.name;
      resOptions.entries[index].deadline = formatDate(new Date(entry.deadline * 1000));
      resOptions.entries[index].id = entry._id;
    });
    res.render('pages/projects.ejs', resOptions);
  });
});

router.get('/current', (req, res, next) => {
  const resOptions = {};
  if (req.session.loggedIn) {
    resOptions.loggedIn = true;
    if (req.session.userType === 'admin') {
      resOptions.userType = 'admin';
    } else if (req.session.userType === 'student') {
      resOptions.userType = 'student';
    }
  }
  resOptions.projectTitle = 'Chart.js Frontend';
  res.render('pages/project.ejs', resOptions);
});

module.exports = router;

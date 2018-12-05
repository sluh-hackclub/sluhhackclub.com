const express = require('express');
const router = express.Router();

router.get('/', (req, res, next) => {
  const resOptions = {};
  if (req.session.loggedIn) {
    resOptions.loggedIn = true;
    if (req.session.userType === 'admin') {
      resOptions.userType = 'admin';
    } else if (req.session.userType === 'student') {
      resOptions.userType = 'student';
    }
  } else {
    resOptions.loggedIn = false;
  }
  res.render('pages/calendar.ejs', resOptions);
});

module.exports = router;

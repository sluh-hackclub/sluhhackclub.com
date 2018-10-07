const express = require('express');
const router = express.Router();

router.get('/', (req, res, next) => {
  const resOptions = {};
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
  res.render('pages/index.ejs', resOptions);
});

module.exports = router;

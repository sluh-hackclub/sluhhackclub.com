const express = require('express');
const router = express.Router();

router.get('/', (req, res, next) => {
  if (req.session.loggedIn) {
    if (req.session.userType === 'admin') {
      res.render('pages/slack.ejs');
    } else {
      res.redirect('/dashboard');
    }
  } else {
    res.redirect('/login');
  }
});

module.exports = router;

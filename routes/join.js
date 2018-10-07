const express = require('express');
const router = express.Router();

router.get('/', (req, res, next) => {
  if (req.session.loggedIn) {
    if (req.session.userType === 'student') {
      res.redirect('/dashboard');
    } else if (req.session.userType === 'admin') {
      res.redirect('/admin');
    }
  } else {
    res.render('pages/register.ejs');
  }
});

module.exports = router;

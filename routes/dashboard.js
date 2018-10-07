const express = require('express');
const router = express.Router();

router.get('/', (req, res, next) => {
  if (req.session.loggedIn) {
    if (req.session.userType === 'admin') {
      res.redirect('/admin');
    } else {
      // res.render('pages/dashboard.ejs');
      res.render('pages/dashboard_temp.ejs');
    }
  } else {
    res.redirect('/login');
  }
});

module.exports = router;

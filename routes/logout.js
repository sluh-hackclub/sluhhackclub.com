const express = require('express');
const router = express.Router();

router.get('/', (req, res, next) => {
  req.session.loggedIn = false;
  res.redirect('/');
});

module.exports = router;

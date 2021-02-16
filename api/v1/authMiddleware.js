const protectedRoutes = {};

protectedRoutes.protectedAdmin = (req, res, next) => {
  if (req.session.loggedIn === true) {
    if (req.session.userType === 'admin') {
      next();
    } else {
      const error = new Error('Not authorized');
      error.status = 401;
      next(error);
    }
  } else {
    const error = new Error('Not authorized');
    error.status = 401;
    next(error);
  }
};

protectedRoutes.protectedLoggedIn = (req, res, next) => {
  if (req.session.loggedIn === true) {

  }
};

module.exports = protectedRoutes;

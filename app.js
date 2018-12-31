const express = require('express');
const app = express();
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');
const session = require('express-session');
const mongoose = require('mongoose');
const MongoStore = require('connect-mongo')(session);

// Routes
const apiV1 = require('./api/v1/v1.js');

const adminRoute = require('./routes/admin.js');
const leaderboardRoute = require('./routes/leaderboard.js');
const slackInviteRoute = require('./routes/slackInvite.js');
const dashboardRoute = require('./routes/dashboard.js');
const homeRoute = require('./routes/home.js');
const logoutRoute = require('./routes/logout.js');
const loginRoute = require('./routes/login.js');
const joinRoute = require('./routes/join.js');
const projectsRoute = require('./routes/projects.js');
const calendarRoute = require('./routes/calendar.js');

let mongooseProtocol = 'mongodb://';
if (process.env.MONGO_SRV === 'true') {
  mongooseProtocol = 'mongodb+srv://';
}

let mongooseConnectionString = '';
if (process.env.MONGO_USER && process.env.MONGO_PW) {
  mongooseConnectionString = mongooseProtocol + process.env.MONGO_USER + ':' + process.env.MONGO_PW + '@' + process.env.MONGO_HOST + '/' + process.env.MONGO_DB + '?retryWrites=true';
} else {
  mongooseConnectionString = mongooseProtocol + process.env.MONGO_HOST + '/' + process.env.MONGO_DB + '?retryWrites=true';
}

mongoose.connect(mongooseConnectionString, {
  useNewUrlParser: true
}).then(() => {
  console.log('Mongoose connected to ' + process.env.MONGO_HOST + '/' + process.env.MONGO_DB);
}).catch(err => {
  console.error('Mongoose connection error:');
  console.error(err);
  process.exit(1);
});

const db = mongoose.connection;

if (typeof process.env.NODE_ENV !== 'undefined' && process.env.NODE_ENV === 'production') {
  console.log('App started in production mode');
  // if a file/directory called 'logs' doesn't exist, create it
  if (!fs.existsSync('./logs')) {
    fs.mkdirSync('./logs');
  }
  // check if '/logs' is a file or directory
  fs.lstat(path.join(__dirname, '/logs'), (err, stats) => {
    if (err) {
      console.error(err);
      process.exit(1);
    } else {
      if (stats.isDirectory()) {
        const accessLogStream = fs.createWriteStream(path.join(__dirname, 'logs/access.log'), {flags: 'a'});
        app.use(morgan('combined', {stream: accessLogStream}));
      } else {
        console.error('NODE_ENV is set to "production", but ./logs is a file.');
        process.exit(1);
      }
    }
  });
} else {
  console.log('App started in dev mode');
  app.use(morgan('dev'));
}

app.use(express.urlencoded({extended: false}));
app.use(express.json());
app.use(express.static(path.join(__dirname, '/static')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '/templates'));

const sess = {
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: new MongoStore({ mongooseConnection: db }),
  cookie: {
    maxAge: 86400000 // 86400000 ms = 1 day (1 * 24 * 60 * 60 * 1000)
  }
};
if (app.get('env') === 'production') {
  app.set('trust proxy', 1);
  sess.cookie.secure = true;
}
app.use(session(sess));

// Send CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') {
    // amend with all allowed HTTP methods
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE');
    return res.status(200).json({});
  }
  next();
});

app.use('/api/v1', apiV1);
app.use('/', homeRoute);
app.use('/login', loginRoute);
app.use('/logout', logoutRoute);
app.use('/join', joinRoute);
app.use('/leaderboard', leaderboardRoute);
app.use('/admin', adminRoute);
app.use('/slack_invite', slackInviteRoute);
app.use('/dashboard', dashboardRoute);
app.use('/projects', projectsRoute);
app.use('/calendar', calendarRoute);

app.get('/slack', (req, res, next) => {
  res.redirect('https://sluhhackclub.slack.com');
});

app.use((req, res, next) => {
  const error = new Error('Not found');
  error.status = 404;
  next(error);
});

app.use((error, req, res, next) => {
  res.status(error.status || 500);
  if (error.status === 404) {
    const resOptions = {};
    resOptions.originalUrl = req.originalUrl;
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
    res.render('errors/404.ejs', resOptions);
  } else {
    res.render('errors/500.ejs');
  }
});

module.exports = app;

const express = require('express');
const app = express();
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');
const session = require('express-session');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

const apiV1 = require('./api/v1/v1.js');

const User = require('./api/v1/models/user.js');
const Submission = require('./api/v1/models/submission.js');
const LeaderboardEntry = require('./api/v1/models/leaderboardEntry.js');

if (fs.existsSync(path.join(__dirname, '/.env'))) {
  dotenv.load({ path: '.env' });
} else {
  console.error('ERROR: Missing .env file, reference .env.example');
  process.exit(1);
}

// Check for all required environmental variables
if (typeof process.env.MONGO_HOST !== 'undefined' && typeof process.env.MONGO_USER !== 'undefined' && typeof process.env.MONGO_PW !== 'undefined' && typeof process.env.MONGO_DB !== 'undefined' && typeof process.env.SESSION_SECRET !== 'undefined' && typeof process.env.SLACK_OAUTH !== 'undefined') { /* All env vars are present */ } else {
  console.error('Missing environmental variables, reference .env.example');
  process.exit(1);
}

mongoose.connect('mongodb+srv://' + process.env.MONGO_USER + ':' + process.env.MONGO_PW + '@' + process.env.MONGO_HOST + '/' + process.env.MONGO_DB + '?retryWrites=true', {
  useNewUrlParser: true
}).then(() => {
  console.log('Database connected');
}).catch(err => {
  console.error('Database connection error:');
  console.error(err);
  process.exit(1);
});

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
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false
}));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '/templates'));

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

app.get('/', (req, res, next) => {
  let resOptions = {};
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

app.get('/login', (req, res, next) => {
  if (req.session.loggedIn) {
    if (req.session.userType === 'student') {
      res.redirect('/dashboard');
    } else if (req.session.userType === 'admin') {
      res.redirect('/admin');
    }
  } else {
    res.render('pages/login.ejs');
  }
});

app.get('/logout', (req, res, next) => {
  req.session.loggedIn = false;
  res.redirect('/');
});

app.get('/join', (req, res, next) => {
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

app.get('/leaderboard', (req, res, next) => {
  // const newLeaderboardEntry = new LeaderboardEntry({
  //   name: 'Daniel Blittschau',
  //   current_score: '0',
  //   total_score: '500'
  // });
  // newLeaderboardEntry.save();
  let resOptions = {};
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
  // BEGIN TEMPORARY DATA
  // resOptions.leaderboardRankings = [
  //   {name: 'Micah', currentProjectScore: '100', totalScore: '200'},
  //   {name: 'Daniel', currentProjectScore: '0', totalScore: '500'},
  //   {name: 'Ben', currentProjectScore: '0', totalScore: '500'},
  //   {name: 'Sean', currentProjectScore: '0', totalScore: '100'}
  // ];
  LeaderboardEntry.find({}).then(doc => {
    resOptions.rankedMemberCount = doc.length;
    resOptions.submissionCount = doc.length;
    // console.log(doc);
    resOptions.leaderboardRankings = doc;
    // console.log(resOptions.leaderboardRankings);
    resOptions.currentProject = 'Personal Dashboard';
    // resOptions.submissionCount = '60';
    // resOptions.rankedMemberCount = await User.count();
    // END TEMPORARY DATA
    // sort array of rankings
    resOptions.leaderboardRankings.sort((a, b) => {
      return Number(b.totalScore) - Number(a.totalScore);
    });
    // limit array to 10 entries
    // disabled at the Micah's request
    // resOptions.leaderboardRankings.splice(10);
    res.render('pages/leaderboard.ejs', resOptions);
  });
});

app.get('/admin', (req, res, next) => {
  if (req.session.loggedIn && req.session.userType === 'admin') {
    let resOptions = {};
    resOptions.firstName = req.session.firstName;
    User.countDocuments({user_type: 'student'}, (err, count) => {
      if (err) {
        console.error(err);
        const error = new Error('Internal server error');
        error.status = 500;
        next(error);
      } else {
        resOptions.studentCount = count;
        Submission.find({
          reviewed: false
        }).then(doc => {
          // console.log(doc);
          resOptions.newSubmissions = doc;
          res.render('pages/admin.ejs', resOptions);
          // console.log(typeof doc[0]._id.toString());
        });
      }
    });
  } else if (req.session.loggedIn && req.session.userType === 'student') {
    res.redirect('/dashboard');
  } else {
    res.redirect('/');
  }
});

app.get('/slack_invite', (req, res, next) => {
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

app.get('/slack', (req, res, next) => {
  res.redirect('https://sluhhackclub.slack.com');
});

app.get('/dashboard', (req, res, next) => {
  if (req.session.loggedIn) {
    if (req.session.userType === 'admin') {
      res.redirect('/admin');
    } else {
      res.render('pages/dashboard_temp.ejs');
    }
  } else {
    res.redirect('/login');
  }
});

app.get('/admin/submissions/:submissionId', (req, res, next) => {
  if (req.session.loggedIn && req.session.userType === 'admin') {
    let resOptions = {};
    resOptions.submissionId = req.params.submissionId;
    // check if the supplied object id is valid
    if (mongoose.Types.ObjectId.isValid(req.params.submissionId)) {
      Submission.findById(req.params.submissionId, (err, data) => {
        if (err) {
          console.error(err);
          const error = new Error('Internal server error');
          error.status = 500;
          next(error);
        } else {
          if (data === null) {
            // if there is nothing found for that object id
            const error = new Error('Not found');
            error.status = 404;
            next(error);
          } else {
            resOptions.submissionTitle = data.title;
            resOptions.submissionURL = data.url;
            resOptions.submissionNotes = data.notes;
            resOptions.submissionEmail = data.email;
            resOptions.submissionReviewed = data.reviewed;
            resOptions.submissionProjectId = data.project_id;
            // query db for user information
            User.find({
              email: resOptions.submissionEmail
            }, (err, data) => {
              if (err) {
                console.error(err);
                const error = new Error('Internal server error');
                error.status = 500;
                next(error);
              } else {
                // console.log(data);
                resOptions.submissionFirstName = data[0].first_name;
                resOptions.submissionLastName = data[0].last_name;
                res.render('pages/submission.ejs', resOptions);
              }
            });
          }
          // res.status(200).json({});
        }
      });
    } else {
      // invalid object id
      res.status(400).json({'error': 'bad request'});
    }
  } else {
    res.redirect('/login');
  }
});

app.use((req, res, next) => {
  const error = new Error('Not found');
  error.status = 404;
  next(error);
});

app.use((error, req, res, next) => {
  res.status(error.status || 500);
  // console.log(error);
  if (error.status === 404) {
    res.render('errors/404.ejs');
  } else {
    res.render('errors/500.ejs');
  }
});

module.exports = app;

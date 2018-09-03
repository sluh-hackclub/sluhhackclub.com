const app = angular.module('leaderboardApp', []);

var headerData = {
  currentProject: 'Personal Dashboard',
  submissionCount: '60',
  rankedMemberCount: '72'
};

var leaderboardRankings = [
  {name: 'Micah', currentProjectScore: '100', totalScore: '200'},
  {name: 'Daniel', currentProjectScore: '0', totalScore: '50'}
];

app.controller('leaderboardController', function($scope) {
  $scope.headerData = headerData;
  $scope.leaderboardRankings = leaderboardRankings


  //add http requests to populate the header and the leaderboard
})

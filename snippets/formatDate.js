const TIMEZONEOFFSET = -6;

module.exports = date => {
  var date1 = new Date(date);
  date1.setUTCHours(date1.getUTCHours() + TIMEZONEOFFSET);
  var hours = date1.getUTCHours();
  var minutes = date1.getUTCMinutes();
  var ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  // hours = hours ? hours : 12; // the hour '0' should be '12'
  hours = hours || 12; // the hour '0' should be '12'
  minutes = minutes < 10 ? '0' + minutes : minutes;
  var strTime = hours + ':' + minutes + ' ' + ampm;
  return strTime + ' ' + (date1.getUTCMonth() + 1) + '/' + date1.getUTCDate() + '/' + date1.getUTCFullYear();
};

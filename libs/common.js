// TODO: get rid of this and have promise users require their own promises
exports.Promise = require('rsvp').Promise;

// TODO check usage
function wrapError(err) {
  // sometimes the err is a string, other times not. :(
  if (err.length !== undefined) {
    // wrap strings (which have length prop) with Error()
    err = Error(err);
  }
  console.error('Error encountered!');
  console.error(err);
  return err;
}

// TODO check usage
exports.handleError = function (err) {
  throw wrapError(err);
};

// TODO check usage
exports.handleReject = function (reject) {
  return function (err) {
    return reject(wrapError(err));
  };
};

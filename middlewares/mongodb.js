const { MongoClient } = require("mongodb");

module.exports = function(uri, database, opts) {
  if (typeof uri !== "string") {
    throw new TypeError("Expected uri to be a string");
  }

  opts = opts || {};
  const property = opts.property || "db";
  delete opts.property;

  let connection;

  return function mongoDb(req, res, next) {
    if (!connection) {
      connection = MongoClient.connect(
        uri,
        { ...opts, useNewUrlParser: true }
      );
    }

    connection
      .then(function(client) {
        req[property] = client.db(database);
        next();
      })
      .catch(function(err) {
        connection = undefined;
        next(err);
      });
  };
};

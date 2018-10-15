const logger = require("../../logger");

module.exports = async function(req, res) {
  const {
    query: { identifier, domain },
    db
  } = req;

  const term = identifier || domain;
  let searchObject = {};

  if (domain) {
    searchObject = { domains: [domain] };
  } else {
    searchObject = { identifier };
  }

  try {
    logger.info(`[${term}] Trying to find peer...`);

    const peer = await db.collection("peers").findOne(searchObject);

    if (!peer) {
      logger.info(`[${term}] Peer does not exist`);

      return res.send(404);
    }

    logger.info(`[${term}] Peer exists.`);

    res.send({ peer });
  } catch (err) {
    console.log(err);
    logger.error(`[${term}] Could not lookup.`);
  }
};

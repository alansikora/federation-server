const logger = require("../../logger");
const { getOtherPeers } = require("../../utils");

module.exports = async function(req, res) {
  const {
    body: { identifier, domains, server },
    db
  } = req;

  try {
    logger.info(`[${identifier}] Attempting to register peer...`);

    let peer = await db.collection("peers").findOne({ identifier });

    if (peer) {
      logger.info(`[${identifier}] Peer exists, updating...`);

      await db
        .collection("peers")
        .updateOne(
          { identifier },
          { $set: { identifier, domains, server, active: true } }
        );
    } else {
      logger.info(`[${identifier}] Peer is new, registering...`);

      await db.collection("peers").insertOne({
        identifier,
        domains,
        server,
        active: true
      });
    }

    logger.info(`[${identifier}] Peer is registered!`);

    peer = await db.collection("peers").findOne({ identifier });

    logger.info(`[${identifier}] Peer registered!`);

    // Get the other peers
    const otherPeers = await getOtherPeers(db, peer);

    res.send({ peer, otherPeers });
  } catch (err) {
    console.log(err);
    logger.error(`[${identifier}] Could not register.`);
  }
};

const { ObjectId } = require("mongodb");

const request = require("request-promise");

const logger = require("./logger");

async function requestToPeer(peer, method, uri = "", body = {}) {
  const { host, port } = peer;

  const url = `http://${host}:${port}${uri}`;

  let json = null;

  if (method === "POST" || method === "PUT") {
    json = body;
  }

  return await request({
    url,
    method,
    json
  });
}

async function getOtherPeers(db, peer) {
  return await db
    .collection("peers")
    .find({ _id: { $ne: new ObjectId(peer._id) } })
    .toArray();
}

async function propagate(db, peer, method, uri = "", body = {}) {
  const { identifier } = peer;

  // Get all the other peers
  const otherPeers = await getOtherPeers(db, peer);

  const status = {};

  for (const destPeer of otherPeers) {
    try {
      logger.debug(
        `[${identifier}] -> [${destPeer.identifier}:${uri}] Propagating...`
      );

      await requestToPeer(destPeer, method, uri, body);

      status[destPeer.identifier] = true;
    } catch (err) {
      logger.error(
        `[${identifier}] -> [${destPeer.identifier}:${uri}] Could not propagate`
      );

      status[destPeer.identifier] = false;
    }
  }

  return {
    otherPeers,
    status
  };
}

module.exports = {
  requestToPeer,
  getOtherPeers,
  propagate
};

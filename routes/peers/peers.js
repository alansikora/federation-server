const { ObjectID } = require("mongodb");

const request = require("request-promise");
const express = require("express");
const router = express.Router();

module.exports = app => {
  app.use("/peers", router);

  router.post("/register", async function(req, res) {
    const {
      body: { identifier, host, port, users: peerRawUsers },
      db
    } = req;

    console.log(`Attempting to register peer: ${identifier}...`);

    // Register peer
    let peer = await db.collection("peers").findOne({ identifier });

    if (peer) {
      console.log(`Peer:${identifier} already exists, updating...`);

      await db
        .collection("peers")
        .updateOne({ identifier }, { $set: { identifier, host, port } });
    } else {
      console.log(`Peer:${identifier} is new, creating...`);

      await db.collection("peers").insertOne({ identifier, host, port });
    }

    peer = await db.collection("peers").findOne({ identifier });

    console.log(`Peer:${identifier}, upserting users...`);

    for (const peerRawUser of peerRawUsers) {
      peerRawUser.peer = peer;

      await db
        .collection("users")
        .updateOne(
          { _id: peerRawUser._id },
          { $set: peerRawUser },
          { upsert: true }
        );
    }

    console.log(`Peer:${identifier}, sending users to all other peers...`);

    // Get all peer's users
    const peerUsers = await db
      .collection("users")
      .find({ "peer._id": peer._id })
      .toArray();

    // Send the users to all registered peers
    const peers = await db
      .collection("peers")
      .find({ _id: { $ne: new ObjectID(peer._id) } })
      .toArray();

    for (const peer of peers) {
      try {
        console.log(
          `Peer:${identifier}, sending users to ${peer.identifier}...`
        );

        await request({
          url: `http://${peer.host}:${peer.port}/users`,
          method: "PUT",
          json: {
            users: peerUsers
          }
        });
      } catch (err) {
        console.log("Error sending to peer", err);
      }
    }

    console.log(`Getting users from all other peers...`);

    // Get all the other peer's users
    const users = await db
      .collection("users")
      .find({ "peer._id": { $ne: peer._id } })
      .toArray();

    console.log(`Peer:${identifier} registered!`);

    // Send the peer back
    res.send({ peer, users });
  });
};

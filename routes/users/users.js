const { ObjectID } = require("mongodb");

const request = require("request-promise");
const express = require("express");
const router = express.Router();

module.exports = app => {
  app.use("/users", router);

  router.put("/", async function(req, res) {
    const {
      body: { user, peer: fromPeer },
      db
    } = req;

    user.peer = fromPeer;

    await db
      .collection("users")
      .updateOne({ _id: user._id }, { $set: user }, { upsert: 1 });

    console.log(`Attempting to update user from ${fromPeer.identifier}...`);

    // Send the user update to all registered peers
    const peers = await db
      .collection("peers")
      .find({ _id: { $ne: new ObjectID(fromPeer._id) } })
      .toArray();

    for (const peer of peers) {
      try {
        console.log(
          `Peer:${fromPeer.identifier}, sending user to ${peer.identifier}...`
        );

        await request({
          url: `http://${peer.host}:${peer.port}/user`,
          method: "PUT",
          json: {
            user
          }
        });
      } catch (err) {
        console.log("Error sending to peer", err);
      }
    }

    console.log(`User updated: ${fromPeer.identifier}...`);

    res.send(200);
  });
};

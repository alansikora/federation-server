const express = require("express");
const router = express.Router();

const { requestToPeer } = require("../../utils");

module.exports = app => {
  app.use("/users", router);

  router.put("/", async function(req, res) {
    const {
      body: { users, peer: sourcePeer },
      db
    } = req;

    for (const user of users) {
      user.peer = sourcePeer;

      await db
        .collection("users")
        .updateOne({ _id: user._id }, { $set: user }, { upsert: 1 });
    }

    console.log(`[${sourcePeer._id}] Attempting to update user...`);

    // Send the user update to all registered peers
    const destPeers = await db
      .collection("peers")
      .find({ _id: { $ne: sourcePeer._id } })
      .toArray();

    for (const destPeer of destPeers) {
      try {
        console.log(`[${sourcePeer._id}] sending user to ${destPeer._id}...`);

        await requestToPeer(destPeer, "PUT", "/users", {
          users
        });
      } catch (err) {
        console.log(
          `[${sourcePeer._id}] Error sending user to ${destPeer._id}.`,
          err
        );
      }
    }

    console.log(`[${sourcePeer._id}] User updated`);

    res.send(200);
  });
};

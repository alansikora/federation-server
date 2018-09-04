const express = require("express");
const router = express.Router();

const { requestToPeer } = require("../../utils");

module.exports = app => {
  app.use("/peers", router);

  router.post("/", async function(req, res) {
    const {
      body: { identifier, host, port, users: usersToRegister },
      db
    } = req;

    console.log(`[${identifier}] Attempting to register peer...`);

    await db
      .collection("peers")
      .updateOne(
        { _id: identifier },
        { $set: { _id: identifier, host, port } },
        { upsert: true }
      );

    console.log(`[${identifier}] Peer is saved, retrieving...`);

    const peer = await db.collection("peers").findOne({ _id: identifier });

    console.log(`[${identifier}] Upserting users...`);

    for (const userToRegister of usersToRegister) {
      userToRegister.peer = peer;

      await db
        .collection("users")
        .updateOne(
          { _id: userToRegister._id },
          { $set: userToRegister },
          { upsert: true }
        );
    }

    console.log(`[${identifier}] Peer registered!`);

    // Get all the other peers
    const destPeers = await db
      .collection("peers")
      .find({ _id: { $ne: peer._id } })
      .toArray();

    console.log(`[${identifier}] Propagating users...`);

    // Get all users to propagate
    const usersToPropagate = await db
      .collection("users")
      .find({ "peer._id": peer._id })
      .toArray();

    for (const destPeer of destPeers) {
      try {
        console.log(`[${identifier}] Sending users to ${destPeer._id}...`);

        await requestToPeer(destPeer, "PUT", "/users", {
          users: usersToPropagate
        });
      } catch (err) {
        console.log(`[${identifier}] Peer:${peer._id} is not available.`);
      }
    }

    console.log(`[${identifier}] Users sent!`);

    console.log(
      `[${identifier}] Retrieving other peer's users and rooms and sending back...`
    );

    // Get all users to retrieve
    const usersToRetrieve = await db
      .collection("users")
      .find({ "peer._id": { $ne: peer._id } })
      .toArray();

    // Get all rooms to retrieve
    const roomsToRetrieve = await db
      .collection("rooms")
      .find({ "peer._id": { $ne: peer._id } })
      .toArray();

    console.log(`[${identifier}] All done!`);

    // Send data back
    res.send({ peer, users: usersToRetrieve, rooms: roomsToRetrieve });
  });
};

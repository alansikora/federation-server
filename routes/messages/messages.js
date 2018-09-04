const express = require("express");
const router = express.Router();

const { requestToPeer } = require("../../utils");

module.exports = app => {
  app.use("/messages", router);

  router.post("/", async function(req, res) {
    const {
      body: {
        message,
        source: { peer_id: sourcePeerId, user_id: sourceUserId },
        dest: { peer_ids: destPeerIds, room: peerDestRoom, members }
      },
      db
    } = req;

    const sourcePeer = await db
      .collection("peers")
      .findOne({ _id: sourcePeerId });

    const destPeers = await db
      .collection("peers")
      .find({ _id: { $in: destPeerIds } })
      .toArray();

    const identifier = (sourcePeer || {})._id || "Invalid source peer";

    if (!sourcePeer || destPeers.length === 0) {
      const error = `[${identifier}] Can't send message to ${
        destPeers.length
      } peers`;

      console.log(error);

      res.send(400, { error });
      return;
    }

    const sourceUser = await db
      .collection("users")
      .findOne({ _id: sourceUserId });

    if (!sourceUser) {
      const error = `[${identifier}] Can't send message from an invalid user:${sourceUserId}`;

      console.log(error);

      res.send(400, { error });
      return;
    }

    const destRoomMembers = await db
      .collection("users")
      .find({ _id: { $in: members.map(m => m._id) } })
      .toArray();

    if (destRoomMembers.length !== members.length) {
      const error = `[${identifier}] Not all room members are in sync:${
        destRoomMembers.length
      } <> ${members.length}`;

      console.log(error);

      res.send(400, { error });
      return;
    }

    await db
      .collection("rooms")
      .updateOne(
        { _id: peerDestRoom._id },
        { $set: peerDestRoom },
        { upsert: 1 }
      );

    const destRoom = await db
      .collection("rooms")
      .findOne({ _id: peerDestRoom._id });

    if (!destRoom) {
      const error = `[${identifier}] Can't send message to an invalid room:${
        source.room._id
      }`;

      console.log(error);

      res.send(400, { error });
      return;
    }

    for (const destPeer of destPeers) {
      try {
        console.log(`[${identifier}] Sending message to ${destPeer._id}...`);

        await requestToPeer(destPeer, "POST", "/messages", {
          message,
          sourceUser,
          destRoom,
          destRoomMembers
        });
      } catch (err) {
        console.log(
          `[${identifier}] Peer:${destPeer._id} is not available.`,
          err
        );
      }
    }

    console.log(
      `[${sourcePeer._id}] Sent message to ${destPeers.length} peers`
    );

    res.sendStatus(200);
  });
};

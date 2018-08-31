const { ObjectID } = require("mongodb");

const request = require("request-promise");
const express = require("express");
const router = express.Router();

module.exports = app => {
  app.use("/messages", router);

  router.post("/", async function(req, res) {
    const {
      body: { message, from, to },
      db
    } = req;

    const fromPeer = await db
      .collection("peers")
      .findOne({ _id: new ObjectID(from.peer_id) });

    const toPeer = await db
      .collection("peers")
      .findOne({ _id: new ObjectID(to.peer_id) });

    if (!fromPeer || !toPeer) return;

    const fromUser = await db
      .collection("users")
      .findOne({ _id: from.user_id });

    const toUser = await db.collection("users").findOne({ _id: to.user_id });

    if (!fromUser || !toUser) return;

    await request({
      url: `http://${toPeer.host}:${toPeer.port}/message`,
      method: "POST",
      json: {
        message,
        fromPeer,
        fromUser,
        toUser
      }
    });

    console.log(
      `Sent message from ${fromPeer.identifier} to ${toPeer.identifier}`
    );

    res.sendStatus(200);
  });
};

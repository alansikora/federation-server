const express = require("express");
const router = express.Router();

module.exports = app => {
  app.use("/", router);

  router.get("/", async function(req, res) {
    const { db } = req;

    const peers = await db.collection("peers").countDocuments();

    res.send({
      server: process.env.SERVER_NAME,
      peers
    });
  });
};

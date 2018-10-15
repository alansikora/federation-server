const express = require("express");
const router = express.Router();

const register = require("./register");
const lookup = require("./lookup");

module.exports = app => {
  app.use("/peers", router);

  router.post("/", register);
  router.get("/", lookup);
};

const express = require("express");
const bodyParser = require("body-parser");
const mongoDBMiddleware = require("./middlewares/mongodb");

const app = express();
app.use(bodyParser.json());
app.use(mongoDBMiddleware("mongodb://localhost:27017", "federation"));

const router = express.Router();

router.use(function timeLog(req, res, next) {
  console.log("Time: ", Date.now());
  next();
});

require("./routes/messages")(app);
require("./routes/peers")(app);
require("./routes/root")(app);
require("./routes/users")(app);

app.use("/", router);

async function start() {}

app.listen(8080, () => console.log("Federation server - running @ 8080"));

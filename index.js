const express = require("express");
const bodyParser = require("body-parser");
const mongoDBMiddleware = require("./middlewares/mongodb");

const { DB_HOST, DB_NAME, PORT } = process.env;

const app = express();
app.use(bodyParser.json());
app.use(mongoDBMiddleware(DB_HOST, DB_NAME));

require("./routes/peers")(app);
require("./routes/root")(app);

app.listen(PORT, () =>
  console.log(`Federation DNS Server - running @ ${PORT}`)
);

const request = require("request-promise");

async function requestToPeer(peer, method, uri = "", body = {}) {
  const { host, port } = peer;

  const url = `http://${host}:${port}${uri}`;

  let json = null;

  if (method === "POST" || method === "PUT") {
    json = body;
  }

  return await request({
    url,
    method,
    json
  });
}

module.exports = {
  requestToPeer
};

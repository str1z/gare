const crypto = require("crypto");

const security = {};

security.hash = function (data = "", rounds = 35, salt) {
  if (!salt || salt.length !== 22) salt = crypto.randomFillSync(Buffer.alloc(16)).toString("base64").slice(0, 22);
  let hash = crypto.createHash("sha256");
  for (let i = 0; i < rounds; i++) hash.update(salt + data);
  return rounds.toString(36) + "." + salt + "." + hash.digest("base64").slice(0, 43);
};

security.compare = function (data, hash) {
  let arr = hash.split(".");
  return hash == security.hash(data, parseInt(arr[0], 36), arr[1]);
};

module.exports = security;

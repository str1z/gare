const crypto = require("crypto");

const security = {};

security.hash = function (data = "", cost = 10, salt) {
  if (!salt || salt.length !== 22) salt = crypto.randomBytes(16).toString("base64").slice(0, 22);
  let hash = crypto.createHash("sha256");
  for (let i = 0; i < 2 ** cost; i++) hash.update(salt + data);
  return cost.toString(36) + "." + salt + "." + hash.digest("base64").slice(0, 43);
};

security.compare = function (data, hash) {
  let arr = hash.split(".");
  return hash == security.hash(data, parseInt(arr[0], 36), arr[1]);
};

security.encrypt = function (data, key, algorithm = "aes-256-gcm", iv) {
  if (key.length !== 32) key = crypto.createHash("sha256").update(key).digest("base64").slice(0, 32);
  if (!iv) iv = crypto.randomBytes(16);
  let cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(data).toString("base64").replace(/=/g, "");
  return iv.toString("base64").replace(/=/g, "") + encrypted;
};

security.decrypt = function (data, key, algorithm = "aes-256-gcm") {
  if (key.length !== 32) key = crypto.createHash("sha256").update(key).digest("base64").slice(0, 32);
  let iv = Buffer.from(data.slice(0, 22), "base64");
  let encrypted = Buffer.from(data.slice(22), "base64");
  let decipher = crypto.createDecipheriv(algorithm, key, iv);
  return decipher.update(encrypted).toString();
};

module.exports = security;

const crypto = require("crypto");

console.log(crypto.randomFillSync(Buffer.alloc(16)));

console.log(crypto.randomInt(1000));

const security = {};

security.hash = function (data, salt, rounds) {};

module.exports = security;

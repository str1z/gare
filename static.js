"use strict";

const fs = require("fs");
const path = require("path");

module.exports = (router, dir, prefix = "*") => {
  const handler = (req, res) => {
    fs.createReadStream(path.join(path.resolve(dir), path.normalize(req.url).replace(/^(\.\.[\/\\])+/, "")))
      .on("error", () => req.next())
      .pipe(res);
  };
  router.get(prefix, handler);
};

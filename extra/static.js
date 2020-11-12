"use strict";

const fs = require("fs");
const path = require("path");
const mimetypes = require("../util/mimetypes");

let mapDirectory = (router, dirname, rootDirname) => {
  let filenames = fs.readdirSync(dirname);
  for (let filename of filenames) {
    let fullFilename = path.join(dirname, filename);
    if (fs.statSync(fullFilename).isDirectory()) return mapDirectory(router, fullFilename, rootDirname);
    let payload = fs.readFileSync(fullFilename, { encoding: "binary" });
    let routeName = "/" + path.relative(rootDirname, fullFilename).replace(/\\/g, "/");
    let type = mimetypes[path.extname(routeName)] || "application/octet-stream";
    router.get(routeName, (_req, res) => {
      res.setHeader("Content-Type", type);
      res.end(payload);
    });
  }
};

module.exports = (dirname, prefix = "", cache = false) => (router) => {
  if (cache) return mapDirectory(router, dirname, dirname);
  router.get(prefix + "*", (req, res) => {
    let filepath = path.join(path.resolve(dirname), path.normalize(req.url).replace(/^(\.\.[\/\\])+/, ""));
    let type = mimetypes[path.extname(filepath)] || "application/octet-stream";
    res.setHeader("Content-Type", type);
    fs.createReadStream(filepath)
      .on("error", () => req.next())
      .pipe(res);
  });
};

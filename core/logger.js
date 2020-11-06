const fs = require("fs");
const path = require("path");

const TYPES = {
  1: "FATAL",
  2: "ERROR",
  3: "WARN",
  4: "SUCCESS",
  5: "INFO",
  6: "LOG",
};

const COLORS = {
  black: "\u001b[30m",
  red: "\u001b[31m",
  green: "\u001b[32m",
  yellow: "\u001b[33m",
  blue: "\u001b[34m",
  magenta: "\u001b[35m",
  cyan: "\u001b[36m",
  white: "\u001b[37m",
  reset: "\u001b[0m",
};

const BATCHES = {
  all: 0,
  year: 4,
  month: 7,
  day: 10,
  hour: 13,
  minute: 16,
};

function Logger(options = {}) {
  this.logLevel = options.logLevel || 6;
  this.saveLevel = options.saveLevel || 6;
  this.saveTo = options.saveTo;
  this.batchBy = BATCHES[options.batchBy] || BATCHES.all;
  this.colors = {
    timestamp: COLORS.magenta,
    1: COLORS.red,
    2: COLORS.red,
    3: COLORS.yellow,
    4: COLORS.green,
    5: COLORS.cyan,
    6: "",
  };
}

Logger.prototype.setColor = function (name, color) {
  this.colors[name] = COLORS[color];
};

Logger.prototype.setBatching = function (by) {
  this.batchBy = BATCHES[by];
};

Logger.prototype.print = function (message, level = 6) {
  let iso = new Date().toISOString();
  if (level <= this.logLevel)
    process.nextTick(() => {
      process.stdout.write(this.colors.timestamp + iso + COLORS.reset + " " + this.colors[level] + TYPES[level].padEnd(7, ".") + COLORS.reset + " " + message + "\n");
    });

  if (this.saveTo && level <= this.saveLevel) {
    let name = iso.substr(0, this.batchBy).replace(/:/, ";") + "0000-00-00T00;00;00".substr(this.batchBy);
    let full = path.join(this.saveTo, name);
    fs.appendFile(full, iso + " " + TYPES[level].padEnd(7, ".") + " " + message + "\n", () => {});
  }
};

Logger.prototype.fatal = function (message) {
  this.print(message, 1);
};

Logger.prototype.error = function (message) {
  this.print(message, 2);
};

Logger.prototype.warn = function (message) {
  this.print(message, 3);
};

Logger.prototype.success = function (message) {
  this.print(message, 4);
};

Logger.prototype.info = function (message) {
  this.print(message, 5);
};

Logger.prototype.log = function (message) {
  this.print(message, 6);
};

module.exports = Logger;

"use strict";
const http = require("http");

function Router() {
  this._method = {};
  this._route = {};
  this._pipe = {};
  this._event = {};
  this._packed_route = {};
  this._packed_pipe = {};
  for (let method of http.METHODS) {
    this._method[method] = [];
    this._route[method] = {};
    this._pipe[method] = [];
  }
  this.handle = (req, res) => {
    let url = (req.URL = req.URL || req.url);
    let method = req.method;
    let route = this._route[method][url];
    if (route) this.run([...this._method[method], ...route], req, res);
    else this.run([...this._method[method], ...this._pipe[method]], req, res);
  };
}
Router.prototype.pack = function () {
  for (let method of http.METHODS) {
    this._packed_route[method] = {};
    for (let url in this._route[method]) {
      let handlers = [];
      this._packed_route[method][url] = handlers;
      handlers.push(...this._method[method], ...this._route[method][url]);
    }
    let handlers = [];
    this._packed_pipe[method] = handlers;
    handlers.push(...this._method[method], ...this._pipe[method]);
  }
  this.handle = (req, res) => {
    let url = (req.URL = req.URL || req.url);
    let method = req.method;
    let route = this._route[method][url];
    if (route) this.run(this._packed_route[method][url], req, res);
    else this.run([...this._packed_pipe[method], ...this._pipe[method]], req, res);
  };
};
Router.prototype.run = function (handlers, req, res) {
  let p = 0;
  req.next = (e) => {
    if (e) this.run(this._event[e], req, res);
    else handlers[++p](req, res);
  };
  handlers[0](req, res);
};
Router.prototype.defer = function (cb) {
  setImmediate(() => cb(this));
};
Router.prototype.createServer = function () {
  return http.createServer(this.handle);
};
Router.prototype.add = function (lib, ...args) {
  lib(this, ...args);
};
Router.prototype.get = function (urls, ...handlers) {
  this.map({ methods: "GET", urls }, ...handlers);
};
Router.prototype.post = function (urls, ...handlers) {
  this.map({ methods: "POST", urls }, ...handlers);
};
Router.prototype.put = function (urls, ...handlers) {
  this.map({ methods: "PUT", urls }, ...handlers);
};
Router.prototype.patch = function (urls, ...handlers) {
  this.map({ methods: "PATCH", urls }, ...handlers);
};
Router.prototype.delete = function (urls, ...handlers) {
  this.map({ methods: "DELETE", urls }, ...handlers);
};
Router.prototype.rest = function (urls, ...handlers) {
  this.map({ methods: "REST", urls }, ...handlers);
};
Router.prototype.body = function (urls, ...handlers) {
  this.map({ methods: "BODY", urls }, ...handlers);
};
Router.prototype.all = function (urls, ...handlers) {
  this.map({ methods: "ALL", urls }, ...handlers);
};
Router.prototype.method = function (methods, ...handlers) {
  this.map({ methods }, ...handlers);
};
Router.prototype.route = function (methods, urls, ...handlers) {
  this.map({ methods, urls }, ...handlers);
};
Router.prototype.pipe = function (methods, ...handlers) {
  this.map({ methods, urls: "*" }, handlers);
};
Router.prototype.map = function ({ methods = [], urls = null, pre = false }, ...handlers) {
  if (typeof urls == "string") urls = urls.split(/[,\s]+/);
  if (typeof methods == "string") {
    methods = methods.toUpperCase();
    if (methods == "REST") methods = ["GET", "POST", "PATCH", "PUT", "DELETE"];
    else if (methods == "BODY") methods = ["POST", "PUT", "PATCH"];
    else if (methods == "ALL") methods = http.METHODS;
    else methods = methods.split(/[,\s]+/);
  } else methods = methods.map((e) => e.toUpperCase());
  methods = methods.filter((method) => {
    if (http.METHODS.includes(method)) return true;
    throw Error(`${method} is not supported HTTP method.`);
  });
  for (let method of methods)
    if (!urls) this._method[method].push(...handlers);
    else
      for (let url of urls)
        if (url == "*") this._pipe[method].push(...handlers);
        else if (/:|\*/.test(url)) {
          let params = [];
          let re = new RegExp("^" + url.replace(/:(\w+)(\([^\(\)]+\))?/g, (_, name, validator) => (params.push(name) && validator) || "(\\w+)").replace(/\*$/, "(.*)") + "$");
          let handler = (req, res) => {
            let match = req.url.match(re);
            if (!match) req.next();
            else {
              req.url = match[params.length + 1];
              for (let i = 0; i < params.length; i++) req.params[params[i]] = match[i + 1];
              let next = req.next;
              this.run([...handlers, () => next()], req, res);
            }
          };
          if (pre) this._method[method].push(handler);
          else this._pipe[method].push(handler);
        } else {
          let route = this._route[method];
          if (route[url]) route[url].push(...handlers);
          else route[url] = handlers;
        }
};

module.exports = Router;

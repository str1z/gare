"use strict";
const http = require("http");

const defer = require("../util/defer");

function Router() {
  this.defer = defer(this);
  this._method = {};
  this._route = {};
  this._chain = {};
  this._packed_route = {};
  this._packed_chain = {};
  for (let method of http.METHODS) {
    this._method[method] = [];
    this._route[method] = {};
    this._chain[method] = [];
  }
  this.handle = (req, res) => {
    if (!req.URL) req.URL = req.url;
    let method = req.method;
    let route = this._route[method][req.url];
    if (route) this.run([...this._method[method], ...route], req, res);
    else this.run([...this._method[method], ...this._chain[method]], req, res);
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
    this._packed_chain[method] = handlers;
    handlers.push(...this._method[method], ...this._chain[method]);
  }
  this.handle = (req, res) => {
    if (!req.URL) req.URL = req.url;
    let method = req.method;
    let route = this._packed_route[method][req.url];
    if (route) this.run(route, req, res);
    else this.run(this._packed_chain[method], req, res);
  };
  return this;
};
Router.prototype.run = function (handlers, req, res) {
  let p = 0;
  req.next = () => {
    handlers[++p](req, res);
  };
  handlers[0](req, res);
};
Router.prototype.createServer = function () {
  this.defer();
  return http.createServer(this.handle);
};
Router.prototype.serve = function (port, callback) {
  let server = this.createServer();
  return server.listen(port).on("listening", () => callback(server));
};
Router.prototype.add = function (middleware) {
  return middleware(this);
};
Router.prototype.get = function (urls, ...handlers) {
  return this.map({ methods: "GET", urls }, ...handlers);
};
Router.prototype.post = function (urls, ...handlers) {
  return this.map({ methods: "POST", urls }, ...handlers);
};
Router.prototype.put = function (urls, ...handlers) {
  return this.map({ methods: "PUT", urls }, ...handlers);
};
Router.prototype.patch = function (urls, ...handlers) {
  return this.map({ methods: "PATCH", urls }, ...handlers);
};
Router.prototype.delete = function (urls, ...handlers) {
  return this.map({ methods: "DELETE", urls }, ...handlers);
};
Router.prototype.rest = function (urls, ...handlers) {
  return this.map({ methods: "REST", urls }, ...handlers);
};
Router.prototype.body = function (urls, ...handlers) {
  return this.map({ methods: "BODY", urls }, ...handlers);
};
Router.prototype.all = function (urls, ...handlers) {
  return this.map({ methods: "ALL", urls }, ...handlers);
};
Router.prototype.method = function (methods, ...handlers) {
  return this.map({ methods }, ...handlers);
};
Router.prototype.route = function (methods, urls, ...handlers) {
  return this.map({ methods, urls }, ...handlers);
};
Router.prototype.chain = function (methods, ...handlers) {
  return this.map({ methods, urls: "*" }, handlers);
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
        if (url == "*") this._chain[method].push(...handlers);
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
          else this._chain[method].push(handler);
        } else {
          let route = this._route[method];
          if (route[url]) route[url].push(...handlers);
          else route[url] = handlers;
        }
  return this;
};

module.exports = Router;

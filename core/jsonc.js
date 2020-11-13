"use strict";

const { string } = require("./validate");

const jsonc = (schema) => {
  return new Function("data", "return `" + generateCode(schema) + "`");
};

function generateCode(schema, path = "data") {
  let text = "";
  if (schema == Number) text += "${" + path + "}";
  else if (schema == String) text += '"${' + path + '}"';
  else if (typeof schema == "function") text += "${" + schema(path) + "}";
  else if (schema instanceof Array) {
    if (schema.length == 1) {
      text += "[${" + path;
      text += `.reduce((acc, data, i, arr) => acc + \`${generateCode(schema[0])}\` + (i < arr.length - 1 ? "," : ""), "")`;
      text += "}]";
    } else if (schema.length > 1) {
      text += "[";
      for (let i = 0; i < schema.length; i++) {
        text += generateCode(schema[i], path + `[${i}]`);
        if (i < schema.length - 1) text += ",";
      }
      text += "]";
    }
  } else if (schema instanceof Object) {
    text += "{";
    let keys = Object.keys(schema);
    keys.forEach((key, i) => {
      text += `"${key}":${generateCode(schema[key], path + `.${key}`)}`;
      if (i < keys.length - 1) text += ",";
    });
    text += "}";
  }
  return text;
}

function schemaFromSample(sample) {
  if (typeof sample == "string") return String;
  if (typeof sample == "number") return Number;
  if (typeof sample == "boolean") return Boolean;
  if (sample instanceof Array) return sample.map((v) => schemaFromSample(v));
  if (sample instanceof Object) {
    let obj = {};
    for (let key in sample) obj[key] = schemaFromSample(sample[key]);
    return obj;
  }
}

function auto() {
  let serializer = false;
  function c(data) {
    if (serializer) return serializer(data);
    else {
      serializer = jsonc(schemaFromSample(data));
      return JSON.stringify(data);
    }
  }
  c.reset = () => (serializer = false);
  return c;
}

jsonc.generateCode = generateCode;
jsonc.schemaFromSample = schemaFromSample;
jsonc.auto = auto;

let testC = jsonc.auto();

console.log(testC("what"));
console.log(testC(12));

module.exports = jsonc;

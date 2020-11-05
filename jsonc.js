"use strict";

const jsoncText = (schema, path = "data") => {
  let text = "";
  if (schema == Number) text += "${" + path + "||null}";
  else if (schema == String) text += '"${' + path + '||null}"';
  else if (typeof schema == "function") text += "${" + schema(path) + "}";
  else if (schema instanceof Array) {
    text += "[${" + path;
    text += `.reduce((acc, data, i, arr) => acc + \`${jsoncText(schema[0])}\` + (i < arr.length - 1 ? "," : ""), "")`;
    text += "}]";
  } else if (schema instanceof Object) {
    text += "{";
    let keys = Object.keys(schema);
    keys.forEach((key, i) => {
      text += `"${key}":${jsoncText(schema[key], path + `.${key}`)}`;
      if (i < keys.length - 1) text += ",";
    });
    text += "}";
  }
  return text;
};

const jsonc = (schema) => {
  return new Function("data", "return `" + jsoncText(schema) + "`");
};

module.exports = jsonc;

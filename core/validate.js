const ERROR_MESSAGES = {
  type: "incorrect type",
  need: "missing property",
  regex: "regex test failed",
  keep: "missing property",
  format: "incorrect format",
  min: "too small",
  max: "too large",
  maxL: "too long",
  minL: "too short",
  range: "out of range",
  rangeL: "incorrect length",
  check: "failed check",
  enum: "failed enum",
  array: "not array",
};

class Validate {
  constructor() {
    this.validators = [];
  }
  type(type, error = ERROR_MESSAGES.type) {
    this.validators.push((value) => {
      if (typeof value != type) return { error, value, validator: "type", type };
      return { value };
    });
    return this;
  }
  need(keys, error = ERROR_MESSAGES.need) {
    this.validators.push((value) => {
      for (let key of keys) if (value[key] == undefined) return { error, path: [key], value, validator: "need", keys };
      return { value };
    });
    return this;
  }
  check(handler, error = ERROR_MESSAGES.check) {
    this.validators.push((value) => {
      if (!handler(value)) return { error, value, validator: "check", handler };
      return { value };
    });
    return this;
  }
  alter(handler) {
    this.validators.push((value) => {
      value = handler(value);
      return { value };
    });
    return this;
  }
  regex(regex, error = ERROR_MESSAGES.regex) {
    this.validators.push((value) => {
      if (!regex.test(value)) return { error, value, validator: "regex", regex };
      return { value };
    });
    return this;
  }
  keys(object) {
    this.validators.push((value) => {
      for (let key in object) {
        if (value[key] == undefined) continue;
        let out = object[key].validate(value[key]);
        if (out.error) return { ...out, path: out.path ? [key, ...out.path] : [key] };
        value[key] = out.value;
      }
      return { value };
    });
    return this;
  }
  keep(keys, error = ERROR_MESSAGES.keep) {
    this.validators.push((value) => {
      let filtered = {};
      for (let key of keys) {
        if (value[key] == undefined) return { error, path: [key], value, validator: "keep", keys };
        filtered[key] = value[key];
      }
      return { value: filtered };
    });
    return this;
  }
  enum(values, error = ERROR_MESSAGES.enum) {
    this.validators.push((value) => {
      if (!values.includes(value)) return { error, value, validator: "enum", values };
      return { value };
    });
    return this;
  }
  validate(value) {
    for (let validator of this.validators) {
      let out = validator(value);
      if (out.error) return out;
      value = out.value;
    }
    return { value };
  }
  array(error = ERROR_MESSAGES.array) {
    this.validators.push((value) => {
      if (!(value instanceof Array)) return { error, value, validator: "array" };
      return { value };
    });
    return this;
  }
  each(handler) {
    this.validators.push((value) => {
      for (let key in value) {
        let out = handler().validate(value[key]);
        if (out.error) return { ...out, path: out.path ? [key, ...out.path] : [key] };
        if (out.value) value[key] = out.value;
      }
      return { value };
    });
    return this;
  }
  format(format, error = ERROR_MESSAGES.format) {
    const formatHandlers = {
      integer: (value) => {
        if (value % 1 != 0) return { error, value, validator: "format", format };
        return { value };
      },
      date: (value) => {
        let date = new Date(value);
        if (date.toString() == "Invalid Date") return { error, value, validator: "format", format };
        return { value };
      },
      email: (value) => {
        const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        if (!re.test(value)) return { error, value, validator: "format", format };
        return { value };
      },
    };
    if (formatHandlers[format]) this.validators.push(formatHandlers[format]);
    return this;
  }
  min(min, error = ERROR_MESSAGES.min) {
    this.validators.push((value) => {
      if (value < min) return { error, value, validator: "min", min };
      return { value };
    });
    return this;
  }
  max(max, error = ERROR_MESSAGES.max) {
    this.validators.push((value) => {
      if (value > max) return { error, value, validator: "max", max };
      return { value };
    });
    return this;
  }
  minL(minL, error = ERROR_MESSAGES.minL) {
    this.validators.push((value) => {
      if (value.length < minL) return { error, value, validator: "minL", minL };
      return { value };
    });
    return this;
  }
  maxL(maxL, error = ERROR_MESSAGES.maxL) {
    this.validators.push((value) => {
      if (value.length > maxL) return { error, value, validator: "maxL", maxL };
      return { value };
    });
    return this;
  }
  range(min, max, error = ERROR_MESSAGES.range) {
    this.validators.push((value) => {
      if (value < min || value > max) return { error, value, validator: "range", min, max };
      return { value };
    });
    return this;
  }
  rangeL(minL, maxL, error = ERROR_MESSAGES.rangeL) {
    this.validators.push((value) => {
      if (value.length < minL || value.length > maxL) return { error, value, validator: "rangeL", minL, maxL };
      return { value };
    });
    return this;
  }
  static object(object) {
    return new this().type("object").keep(Object.keys(object)).keys(object);
  }
  static string() {
    return new this().type("string");
  }
  static regex(expression) {
    return new this().type("string").regex(expression);
  }
  static email() {
    return new this().type("string").format("email");
  }
  static number() {
    return new this().type("number");
  }
  static integer() {
    return new this().type("number").format("integer");
  }
  static range(min, max) {
    return new this().type("number").range(min, max);
  }
  static date() {
    return new Jskema().type("string").format("date");
  }
  static array(type) {
    if (type)
      return new Jskema()
        .type("object")
        .array()
        .each(() => new Jskema().type(type));
    else return new Jskema().type("object").array();
  }
  static setErrorMessages(messages) {
    for (let key in messages) ERROR_MESSAGES[key] = messages[key];
  }
}
module.exports = Validate;

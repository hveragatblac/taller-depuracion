import path from 'node:path';
import { is_main_module } from './modules.utility.js';

function is_argument_name(o) {
  if (typeof o !== 'string') {
    return false;
  }
  return o.startsWith('--');
}

function read_as_object() {
  const xargs = process.argv.slice(2);

  let xarg = {};
  let expecting = 'name';
  let name = undefined;
  for (let i = 0; i < xargs.length; i++) {
    const value = xargs[i];
    switch (expecting) {
      case 'name': {
        const is_invalid_name = !is_argument_name(value);
        if (is_invalid_name) {
          throw new `Expected new argument but got ${value}`();
        }
        name = value.slice(2);
        expecting = 'value';
        break;
      }
      case 'value': {
        if (is_argument_name(value)) {
          xarg[name] = undefined;
          i -= 1;
        } else {
          xarg[name] = value;
          name = undefined;
        }
        expecting = 'name';
        break;
      }
      default:
        throw new Error('Invalid state');
    }
  }
  return xarg;
}

function require(name, value) {
  if (is_nil(value)) {
    throw new Error(`Argument "${name}" is required`);
  }
}

function parse_fs_path(raw) {
  const parsed = path.parse(raw);
  return path.format(parsed);
}

function parse_string(raw) {
  return raw.toString('utf-8');
}

function parse_integer(raw) {
  return parseInt(raw, 10);
}

function parse_number(raw) {
  return parseFloat(raw, 10);
}

function parse_bool(raw) {
  return raw === 'true';
}

function is_nil(raw) {
  return raw === undefined || raw === null;
}

function is_defined(raw) {
  return !is_nil(raw);
}

function parse(raw, conf) {
  if (is_nil(conf)) {
    conf = {};
  }
  if (is_nil(conf.type)) {
    conf.type = 'string';
  }
  if (is_nil(conf.required)) {
    conf.required = false;
  }

  if (conf.required) {
    require(conf.name, raw);
  }

  if (is_defined(conf.default) && is_nil(raw)) {
    return conf.default;
  }

  switch (conf.type) {
    case 'string':
      return parse_string(raw);
    case 'integer':
      return parse_integer(raw);
    case 'number':
      return parse_number(raw);
    case 'bool':
      return parse_bool(raw);
    case 'fs-path':
      return parse_fs_path(raw);
    default:
      throw new Error(
        `Got invalid type "${conf.type}" for argument "${conf.name}"`,
      );
  }
}

function read_args(definitions) {
  const raw_xarg = read_as_object();
  return definitions.reduce((xarg, conf) => {
    const is_nameless = typeof conf.name !== 'string';
    if (is_nameless) {
      throw new Error(`Attribute "name" is required for argument definition`);
    }
    const raw = raw_xarg[conf.name];
    const value = parse(raw, conf);
    xarg[conf.name] = value;
    return xarg;
  }, {});
}

export const cli = {
  read: read_args,
};

if (is_main_module(import.meta)) {
  console.debug(
    read_args([
      {
        name: 'worker-count',
        type: 'integer',
      },
      {
        name: 'measurements',
        type: 'fs-path',
      },
    ]),
  );
}

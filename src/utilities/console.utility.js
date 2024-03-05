import { is_main_module } from './modules.utility.js';

/**
 * Create a console that stamps each log call with its corresponding
 * timestamp and context
 * @param {string} context
 * @returns {Console}
 */
export function create_contextual_console(context) {
  const handler = {
    get(target, prop, receiver) {
      switch (prop) {
        case 'log':
        case 'debug':
        case 'warn':
        case 'error':
        case 'trace':
          return (...args) => {
            let message = `${Date.now()} [${context}]`;
            if (typeof args[0] === 'string') {
              message += ` ${args[0]}`;
              args[0] = message;
            } else {
              args.unshift(message);
            }
            Reflect.apply(target[prop], target, args);
          };
        default:
          return Reflect.get(target, prop, receiver);
      }
    },
  };

  const contextual_console = new Proxy(console, handler);
  return contextual_console;
}

if (is_main_module(import.meta)) {
  const worker_console = create_contextual_console('WORKER_1');
  worker_console.log('Processing batch...', { size: 512, offset: 128 });
  worker_console.error('Failed processing batch', { size: 512, offset: 128 });
}

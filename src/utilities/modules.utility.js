import fs from 'node:fs';
import url from 'node:url';

/**
 * Checks if the input script is the entry point
 * @param {ImportMeta} meta
 * @returns {boolean}
 */
export function is_main_module(meta) {
  const main_module_path = fs.realpathSync(process.argv[1]);
  const current_module_path = url.fileURLToPath(meta.url);
  return main_module_path === current_module_path;
}

/**
 * Checks if the input script is a secondary module (AKA not the entry point)
 * @param {ImportMeta} meta
 * @returns {boolean}
 */
export function is_secondary_module(meta) {
  return !is_main_module(meta);
}

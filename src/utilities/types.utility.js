/**
 * Check if `o` is null or undefined
 * @param {unknown} o Comparison target
 * @returns {boolean} True if `o` is null or undefined, false otherwise
 */
export function is_nil(o) {
  return o === undefined || o === null;
}

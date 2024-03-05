export function noop() {}

/**
 * @typedef {[number, number]} Range
 */

/**
 * @param {Range} range 
 * @returns {(rhs: Range) => boolean}
 */
export function create_intersection_checker_for(range) {
  return function has_intersection(rhs) {
    return rhs[0] <= range[1] && range[0] <= rhs[1];
  }
}

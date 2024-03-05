import { isSharedArrayBuffer } from 'node:util/types';
import { is_nil } from './types.utility.js';

/**
 * Byte size of a 32-bit integer
 */
export const I32_SIZE = Int32Array.BYTES_PER_ELEMENT;

/**
 * Byte size of a 64-bit integer
 */
export const I64_SIZE = BigInt64Array.BYTES_PER_ELEMENT;

/**
 * Create a typed array of 32-bit integers backed by shareable memory
 * @param {number} length number of integers to hold
 * @returns {Int32Array}
 */
export function create_shared_i32a(length) {
  const len = length * I32_SIZE;
  const sab = new SharedArrayBuffer(len);
  const arr = new Int32Array(sab);
  return arr;
}

/**
 * Create a typed array of 64-bit integers backed by shareable memory
 * @param {number} length number of integers to hold
 * @returns {BigInt64Array}
 */
export function create_shared_i64a(length) {
  const len = length * I64_SIZE;
  const sab = new SharedArrayBuffer(len);
  const arr = new BigInt64Array(sab);
  return arr;
}

/**
 * Create a 32-bit integer backed by shareable memory
 */
export class SharedI32 {
  /**
   * Backing memory
   * @type {Int32Array}
   */
  #i32a;

  /**
   * Create a 32-bit integer backed by shareable memory
   * @param {object} args
   * @param {SharedArrayBuffer?} args.sab Backing memory
   */
  constructor(args = undefined) {
    if (is_nil(args)) {
      args = {};
    }
    if (is_nil(args.sab)) {
      this.#i32a = create_shared_i32a(1);
    } else {
      this.#i32a = new Int32Array(args.sab);
    }
  }

  static from_shareable(sab) {
    if (isSharedArrayBuffer(sab)) {
      const shared_i32 = new SharedI32({ sab });
      return shared_i32;
    } else {
      throw new Error('expected shared array buffer');
    }
  }

  get value() {
    return this.#i32a[0];
  }

  set value(value) {
    this.#i32a[0] = value;
  }

  add(value) {
    this.value += value;
  }

  subtract(value) {
    this.value -= value;
  }

  multiply(value) {
    this.value *= value;
  }

  divide(value) {
    this.value /= value;
  }

  to_shareable() {
    return this.#i32a.buffer;
  }

  toString() {
    return this.value.toString(10);
  }
}

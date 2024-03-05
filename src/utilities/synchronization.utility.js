import { isSharedArrayBuffer } from 'node:util/types';
import { I32_SIZE } from './shared-memory.utility.js';
import {
  TO_EVERY_AGENT,
  TO_ONE_AGENT,
} from '../constants/atomics.constants.js';
import assert from 'node:assert';

/**
 * Synchronization primitive to protect shared regions of memory
 *
 * Since it depends on the blocking `Atomics::wait` operation it cannot
 * be used on the main thread, for details see point 10 of
 * https://tc39.es/ecma262/multipage/structured-data.html#sec-dowait
 */
export class Mutex {
  /**
   * Required byte size for underlying buffer
   */
  static #BYTE_SIZE = 1 * I32_SIZE;

  /**
   * State indicating the mutex is not being held by anyone
   */
  static #FREE = 0;

  /**
   * State indicating the mutex is held by someone
   */
  static #LOCKED = 1;

  /**
   * Backing shared memory
   * @type {Int32Array}
   */
  #i32a;

  /**
   * @param {object} [args = undefined]
   * @param {SharedArrayBuffer?} args.sab
   */
  constructor(args = undefined) {
    const is_nil_args = !args;
    if (is_nil_args) {
      args = {};
    }
    const is_nil_sab = !args.sab;
    if (is_nil_sab) {
      args.sab = new SharedArrayBuffer(Mutex.#BYTE_SIZE);
    }

    const is_invalid_sab = args.sab.byteLength !== Mutex.#BYTE_SIZE;
    if (is_invalid_sab) {
      throw new Error('invalid shareable buffer');
    }

    this.#i32a = new Int32Array(args.sab);
  }

  /**
   * @param {SharedArrayBuffer} sab
   * @returns {Mutex}
   */
  static from_shareable(sab) {
    if (isSharedArrayBuffer(sab)) {
      const mutex = new Mutex({ sab });
      return mutex;
    } else {
      throw new Error('expected shared array buffer');
    }
  }

  /**
   * @returns {SharedArrayBuffer}
   */
  to_shareable() {
    return this.#i32a.buffer;
  }

  /**
   * Take hold of the mutex, if it's locked then block until we can acquire it
   */
  lock() {
    for (;;) {
      const previous_state = this.#compare_exchange(Mutex.#FREE, Mutex.#LOCKED);
      const is_acquired_by_us = previous_state === Mutex.#FREE;
      if (is_acquired_by_us) {
        break;
      } else {
        Atomics.wait(this.#i32a, 0, Mutex.#LOCKED);
      }
    }
  }

  /**
   * Let go of the mutex, if it was free it means we fucked up somewhere
   */
  free() {
    const previous_state = this.#compare_exchange(Mutex.#LOCKED, Mutex.#FREE);
    const is_freed = previous_state === Mutex.#LOCKED;
    assert.ok(
      is_freed,
      'Inconsistent state, agent tried freeing without holding the lock',
    );
    this.#notify(TO_ONE_AGENT);
  }

  /**
   * Replace the mutex's state with `next` if it's matches `expected`.
   * @param {number} expected
   * @param {number} next
   * @returns {number} original value
   */
  #compare_exchange(expected, next) {
    return Atomics.compareExchange(this.#i32a, 0, expected, next);
  }

  /**
   * Wake up to `count` agent(s) waiting to take hold of the mutex
   * @param {number} [count=TO_EVERY_AGENT] number of agents to wake up
   */
  #notify(count = TO_EVERY_AGENT) {
    Atomics.notify(this.#i32a, 0, count);
  }
}

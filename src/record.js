/**
 * @typedef PlainRecord
 * @type {object}
 * @property {number} count
 * @property {number} total
 * @property {number} maximum
 * @property {number} minimum
 */

/**
 * Measurements summary
 */
export class Record {
  /**
   * @type {number} Indicates the number of measurements
   */
  #count;

  /**
   * @type {number} Indicates the sum of all measurements
   */
  #total;

  /**
   * @type {number} Indicates the highest temperature measured
   */
  maximum;

  /**
   * @type {number} Indicates the lowest temperature measured
   */
  minimum;

  /**
   * @type {number} Indicates the mean across measurements
   */
  get mean() {
    return this.#total / this.#count;
  }

  constructor() {
    this.#count = 0;
    this.#total = 0;
    this.maximum = -Infinity;
    this.minimum = +Infinity;
  }

  /**
   * @param {PlainRecord} plain_record
   * @returns
   */
  static from_plain(plain_record) {
    const record = new Record();
    record.#count = plain_record.count;
    record.#total = plain_record.total;
    record.maximum = plain_record.maximum;
    record.minimum = plain_record.minimum;
    return record;
  }

  /**
   * @param {PlainRecord} plain_record
   */
  join(plain_record) {
    this.#count += plain_record.count;
    this.#total += plain_record.total;
    this.maximum = Math.max(plain_record.maximum, this.maximum);
    this.minimum = Math.min(plain_record.minimum, this.minimum);
  }

  /**
   * @param {number} measured_temperature
   */
  process(measured_temperature) {
    this.#count += 1;
    this.#total += measured_temperature;
    this.maximum = Math.max(measured_temperature, this.maximum);
    this.minimum = Math.min(measured_temperature, this.minimum);
  }

  /**
   * @returns {PlainRecord}
   */
  to_plain() {
    return {
      count: this.#count,
      total: this.#total,
      maximum: this.maximum,
      minimum: this.minimum,
    };
  }

  /**
   * @returns {string} "minimum/mean/maximum"
   */
  to_string() {
    const mean = this.mean.toFixed(1);
    const minimum = this.minimum.toFixed(1);
    const maximum = this.maximum.toFixed(1);
    return `${minimum}/${mean}/${maximum}`;
  }

  /**
   * @override
   */
  toString() {
    return this.to_string();
  }
}

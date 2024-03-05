import fsp from 'node:fs/promises';
import wt from 'node:worker_threads';
import { LF_BYTE, NUL_BYTE, SC_BYTE } from './constants/ascii.constant.js';
import { Record } from './record.js';
import { SharedI32 } from './utilities/shared-memory.utility.js';
import { is_nil } from './utilities/types.utility.js';

if (wt.isMainThread) {
  throw new Error('Expected to run in a worker thread');
}

const { input_path, input_position_sab } = wt.workerData;

const shared_input_position = SharedI32.from_shareable(input_position_sab);

/**
 * @type {fsp.FileHandle}
 */
const input_handle = await fsp.open(input_path);

/**
 * @type {import('node:fs').Stats}
 */
const input_stat = await input_handle.stat();

/**
 * Worker's input reading payload
 * @type {fsp.FileReadResult}
 */
let input_read;

/**
 * @type {Map<string, Record>}
 */
const record_by_name = new Map();

function get_record_entries() {
  return Array.from(record_by_name.entries()).map(([name, record]) => [
    name,
    record.to_plain(),
  ]);
}

function has_unread_bytes() {
  return shared_input_position.value + 1 !== input_stat.size;
}

wt.parentPort.on('message', async function on_parent_message({ chunk_size }) {
  const chunk = Buffer.alloc(chunk_size, NUL_BYTE, 'utf-8');

  try {
    while (has_unread_bytes()) {
      const is_every_chunk_processed = shared_input_position.value >= input_stat.size;
      if (is_every_chunk_processed) {
        wt.parentPort.postMessage({
          type: 'done',
          value: get_record_entries(),
        });
        wt.parentPort.close();
        return;
      }

      chunk.fill(NUL_BYTE);
      input_read = await input_handle.read(
        chunk,
        0,
        chunk.length,
        shared_input_position.value,
      );

      const is_end_of_file = input_read.bytesRead === 0;
      if (is_end_of_file) {
        wt.parentPort.postMessage({
          type: 'done',
          value: get_record_entries(),
        });
        wt.parentPort.close();
        return;
      }

      const end_of_parseable = chunk.lastIndexOf(LF_BYTE);
      const is_unparseable_chunk = end_of_parseable === -1;
      if (is_unparseable_chunk) {
        wt.parentPort.close();
        throw new Error(`Got invalid chunk ${chunk.toString('utf-8')}`);
      }

      const parseable_chunk_size = Math.min(
        end_of_parseable + 1,
        input_read.bytesRead,
      );
      const next_input_position = shared_input_position.value + parseable_chunk_size;
      shared_input_position.value = next_input_position;
      
      
      parse_input_chunk({ chunk, record_by_name });
      const is_last_chunk = next_input_position >= input_stat.size;
      if (is_last_chunk) {
        wt.parentPort.postMessage({
          type: 'done',
          value: get_record_entries(),
        });
        return;
      }
    }
  } finally {
    input_handle?.close();
  }
});

/**
 * @param {object} arg
 * @param {Buffer} arg.entry
 * @param {Map<string, Record>} arg.record_by_name
 * @returns
 */
function parse_input_entry({ entry, record_by_name }) {
  const sc_index = entry.indexOf(SC_BYTE);
  const name = entry.toString('utf-8', 0, sc_index);
  const temperature = parseFloat(entry.toString('utf-8', sc_index + 1));

  let record = record_by_name.get(name);
  if (is_nil(record)) {
    record = new Record();
    record_by_name.set(name, record);
  }
  record.process(temperature);
}

/**
 * @param {object} arg
 * @param {Buffer} arg.chunk
 * @param {Map<string, Record>} arg.record_by_name
 */
function parse_input_chunk({ chunk, record_by_name }) {
  let lf_index = -1;
  let read_offset = 0;

  function has_entry() {
    lf_index = chunk.indexOf(LF_BYTE, read_offset);
    return lf_index !== -1;
  }

  while (has_entry()) {
    const start_of_entry = read_offset;
    const end_of_entry = lf_index;
    const bytes = chunk.subarray(start_of_entry, end_of_entry);
    parse_input_entry({ entry: bytes, record_by_name });
    read_offset = end_of_entry + 1;
  }
}

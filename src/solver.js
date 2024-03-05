import path from 'node:path';
import wt from 'node:worker_threads';
import { Record } from './record.js';
import { create_contextual_console } from './utilities/console.utility.js';
import { create_intersection_checker_for, noop } from './utilities/miscellaneous.utility.js';
import { SharedI32 } from './utilities/shared-memory.utility.js';

/**
 * @param {object} configuration
 * @param {string} configuration.input_path
 * @param {number} configuration.worker_count
 * @param {number} configuration.chunk_size
 * @param {import('node:stream').Writable} [configuration.output_stream=process.stdout]
 * @returns {Promise<void>}
 */
export function solve({
  input_path,
  worker_count,
  chunk_size,
  output_stream = process.stdout,
}) {
  return new Promise(function executor(resolve, reject) {
    const record_by_name = new Map();

    const input_position = new SharedI32();

    const workers = Array.from({ length: worker_count }).map(() => {
      const parsing_script_path = path.resolve('src', 'parse.js');
      const worker = new wt.Worker(parsing_script_path, {
        env: wt.SHARE_ENV,
        workerData: {
          input_path,
          input_position_sab: input_position.to_shareable(),
        },
      });

      return worker;
    });

    let done_worker_count = 0;

    workers.forEach((worker) => {
      const worker_console = create_worker_console(worker.threadId);

      worker.on('message', function on_worker_message(data) {
        switch (data.type) {
          case 'done': {
            for (const [name, record] of data.value) {
              if (record_by_name.has(name)) {
                record_by_name.get(name).join(record);
              } else {
                record_by_name.set(name, Record.from_plain(record));
              }
            }

            done_worker_count += 1;
            const is_every_worker_done = done_worker_count === workers.length;
            if (is_every_worker_done) {
              destroy_workers();
              write_summary();
              resolve();
            }
            break;
          }
          default: {
            worker_console.debug('Received unknown message');
          }
        }
      });

      worker.on('error', function on_worker_error(e) {
        worker_console.error(e);
        destroy_workers();
        reject(e);
      });

      worker.postMessage({ chunk_size, input_path });
    });

    async function destroy_workers() {
      for (const worker of workers) {
        worker.unref();
        worker.terminate().catch(noop); // fire & forget
      }
      workers.splice();
    }

    function write_summary() {
      const sorted_names = Array.from(record_by_name.keys()).sort();
      output_stream.write('{');
      for (let i = 0; i < sorted_names.length; i++) {
        const name = sorted_names[i];
        const record = record_by_name.get(name);
        output_stream.write(`${name}=${record}`);
        const has_records_left = i !== sorted_names.length - 1;
        if (has_records_left) {
          output_stream.write(', ');
        }
      }
      output_stream.write(`}`);
    }
  });
}

/**
 * @param {number} worker_id
 */
function create_worker_console(worker_id) {
  return create_contextual_console(
    `WORKER_${worker_id.toString(10).padStart(2, '0')}`,
  );
}

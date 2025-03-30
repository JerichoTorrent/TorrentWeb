import clamav from "clamav.js";
import { PassThrough } from "stream";

/**
 * Scans a buffer using ClamAV
 * @param {Buffer} buffer - File buffer
 * @param {string} filename - File name (for logging)
 * @returns {Promise<void>} Throws error if infected
 */
export async function scanBufferWithClamAV(buffer, filename) {
  return new Promise((resolve, reject) => {
    const socket = 3310; // default ClamAV TCP socket
    const passThrough = new PassThrough();
    passThrough.end(buffer);

    clamav.ping(socket, 1000, (err) => {
      if (err) return reject(new Error("ClamAV is not running or unreachable"));

      clamav.scanStream(passThrough, socket, (err, object, malicious) => {
        if (err) return reject(err);
        if (malicious) return reject(new Error(`${filename} is infected`));
        resolve();
      });
    });
  });
}

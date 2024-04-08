import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

/**
 * @param {string} rawString
 * @returns {string[]}
 */
function cleanWords(rawString) {
  return rawString
    .split(/\r?\n/)
    .map(line => line.replace(/^\s*#.*$/, '').trim())
    .filter(Boolean)
}

/**
 * @param {string} file
 * @returns {Promise<string[]>}
 */
export async function importWords(file) {
  if (file.startsWith('file:')) {
    file = fileURLToPath(file);
  }

  const data = await readFile(file, 'utf8');
  return cleanWords(data);
}

import { createHash } from 'node:crypto'
import { createClient } from 'redis';

const redis = createClient({ url: process.env.REDIS_URL });

await redis.connect();

/**
 * @param {string} input
 * @returns {string}
 */
function sha256(input) {
  const hash = createHash('sha256');
  hash.update(input);
  return hash.digest('hex')
}

/**
 * @template {(input: string) => Promise<any>} Handler
 * @param {string} name
 * @param {Handler} handler
 * @returns {Handler}
 */
export function cacher(name, handler) {
  // @ts-expect-error I dont care about the shape
  return async (input) => {
    const hash = sha256(input);
    const cached = await redis.get(`${name}:${hash}`);

    if (cached != null) {
      return JSON.parse(cached);
    }
    
    const result = await handler(input);
    await redis.set(`${name}:${hash}`, JSON.stringify(result));
    return result;
  }
}

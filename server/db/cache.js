const redisClient = require('./redis');

/**
 * Attempts to retrieve from cache first.
 * If not found, uses the `fetchFunction` to get data, caches it, and returns it.
 */

async function cacheFetch(key, fetchFunction, ttl = 300) {
  const cached = await redisClient.get(key);
  if (cached) {
    console.log(`Cache HIT for ${key}`);
    return JSON.parse(cached);
  }

  const result = await fetchFunction(); // DB call
  await redisClient.set(key, JSON.stringify(result), 'EX', ttl);
  console.log(`Cache MISS: stored ${key}`);
  return result;
}

module.exports = { cacheFetch };

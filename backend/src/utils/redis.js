const Redis = require('ioredis')

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379'
const DISABLE_CACHE = String(process.env.DISABLE_CACHE || '').toLowerCase() === 'true'

let redis

if (!DISABLE_CACHE) {
  // Configure a conservative retry strategy to avoid noisy logs when Redis is down
  redis = new Redis(REDIS_URL, {
    maxRetriesPerRequest: 1,
    enableOfflineQueue: false,
    retryStrategy(times) {
      const delay = Math.min(times * 500, 5000) // backoff up to 5s
      return delay
    },
  })

  redis.on('error', (err) => {
    console.error('Redis error', err)
  })
} else {
  console.warn('[cache] DISABLE_CACHE=true -> Redis cache is disabled')
}

async function getJSON(key) {
  if (DISABLE_CACHE || !redis) return null
  const val = await redis.get(key)
  if (!val) return null
  try { return JSON.parse(val) } catch { return null }
}

async function setJSON(key, value, ttlSeconds) {
  if (DISABLE_CACHE || !redis) return
  const payload = JSON.stringify(value)
  if (ttlSeconds) {
    await redis.set(key, payload, 'EX', ttlSeconds)
  } else {
    await redis.set(key, payload)
  }
}

// Delete all keys that start with the given prefix. Useful for invalidating list/detail caches.
async function delByPrefix(prefix) {
  if (DISABLE_CACHE || !redis) return
  let cursor = '0'
  do {
    const res = await redis.scan(cursor, 'MATCH', `${prefix}*`, 'COUNT', 100)
    cursor = res[0]
    const keys = res[1]
    if (keys && keys.length) {
      await redis.del(keys)
    }
  } while (cursor !== '0')
}

module.exports = { redis, getJSON, setJSON, delByPrefix }

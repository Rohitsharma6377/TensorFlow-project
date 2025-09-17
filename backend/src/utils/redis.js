const Redis = require('ioredis')

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379'
const redis = new Redis(REDIS_URL)

redis.on('error', (err) => {
  console.error('Redis error', err)
})

async function getJSON(key) {
  const val = await redis.get(key)
  if (!val) return null
  try { return JSON.parse(val) } catch { return null }
}

async function setJSON(key, value, ttlSeconds) {
  const payload = JSON.stringify(value)
  if (ttlSeconds) {
    await redis.set(key, payload, 'EX', ttlSeconds)
  } else {
    await redis.set(key, payload)
  }
}

// Delete all keys that start with the given prefix. Useful for invalidating list/detail caches.
async function delByPrefix(prefix) {
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

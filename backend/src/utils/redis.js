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

module.exports = { redis, getJSON, setJSON }

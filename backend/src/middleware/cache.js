// Simple cache middleware. Use per-route.
const { getJSON, setJSON } = require('../utils/redis')

function cache(ttlSeconds = 60) {
  return async (req, res, next) => {
    try {
      const key = `cache:${req.method}:${req.originalUrl}`
      const hit = await getJSON(key)
      if (hit) return res.status(200).json(hit)

      const json = res.json.bind(res)
      res.json = async (body) => {
        try { await setJSON(key, body, ttlSeconds) } catch {}
        return json(body)
      }
      return next()
    } catch (e) {
      return next()
    }
  }
}

module.exports = { cache }

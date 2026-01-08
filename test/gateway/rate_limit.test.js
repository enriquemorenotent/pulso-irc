const test = require('node:test')
const assert = require('node:assert/strict')

const { createRateLimiter } = require('../../src/gateway/rate_limit')

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

test('createRateLimiter enforces limit per window', async () => {
  const limiter = createRateLimiter({ limit: 2, windowMs: 50 })

  assert.equal(limiter.allow(), true)
  assert.equal(limiter.allow(), true)
  assert.equal(limiter.allow(), false)

  await sleep(60)

  assert.equal(limiter.allow(), true)
})

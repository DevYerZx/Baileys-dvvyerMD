const { DisconnectReason } = require("../lib/Types")
const {
  computeReconnectDelayMs,
  defaultShouldReconnect
} = require("../lib/Utils/reconnect-supervisor")

describe("reconnect supervisor", () => {
  test("computes bounded reconnect delay", () => {
    const delay = computeReconnectDelayMs(3, {
      initialDelayMs: 1000,
      maxDelayMs: 5000,
      backoffFactor: 2,
      jitterRatio: 0
    })

    expect(delay).toBe(4000)
  })

  test("stops reconnect when status is loggedOut", () => {
    const shouldReconnect = defaultShouldReconnect({
      error: {
        output: {
          statusCode: DisconnectReason.loggedOut
        }
      }
    })

    expect(shouldReconnect).toBe(false)
  })
})

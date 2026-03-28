const {
  DEFAULT_PAIRING_CODE,
  normalizePairingCode,
  normalizePhoneNumberForPairing
} = require("../lib/Utils/pairing-utils")

describe("pairing utils", () => {
  test("normalizes custom pairing code", () => {
    expect(normalizePairingCode("dvyer-123")).toBe("DVYER123")
  })

  test("falls back to default pairing code when code is invalid", () => {
    expect(normalizePairingCode("x!")).toBe(DEFAULT_PAIRING_CODE)
  })

  test("normalizes phone number for pairing", () => {
    expect(normalizePhoneNumberForPairing("+51 (999) 999-999")).toBe("51999999999")
  })

  test("throws when phone number is invalid", () => {
    expect(() => normalizePhoneNumberForPairing("12")).toThrow("Invalid phone number")
  })
})

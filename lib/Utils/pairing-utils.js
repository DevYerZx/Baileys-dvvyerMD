"use strict"

Object.defineProperty(exports, "__esModule", { value: true })

const { Boom } = require("@hapi/boom")

const DEFAULT_PAIRING_CODE = 'DVYER123'
const PAIRING_CODE_REGEX = /^[A-Z0-9]{6,12}$/

const normalizePairingCode = (code, fallback = DEFAULT_PAIRING_CODE) => {
    if (typeof code !== 'string') {
        return fallback
    }

    const normalized = code.toUpperCase().replace(/[^A-Z0-9]/g, '')
    return PAIRING_CODE_REGEX.test(normalized) ? normalized : fallback
}

const normalizePhoneNumberForPairing = (phoneNumber) => {
    const normalized = String(phoneNumber || '').replace(/\D/g, '')
    if (normalized.length < 7 || normalized.length > 15) {
        throw new Boom('Invalid phone number for pairing code request', { statusCode: 400 })
    }
    return normalized
}

module.exports = {
    DEFAULT_PAIRING_CODE,
    normalizePairingCode,
    normalizePhoneNumberForPairing
}

"use strict"

Object.defineProperty(exports, "__esModule", { value: true })

const { EventEmitter } = require("events")
const { DisconnectReason } = require("../Types")

const DEFAULT_OPTIONS = Object.freeze({
    maxRetries: Infinity,
    initialDelayMs: 1000,
    maxDelayMs: 30000,
    backoffFactor: 2,
    jitterRatio: 0.2,
    autoStart: true
})

const defaultShouldReconnect = (lastDisconnect) => {
    const statusCode = lastDisconnect?.error?.output?.statusCode
    return statusCode !== DisconnectReason.loggedOut && statusCode !== DisconnectReason.badSession
}

const computeReconnectDelayMs = (attempt, options = {}) => {
    const initialDelayMs = Number.isFinite(options.initialDelayMs) ? options.initialDelayMs : DEFAULT_OPTIONS.initialDelayMs
    const maxDelayMs = Number.isFinite(options.maxDelayMs) ? options.maxDelayMs : DEFAULT_OPTIONS.maxDelayMs
    const backoffFactor = Number.isFinite(options.backoffFactor) ? options.backoffFactor : DEFAULT_OPTIONS.backoffFactor
    const jitterRatio = Number.isFinite(options.jitterRatio) ? options.jitterRatio : DEFAULT_OPTIONS.jitterRatio
    const expo = initialDelayMs * Math.pow(backoffFactor, Math.max(0, attempt - 1))
    const bounded = Math.min(maxDelayMs, expo)
    const jitter = bounded * jitterRatio * Math.random()
    return Math.round(bounded + jitter)
}

const createSocketSupervisor = (factory, options = {}) => {
    if (typeof factory !== 'function') {
        throw new TypeError('createSocketSupervisor expects a socket factory function')
    }

    const ev = new EventEmitter()
    const opts = { ...DEFAULT_OPTIONS, ...options }
    const shouldReconnect = typeof opts.shouldReconnect === 'function' ? opts.shouldReconnect : defaultShouldReconnect

    const state = {
        socket: undefined,
        stopped: true,
        attempt: 0,
        generation: 0,
        reconnectTimer: undefined,
        detachListener: undefined
    }

    const clearReconnectTimer = () => {
        if (state.reconnectTimer) {
            clearTimeout(state.reconnectTimer)
            state.reconnectTimer = undefined
        }
    }

    const detachSocketListener = () => {
        if (state.detachListener) {
            state.detachListener()
            state.detachListener = undefined
        }
    }

    const scheduleReconnect = (lastDisconnect) => {
        if (state.stopped) {
            return
        }

        if (!shouldReconnect(lastDisconnect)) {
            ev.emit('reconnect.stopped', { lastDisconnect, attempt: state.attempt })
            return
        }

        if (state.attempt >= opts.maxRetries) {
            ev.emit('reconnect.max-retries-reached', { lastDisconnect, attempt: state.attempt })
            return
        }

        state.attempt += 1
        const delayMs = computeReconnectDelayMs(state.attempt, opts)
        clearReconnectTimer()
        ev.emit('reconnect.scheduled', { delayMs, attempt: state.attempt, lastDisconnect })
        state.reconnectTimer = setTimeout(() => {
            launchSocket('reconnect').catch(error => {
                ev.emit('socket.error', error)
                scheduleReconnect({ error })
            })
        }, delayMs)
    }

    const bindSocket = (socket, generation) => {
        const onConnectionUpdate = (update) => {
            if (generation !== state.generation) {
                return
            }

            ev.emit('connection.update', update)
            if (state.stopped) {
                return
            }

            if (update.connection === 'open') {
                state.attempt = 0
                ev.emit('reconnect.open', update)
                return
            }

            if (update.connection === 'close') {
                scheduleReconnect(update.lastDisconnect)
            }
        }

        socket.ev?.on?.('connection.update', onConnectionUpdate)
        return () => socket.ev?.off?.('connection.update', onConnectionUpdate)
    }

    const launchSocket = async (reason = 'start') => {
        clearReconnectTimer()
        detachSocketListener()

        state.generation += 1
        const generation = state.generation
        const socket = await Promise.resolve().then(() => factory())
        state.socket = socket
        state.detachListener = bindSocket(socket, generation)
        ev.emit('socket.created', { socket, reason, generation })
        return socket
    }

    const start = async () => {
        if (!state.stopped) {
            return state.socket
        }
        state.stopped = false
        state.attempt = 0
        return launchSocket('start')
    }

    const stop = async () => {
        state.stopped = true
        clearReconnectTimer()
        detachSocketListener()

        const socket = state.socket
        state.socket = undefined

        if (socket?.end) {
            try {
                socket.end(new Error('Socket supervisor stopped'))
            }
            catch {
                //
            }
        }

        ev.emit('reconnect.stopped', { reason: 'manual-stop', attempt: state.attempt })
    }

    const restart = async () => {
        await stop()
        return start()
    }

    const api = {
        ev,
        start,
        stop,
        restart,
        get socket() {
            return state.socket
        },
        get attempt() {
            return state.attempt
        }
    }

    if (opts.autoStart) {
        start().catch(error => {
            ev.emit('socket.error', error)
            scheduleReconnect({ error })
        })
    }

    return api
}

module.exports = {
    createSocketSupervisor,
    computeReconnectDelayMs,
    defaultShouldReconnect
}

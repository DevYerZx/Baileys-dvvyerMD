"use strict"

Object.defineProperty(exports, "__esModule", { value: true })

const HANDLER_KEY = Symbol.for("dvyer.process_guards")

const logError = (logger, message, payload) => {
    if (logger?.error) {
        logger.error(payload, message)
        return
    }
    console.error(message, payload)
}

const installGlobalProcessGuards = (options = {}) => {
    if (process[HANDLER_KEY]) {
        return process[HANDLER_KEY]
    }

    const logger = options.logger || console
    const exitOnException = !!options.exitOnException

    const onUnhandledRejection = (reason) => {
        logError(logger, 'Unhandled promise rejection', { reason })
    }

    const onUncaughtException = (error) => {
        logError(logger, 'Uncaught exception', { error })
        if (exitOnException) {
            process.exit(1)
        }
    }

    process.on('unhandledRejection', onUnhandledRejection)
    process.on('uncaughtException', onUncaughtException)

    const uninstall = () => {
        process.off('unhandledRejection', onUnhandledRejection)
        process.off('uncaughtException', onUncaughtException)
        delete process[HANDLER_KEY]
    }

    const api = { uninstall }
    process[HANDLER_KEY] = api
    return api
}

module.exports = {
    installGlobalProcessGuards
}

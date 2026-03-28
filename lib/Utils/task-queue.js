"use strict"

Object.defineProperty(exports, "__esModule", { value: true })

class SerialTaskQueue {
    constructor() {
        this.tail = Promise.resolve()
    }

    add(task) {
        if (typeof task !== 'function') {
            return Promise.reject(new TypeError('SerialTaskQueue.add expects a function'))
        }

        const run = this.tail.then(() => task())
        // Keep queue alive even when one task fails
        this.tail = run.catch(() => {})
        return run
    }
}

module.exports = {
    SerialTaskQueue
}

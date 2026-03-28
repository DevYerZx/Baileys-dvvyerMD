"use strict"

Object.defineProperty(exports, "__esModule", { value: true })

const { DEFAULT_CONNECTION_CONFIG } = require("../Defaults/connection")
const { makeCommunitiesSocket } = require("./community")
const { createSocketSupervisor } = require("../Utils/reconnect-supervisor")

// export the last socket layer
const makeWASocket = (config) => {
	const newConfig = {
    	...DEFAULT_CONNECTION_CONFIG,
   	 ...config
    }
    
    // If the user hasn't provided their own history sync function,
    // let's create a default one that respects the syncFullHistory flag.
    if (config.shouldSyncHistoryMessage === undefined) {
        newConfig.shouldSyncHistoryMessage = () => !!newConfig.syncFullHistory
    }

    return makeCommunitiesSocket(newConfig)
}

const makeWASocketWithReconnect = (config = {}, reconnectOptions = {}) => {
    return createSocketSupervisor(() => makeWASocket(config), reconnectOptions)
}

exports.default = makeWASocket
exports.makeWASocketWithReconnect = makeWASocketWithReconnect

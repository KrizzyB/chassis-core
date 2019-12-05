const events = require("events");
const winston = require("winston");

class Log {
    constructor(){
        this.config = config.log ? config.log : getDefaultConfig();
        this.eventEmitter = new events.EventEmitter();
        this.log = winston.createLogger({
            format: winston.format.combine(
                winston.format.timestamp({
                    format: 'YYYY-MM-DD HH:mm:ss'
                }),
                fileFormat
            ),
            exceptionHandlers: [
                new winston.transports.Console(),
                new winston.transports.File({
                    filename: appRoot + "log/exceptions.log"
                })
            ],
            exitOnError: false
        });

        for (let i=0; i<this.config.transports.length; i++) {
            this.log.add(new winston.transports.File({
                filename: appRoot + this.config.transports[i].path,
                level: this.config.transports[i].level,
                format: filterOnly(this.config.transports[i].filters)
            }));
        }

        for (let i=0; i<this.config.console.level.length; i++) {
            this.log.add(new winston.transports.Console({
                level: this.config.console.level[i],
                format: consoleFormat
            }));
        }
    }

    /**
     *
     * @param {String} err
     * @param {String} [module]
     */
    error(err, module) {
        this.log.error(err, {module: module});
        this.eventEmitter.emit("log", {log: err, error: true});
    };

    /**
     *
     * @param {String} message
     * @param {String} [module]
     * @param {Object} [data]
     */
    warn(message, module, data) {
        if (this.config.enabled.warn) {
            let args = checkArgs(module, data);
            module = args.module;
            data = args.data;

            this.log.warn(message, {data: JSON.stringify(data), module: module});
            this.eventEmitter.emit("log", {log: message, data: data, module: module});
        }
    };

    /**
     *
     * @param {String} message
     * @param {String} [module]
     * @param {Object} [data]
     */
    info(message, module, data) {
        if (this.config.enabled.info) {
            let args = checkArgs(module, data);
            module = args.module;
            data = args.data;

            this.log.info(message, {data: JSON.stringify(data), module: module});
            this.eventEmitter.emit("log", {log: message, data: data, module: module});
        }
    };

    /**
     *
     * @param {String} message
     * @param {String} [module]
     * @param {Object} [data]
     */
    verbose(message, module, data) {
        if (this.config.enabled.verbose) {
            let args = checkArgs(module, data);
            module = args.module;
            data = args.data;

            this.log.verbose(message, {data: JSON.stringify(data), module: module});
            this.eventEmitter.emit("log", {log: message, data: data, module: module});
        }
    };

    /**
     *
     * @param {String} message
     * @param {String} [module]
     * @param {Object} [data]
     */
    debug(message, module, data) {
        if (this.config.enabled.debug) {
            let args = checkArgs(module, data);
            module = args.module;
            data = args.data;

            this.log.debug(message, {data: JSON.stringify(data), module: module});
            this.eventEmitter.emit("log", {log: message, data: data, module: module});
        }
    };

    /**
     *
     * @param {String} message
     * @param {String} [module]
     * @param {Object} [data]
     */
    silly(message, module, data) {
        if (this.config.enabled.silly) {
            let args = checkArgs(module, data);
            module = args.module;
            data = args.data;

            this.log.silly(message, {data: JSON.stringify(data), module: module});
            this.eventEmitter.emit("log", {log: message, data: data, module: module});
        }
    };

    /**
     * Standard info log that also passes a complete status to parent process via an event. (Used for cross-thread communication).
     *
     * @param {String} message
     * @param {String} [module]
     * @param {Object} [data]
     */
    complete(message, module, data) {
        let args = checkArgs(module, data);
        module = args.module;
        data = args.data;

        this.log.info(message, {data: JSON.stringify(data), module: module});
        this.eventEmitter.emit("log", {log: message, data: data, module: module, complete: true});
    };
}

function getDefaultConfig() {
    return {
        transports: [{
            path: "log/error.log",
            level: "error",
            filters: ["error"]
        }, {
            path: "log/warn.log",
            level: "warn",
            filters: ["warn"]
        }, {
            path: "log/info.log",
            level: "info",
            filters: ["info"]
        }, {
            path: "log/verbose.log",
            level: "verbose",
            filters: ["verbose"]
        }, {
            path: "log/debug.log",
            level: "debug",
            filters: ["debug"]
        }, {
            path: "log/silly.log",
            level: "silly",
            filters: ["silly"]
        }],
        console: {
            level: ["info"]
        },
        exception : {
            path: "log/exception.log",
            exitOnError: false
        },
        timestamp: {
            format: "YYYY-MM-DD HH:mm:ss"
        },
        enabled: {
            warn: true,
            info: true,
            verbose: false,
            debug: false,
            silly: false
        }
    };
}

/**
 * Checks the types of the optional parameters and places them in the correct variable.
 *
 * @param {String} module
 * @param {Object} data
 * @returns {{data: *, module: *}}
 */
function checkArgs(module, data) {
    if (data && Object.keys(data).length > 0) {
        data = JSON.stringify(data);
    } else {
        data = undefined;
    }

    if (!module) {
        module = "";
    } else if (typeof module === "object") {
        data = module;
        module = undefined;
    }

    return {data: data, module: module};
}

function filterOnly(filters) {
    return winston.format(function (info) {
        if (filters.includes(info.level)) {
            return info;
        }
    })();
}

const fileFormat = winston.format.printf(function(log) {
    let string;

    if (log.module && log.data) {
        string = `${log.timestamp} - ${log.level} [${log.module}] : ${log.message} \n ${log.data}`;
    } else if (log.data) {
        string = `${log.timestamp} - ${log.level} [] : ${log.message} \n ${log.data}`;
    } else if (log.module) {
        string = `${log.timestamp} - ${log.level} [${log.module}] : ${log.message}`;
    } else {
        string = `${log.timestamp} - ${log.level} [] : ${log.message}`;
    }

    return string;
});

const consoleFormat = winston.format.printf(function(log) {
    log.module = log.module ? log.module : "";
    return `${log.timestamp} - ${log.level} [${log.module}] : ${log.message}`;
});

module.exports = Log;

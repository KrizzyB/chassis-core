const events = require("events");
const winston = require("winston");
require('winston-daily-rotate-file');
const Config = require("../model/config/config");
const Log = require("./logger/log");

class Logger {
    constructor(_config){
        let logConfig = _config ? _config : config.getConfigByID("log");
        this.config = logConfig ? logConfig.merge(getDefaultConfig()) : getDefaultConfig().data;
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

        let transports = Object.keys(this.config.transports);
        let enabledLevels = this.config.enabled;
        for (let i=0; i<transports.length; i++) {
            if (enabledLevels[transports[i]] || transports[i] === "error") {
                this.log.add(new winston.transports.DailyRotateFile({
                    filename: appRoot + this.config.transports[transports[i]].dir + this.config.transports[transports[i]].filename,
                    extension: this.config.transports[transports[i]].extension,
                    level: this.config.transports[transports[i]].level,
                    format: filterOnly(this.config.transports[transports[i]].filters),
                    frequency: this.config.transports[transports[i]].rotation.frequency,
                    datePattern: this.config.transports[transports[i]].rotation.datePattern,
                    zippedArchive: this.config.transports[transports[i]].rotation.zippedArchive,
                    maxSize: this.config.transports[transports[i]].rotation.maxSize,
                    maxFiles: this.config.transports[transports[i]].rotation.maxFiles,
                    utc: this.config.transports[transports[i]].rotation.utc
                }));
            }
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
     * @param {String} message
     * @param {String} [module]
     * @param {Object} [data]
     */
    error(message, module, data) {
        let args = checkArgs(module, data);
        module = args.module;
        data = args.data;

        this.log.error(message, {data: JSON.stringify(data), module: module});
        this.eventEmitter.emit("log", {log: message, data: data, module: module, error: true});
        new Log("error", message, module).create();
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
            new Log("warn", message, module).create();
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
            new Log("info", message, module).create();
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
            new Log("verbose", message, module).create();
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
            new Log("debug", message, module).create();
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
            new Log("silly", message, module).create();
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
        new Log("complete", message, module).create();
    };
}

/**
 *
 * @returns {Config}
 */
function getDefaultConfig() {
    return new Config({
        id: "log",
        data: {
            transports: {
                error:{
                    dir: "log/",
                    filename: "error-%DATE%",
                    extension: ".log",
                    level: "error",
                    filters: ["error"],
                    rotation: {
                        frequency: "24h",
                        datePattern: "YYYY-MM-DD",
                        zippedArchive: true,
                        maxSize: null,
                        maxFiles: "365d",
                        utc: "true",
                    }
                },
                warn :{
                    dir: "log/",
                    filename: "warn-%DATE%",
                    extension: ".log",
                    level: "warn",
                    filters: ["warn"],
                    rotation: {
                        frequency: "24h",
                        datePattern: "YYYY-MM-DD",
                        zippedArchive: true,
                        maxSize: null,
                        maxFiles: "365d",
                        utc: "true",
                    }
                },
                info: {
                    dir: "log/",
                    filename: "info-%DATE%",
                    extension: ".log",
                    level: "info",
                    filters: ["info"],
                    rotation: {
                        frequency: "24h",
                        datePattern: "YYYY-MM-DD",
                        zippedArchive: true,
                        maxSize: null,
                        maxFiles: "365d",
                        utc: "true",
                    }
                },
                verbose: {
                    dir: "log/",
                    filename: "verbose-%DATE%",
                    extension: ".log",
                    level: "verbose",
                    filters: ["verbose"],
                    rotation: {
                        frequency: "24h",
                        datePattern: "YYYY-MM-DD",
                        zippedArchive: true,
                        maxSize: null,
                        maxFiles: "365d",
                        utc: "true",
                    }
                },
                debug: {
                    dir: "log/",
                    filename: "debug-%DATE%",
                    extension: ".log",
                    level: "debug",
                    filters: ["debug"],
                    rotation: {
                        frequency: "24h",
                        datePattern: "YYYY-MM-DD",
                        zippedArchive: true,
                        maxSize: null,
                        maxFiles: "365d",
                        utc: "true",
                    }
                },
                silly: {
                    dir: "log/",
                    filename: "silly-%DATE%",
                    extension: ".log",
                    level: "silly",
                    filters: ["silly"],
                    rotation: {
                        frequency: "24h",
                        datePattern: "YYYY-MM-DD",
                        zippedArchive: true,
                        maxSize: null,
                        maxFiles: "365d",
                        utc: "true",
                    }
                }
            },
            console: {
                level: ["info"]
            },
            exception: {
                dir: "log/",
                filename: "exception",
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
        }
    });
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

module.exports = Logger;

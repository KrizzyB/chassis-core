const childProcess = require("child_process");
const crypto = require("crypto");

class Thread {
    constructor(modulePath, method, args = []) {
        this.modulePath = modulePath;
        this.method = method;
        this.args = args;
        this.processId = Thread.generateRandomId(32);
    }

    /**
     *
     * @param {Array} execArgv
     */
    fork(execArgv = []) {
        if (args.debug) {
            execArgv.push("--inspect-brk=" + getFreeDebugPort());
        }
        let threadArgs = Thread.generateArgs(this);
        let childProcessOptions = {
            stdio: "inherit",
            execArgv: execArgv
        };

        let thread = childProcess.fork(appRoot + "node_modules/chassis-core/helper/fork", threadArgs, childProcessOptions);
        thread.on("message", function(message) {
            Log.eventEmitter.emit("message", message);
        });
    }

    /**
     * Generates a random string of letters and numbers
     * @param {Number} [length] - Length of string to be generated. (Default 32)
     * @returns {String} string - Random string.
     */
    static generateRandomId(length) {
        if (!length) {
            length = 32;
        }

        return crypto.randomBytes(length).toString('hex');
    }

    static generateArgs(thread) {
        let args = [];

        //push expected arguments
        args.push(Thread.objectToArgs({key: "modulePath", value: thread.modulePath}));
        args.push(Thread.objectToArgs({key: "method", value: thread.method}));
        args.push(Thread.objectToArgs({key: "processId", value: thread.processId}));

        let keys = Object.keys(thread.args);
        for (let k=0; k<keys.length; k++) {
            args.push(Thread.objectToArgs({key: keys[k], value: thread.args[keys[k]]}));
        }

        return args;
    }

    static objectToArgs(object) {
        let arg = "--" + object.key;
        if (typeof object.value !== "boolean") {
            arg += "=" + object.value
        }
        return arg;
    }
}

function getFreeDebugPort(port) {
    port = port ? port: activeDebugPorts[activeDebugPorts.length-1];
    port++;

    if (activeDebugPorts.includes(port)) {
        port = getFreeDebugPort(port);
    } else {
        activeDebugPorts.push(port);
    }

    return port;
}

module.exports = Thread;

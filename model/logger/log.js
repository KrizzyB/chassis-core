const logAbstract = require("../abstract/logAbstract");

class Log extends logAbstract{
    /**
     *
     * @param {String} level
     * @param {String} message
     * @param {String} module
     * @param {String} [stack]
     */
    constructor(level, message, module, stack) {
        super(schema, "Log");
        this.level = level;
        this.message = message;
        this.module = module;
        this.stack = stack;
        this.createDate = new Date();
    }
}

module.exports = Log;

const schema = {
    level: {
        type: String
    },
    message: {
        type: String
    },
    module: {
        type: String
    },
    stack: {
        type: String
    },
    createDate: {
        type: Date,
        default: Date.now,
    }

};

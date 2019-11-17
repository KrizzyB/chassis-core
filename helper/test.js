module.exports = function(args) {
    try {
        let test = require("./tests/" + args.test);
        test(args);
    } catch (e) {
        throw new Err("Cannot run test: " + args.test + " (" + e.message + ").");
    }
};

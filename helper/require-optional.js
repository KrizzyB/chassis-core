/**
 * Wrapper for Node's require function to allow optional modules to be called but not crash the application if they do not exist.
 * @param {String} module - Module name or path to load.
 * @param {Function} [fallback] - Operation to execute upon failure to load module. (Optional)
 * @returns {Object}
 */

module.exports = function(module, fallback) {
    let _return;

    try {
        _return = require(module);
    } catch (e) {
        if (fallback) {
            _return = fallback(e);
        } else {
            _return = undefined;
        }
    }

    return _return;
};

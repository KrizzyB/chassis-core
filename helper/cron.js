/**
 * Chassis single cron launcher.
 * If the "chassis-cron" module is installed, this allows a single job to be run from the command line
 *
 * @param {Object} args - Application arguments.
 */

let cron;

module.exports = function(args) {
    try {
        cron = requireOptional("chassis-cron");
    } catch (e) {
        throw new Err("Could not find cron job: " + args.cron + " (" + e.message + ").");
    }

    if (cron) {
        cron.run(args.cron, args, args.thread);
    } else {
        throw new Err("Chassis Cron module not installed, please install it by running \"npm install chassis-cron\".");
    }
};

const Chassis = require("../chassis");
const DB = require("chassis-database");

Chassis.bootstrap(function() {
    Log.info("This is an info log");
    Log.warn("This is an warning log");
    Log.error("This is an error log");
    Log.debug("This is an debug log");
    Log.verbose("This is an verbose log");
    Log.silly("This is an silly log");
});

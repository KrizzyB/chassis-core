const VERSION = "0.1.0";

class Chassis {
    static bootstrap(callback) {
        global.args = require('minimist')(process.argv.slice(2));
        global.appRoot = require("app-root-path").path + "/";
        global.requireOptional = require("./helper/require-optional");

        require("./model/config").getConfig(function(err, config) {
            if (err) {
                console.warn("No configuration found in the database or the 'config.json' file, application will use default settings.");
                global.config = {};
            } else {
                global.config = config;
            }

            //we can only initialise these modules after we pull the config
            global.Log = new (require("./helper/log"));
            global.Err = require("./model/error");

            startMainProcess(callback);
        });
    }

    static getVersion() {
        return VERSION;
    }
}

function startMainProcess(callback) {
    if (args.test) {
        runTest(args);   //run a test procedure
    } else if (args.cron) {
        runCron(args.cron);
    } else if (args.v || args.version) {
        printVersion(); //print application version
    } else if (args.h || args.help) {
        printHelp();    //print help information
    } else {
        callback();
    }
}

function runTest(args) {
    require("./helper/test")(args);
}

function runCron(args) {
    require("./helper/cron")(args);
}

function printVersion() {
    console.log("Chassis - Version: " + Chassis.getVersion());
}

function printHelp() {
    //todo: write help
    console.log("This is where the help would go...");
}

module.exports = Chassis;

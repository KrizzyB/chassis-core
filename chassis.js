const PACKAGE = require("./package.json");
global.appPackage = PACKAGE;   //keep app data for module use

class Chassis {
    /**
     *
     * @param {Function} callback - Code to run after initialisation
     */
    static bootstrap(callback) {
        global.args = require('minimist')(process.argv.slice(2));
        global.appRoot = require("app-root-path").path + "/";
        global.appVersion = require(global.appRoot + "package.json").version;
        global.config = {};
        global.requireOptional = require("./helper/require-optional");
        global.FileSystem = require("./helper/filesystem");
        global.Format = require("./helper/format");
        global.Progress = require("./helper/progress");
        global.Thread = require("./model/thread");

        Chassis.getConfig(function(err, config) {
            if (err) {
                if (err.code === "ENOENT") {    //config file does not exist
                    FileSystem.writeFile(appRoot + "config.json", "", function(err, file) {
                        if (err) {
                            console.error("No config file found!");
                        }
                    });
                } else {
                    console.error(err);
                }
            }

            global.config = config;

            //we can only initialise these modules after we load the config
            global.Log = new (require("./model/logger"));
            global.Err = require("./model/error");

            startMainProcess(callback);
        });
    }

    static getPackage() {
        return PACKAGE;
    }

    static getVersion() {
        return PACKAGE.version;
    }

    static getConfig(callback) {
        let ConfigCollection = require("./model/config/configCollection");
        let configs = new ConfigCollection;
        configs.getConfigs(function(err, configs) {
            callback(err, configs);
        });
    }
}

function startMainProcess(callback) {
    if (args.debug) {
        global.activeDebugPorts = [getDebugPort()];
    }

    if (args.test) {
        runTest(args);   //run a test procedure
    } else if (args.cron) {
        runCron(args); //run a single cron job
    } else if (args.v || args.version) {
        printVersion(); //print application version
    } else if (args.h || args.help) {
        printHelp();    //print help information
    } else {
        callback();
    }
}

function getDebugPort() {
    let args = process.execArgv;
    let debugPort;
    for (let i=0; i<args.length; i++) {
        switch (0) {
            case args[i].indexOf("--inspect-brk="):
                debugPort = args[i].slice(14);
                break;
            case args[i].indexOf("--inspect="):
                debugPort = args[i].slice(10);
                break;
            case args[i].indexOf("--inspect-brk"):
                debugPort = 9229;
                break;
            case args[i].indexOf("--inspect"):
                debugPort = 9229;
                break;
        }

        if (debugPort) {
            break;
        }
    }

    return Number(debugPort);
}

function runTest(args) {
    require("./helper/test")(args);
}

function runCron(args) {
    require("./helper/cron")(args);
}

function printVersion() {
    console.log("OPTIONS");
    console.log();
    console.log("--test=[script file name] \t Run test script in the test directory.");
    console.log("--cron=[job name] \t Run single cron job.");
    console.log("-h \t This help information.");
    console.log("-v \t Print Chassis version.");
}

function printHelp() {
    //todo: write help
    console.log("This is where the help would go...");
}

module.exports = Chassis;

/**
 * Entry point for forked threads.
 * Accepts arguments from the Process modal and kicks off the new thread.
 */
class Fork {
    constructor(modulePath, method, processId, args) {
        //clean up duplicate data
        delete args.modulePath;
        delete args.method;
        delete args.processId;

        Log.eventEmitter.on("log", function(message) {  //use events to send logs back to main process
            process.send(formatUpdate(message, this.processId));
        });

        //start thread
        let thread;
        try {
            thread = require(modulePath);
        } catch (e) {
            Log.verbose("Unable to find module " + modulePath + " in current scope, attempting from app root.", "Fork", e);
        }

        if (!thread) {
            try {
                thread = require(appRoot + modulePath);
            } catch (e) {
                throw new Err("Cannot find module \"" + modulePath + "\" to run on thread.");
            }
        }

        if (thread) {
            thread[method](args);
        }
    }
}

function formatUpdate(message, processId) {
    status.push(message.log);

    let process = {
        id: processId,
        status: status
    };

    if (message.complete) {
        process.complete = true;
    } else if (message.error) {
        process.error = true;
    }

    return process;
}

const Chassis = require("../chassis");
Chassis.bootstrap(function() {
    new Fork(args.modulePath, args.method, args.processId, args);
});

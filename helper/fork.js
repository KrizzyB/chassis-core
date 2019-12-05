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

        this.modulePath = modulePath;
        this.method = method;
        this.processId = processId;
        this.args = args;
    }

    run() {
        let parent = this;

        Log.eventEmitter.on("log", function(message) {  //use events to send logs back to main process
            process.send(formatEvent(message, parent.processId));
        });

        //start thread
        let thread;
        try {
            thread = require(this.modulePath);
        } catch (e) {
            Log.verbose("Unable to find module " + this.modulePath + " in current scope, attempting from app root.", "Fork", e);
        }

        if (!thread) {
            try {
                thread = require(appRoot + this.modulePath);
            } catch (e) {
                throw new Err("Cannot find module \"" + this.modulePath + "\" to run on thread.");
            }
        }

        if (thread) {
            thread[this.method](args);
        }
    }
}

formatEvent = function(message, processId) {
    let event = {
        id: processId,
        message: message.log
    };

    if (message.complete) {
        event.complete = true;
    } else if (message.error) {
        event.error = true;
    }

    return event;
};

const Chassis = require("../chassis");
Chassis.bootstrap(function() {
    new Fork(args.modulePath, args.method, args.processId, args).run();
});

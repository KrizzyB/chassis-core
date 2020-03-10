const DB = requireOptional("chassis-database");
const mongoose = DB ? DB.getMongoose() : null;
const Email = requireOptional("chassis-email");
let _config = config.getDataByID("error");

const schema = {
    message: {
        type: String
    },
    data: {
        type: Object
    },
    date: {
        type: Date
    },
    stackTrace: {
        type: Array
    }
};
const model = mongoose ? mongoose.model('Error', mongoose.Schema(schema)): null;

class Err extends Error {
    constructor(message = 'An undefined error occurred.', options = {}) {
        super();

        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, Err);
        }

        this.message = message;
        this.name = "ChassisApplicationException";
        this.date = new Date();
        this.stackTrace = this.stack.split("\n");

        if (Object.keys(options).length) {
            this.data = options.data;
            this.name = options.name;
        }

        this.save();
        this.sendEmail(this);
    }

    save() {
        model ? model.create(this) : false;
    }

    sendEmail(error) {
        if (Email) {
            let body = {};

            body.html = "<b>The following error occurred:</b><br>" + error.message + "<br>&nbsp;<br><b>Stack trace:</b><br>";
            for (let t=0; t< this.stackTrace.length; t++) {
                body.html += this.stackTrace[t] + "<br>";
            }
            body.text = "The following error occurred: \n" + error.message + "\n\nStack trace:\n";
            for (let t=0; t< this.stackTrace.length; t++) {
                body.text += this.stackTrace[t] + "\n";
            }

            let email = new Email(_config.sender, _config.receiver, "❌ ERROR: " + error.message, body, "error");
            email.send(function(email) {
                if (email.err) {
                    Log.error(err.message, "Error");
                }
            });
        }
    }
}

module.exports = Err;

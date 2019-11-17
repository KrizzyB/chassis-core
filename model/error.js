const DB = requireOptional("chassis-database");
const mongoose = DB ? DB.getMongoose() : null;
const Email = requireOptional("chassis-email");

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
    constructor(message = 'An undefined error occurred.', ...params) {
        super(...params);

        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, Err);
        }

        this.message = message;
        this.name = "ChassisApplicationException";
        this.date = new Date();
        this.stackTrace = this.stack.split("\n");

        this.save();
        this.sendEmail(this);
    }

    save() {
        model ? model.create(this) : false;
    }

    sendEmail(error) {
        if (Email) {
            let body = "<b>The following error occurred:</b><br>" + error.message + "<br>&nbsp;<br><b>Stack trace:</b><br>";
            for (let t=0; t< this.stackTrace.length; t++) {
                body += this.stackTrace[t] + "<br>";
            }

            Email.send(
                {
                    to: "kriss@trespass.co.uk",
                    subject: "ERROR: " + error.message,
                    body: body
                },
                "error",
                function (err) {
                    if (err) {
                        console.error("Unable to send error email.");
                        console.error(err);
                    }
                });
        }
    }
}

module.exports = Err;

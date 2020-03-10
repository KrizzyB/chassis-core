const DB = requireOptional("chassis-database");
const mongoose = DB ? DB.getMongoose() : null;
const Email = requireOptional("chassis-email");
const os = require("os");
let _config = config.getDataByID("error");

const schema = {
    message: {
        type: String
    },
    data: {
        type: Object
    },
    name: {
        type: String
    },
    date: {
        type: Date
    },
    stackTrace: {
        type: Array
    },
    debugData: {
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

        this.debugData = [
            {label: "Application Directory", value: appRoot},
            {label: "Machine Name", value: os.hostname()},
            {label: "Uptime", value: os.uptime()},
            {label: "Platform", value: os.platform()},
            {label: "OS Type", value: os.type()},
            {label: "OS Release", value: os.release()},
            {label: "Total Memory", value: os.totalmem()},
            {label: "Free Memory", value: os.freemem()},
            {label: "Network Interfaces", value: getNetworkInterfaces()}
        ];

        this.save();
        this.sendEmail(this);
    }

    save() {
        model ? model.create(this) : false;
    }

    sendEmail(error) {
        if (Email) {
            let body = {};

            body.html = "<h1>" + _config.application + "</h1><b>The following error occurred:</b><br>" + error.message + "<h2>Stack trace:</h2>";
            for (let t=0; t< this.stackTrace.length; t++) {
                body.html += this.stackTrace[t] + "<br>";
            }

            body.html += "<h2>Debug Data</h2><table>";
            for (let d=0; d< this.debugData.length; d++) {
                body.html += "<tr>" +
                    "<td>" + this.debugData[d].label + ":</td>" +
                    "<td>" + this.debugData[d].value + "</td>" +
                    "</tr>";
            }
            body.html += "</table>";


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

function getNetworkInterfaces() {
    let interfaceData = [];
    let networkInterfaces = os.networkInterfaces();

    let interfaces = Object.keys(networkInterfaces);
    for (let i=0; i<interfaces.length; i++) {
        for (let j=0; j<networkInterfaces[interfaces[i]].length; j++) {
            if (!networkInterfaces[interfaces[i]][j].address.internal) {
                interfaceData.push({interface: interfaces[i], address: networkInterfaces[interfaces[i]][j].address});
            }
        }
    }

    let table = "<table>";

    for (let i=0; i<interfaceData.length; i++) {
        table += "<tr>" +
            "<td>" + interfaceData[i].interface + ":</td>" +
            "<td>" + interfaceData[i].address + "</td>" +
            "</tr>";
    }

    table += "</table>";

    return table;
}

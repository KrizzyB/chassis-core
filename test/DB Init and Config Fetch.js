const Chassis = require("../chassis");
const DB = require("chassis-database");

Chassis.bootstrap(function() {
    DB.init(function (err) {
        if (err) {

        } else {
            Chassis.getConfig(function (err, config) {
                if (err) {

                } else {
                    global.config = config;
                }
            })
        }
    })
});

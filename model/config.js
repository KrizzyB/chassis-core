const DB = requireOptional("chassis-database");
const mongoose = DB ? DB.getMongoose() : null;

const schema = {
    id: {
        type: String
    },
    data: {
        type: Object
    }
};

const model = mongoose ? mongoose.model('Config', mongoose.Schema(schema)): null;

const dbNotConnectedErr = {message: "No database connected."};

class Config {
    constructor(_config) {
        let keys = Object.keys(schema);
        for (let i=0; i<keys.length; i++) {
            this[keys[i]] = _config[keys[i]];
        }
    }

    static getConfig(callback, key) {
        const FileSystem = require("../helper/filesystem");
        FileSystem.readFile(appRoot + 'app/config.json', function (err, config) { //attempt to read the config file
            if (err) {
                if (key !== "db" || !config.key) {
                    readConfigFromDB(callback, key);
                } else {
                    callback(null);
                }
            } else {
                readConfigFromFile(config, key, callback);
            }
        });
    }

    static get(setting, callback) {
        if (DB.getReadyState()) {
            model ? model.find(setting, function (err, process) {
                callback(err, process);
            }).lean() : callback();
        } else {
            callback(dbNotConnectedErr);
        }

    }
    static getOne(setting, callback) {
        model ? model.findOne(setting, function (err, process) {
            callback(err, process);
        }).lean() : callback();
    }
    create(callback) {
        Config.getOne({id: this.id}, function (err, _config) {   //check if the item already exists
            if (err) {
                callback(err);
            } else {
                if (!_config) {
                    model ? model.create(this, callback) : callback();
                } else {
                    callback();
                }
            }
        });
    }
    update(callback) {
        Config.getOne({id: this.id}, function (err, _config) {   //check if the item already exists
            if (err) {
                callback(err);
            } else {
                if (_config) {
                    model ? model.findOneAndUpdate({id: this.id}, this, callback) : callback();
                } else {
                    callback(null, null);
                }
            }
        });
    }
    remove(callback) {
        model ? model.deleteOne(this.id, callback) : callback;
    }
}

function readConfigFromFile(config, key, callback) {
    config = JSON.parse(config);
    if (key) {
        if (config[key]) {
            callback(null, config[key]);
        } else {
            callback();
        }
    } else {
        callback(null, config);
    }
}

function readConfigFromDB(callback, key) {
    Config.get({id: key}, callback);
}

module.exports = Config;

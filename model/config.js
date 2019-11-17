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
    /**
     *
     * @param {Object} _config
     */
    constructor(_config) {
        let keys = Object.keys(schema);
        for (let i=0; i<keys.length; i++) {
            this[keys[i]] = _config[keys[i]];
        }
    }

    /**
     *
     * @param {Function} callback
     * @param {String} [key] - Specific config data to return, if omitted all config data is returned.
     */
    static getConfig(callback, key) {
        const FileSystem = require("../helper/filesystem");
        FileSystem.readFile(appRoot + 'app/config.json', function (err, config) { //attempt to read the config file
            if (err) {
                readConfigFromDB(callback, key);
            } else {
                readConfigFromFile(config, callback, key);
            }
        });
    }

    /**
     *
     * @param {Function} callback
     */
    static get(callback) {
        if (DB.getReadyState()) {
            model ? model.find({id: key}, function (err, process) {
                callback(err, process);
            }).lean() : callback();
        } else {
            callback(dbNotConnectedErr);
        }

    }
    static getOne(key, callback) {
        model ? model.findOne({id: key}, function (err, process) {
            callback(err, process);
        }).lean() : callback();
    }

    /**
     *
     * @param {Function} callback
     */
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

    /**
     *
     * @param {Function} callback
     */
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

    /**
     *
     * @param {Function} callback
     */
    remove(callback) {
        model ? model.deleteOne(this.id, callback) : callback;
    }
}

/**
 *
 * @param {String} config
 * @param {Function} callback
 * @param {String} [key]
 */
function readConfigFromFile(config, callback, key) {
    config = JSON.parse(config);
    if (key) {
        if (config[key]) {
            callback(null, config[key]);
        } else {
            readConfigFromDB(callback, key);
        }
    } else {
        callback(null, config);
    }
}

/**
 *
 * @param {Function} callback
 * @param {String} [key]
 */
function readConfigFromDB(callback, key) {
    if (key && key !== "db") {
        if (key) {
            Config.getOne(key, callback);
        } else {
            Config.get(callback);
        }
    } else {
        callback();
    }

}

module.exports = Config;

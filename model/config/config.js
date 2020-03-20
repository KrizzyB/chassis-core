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
     * Merges the properties of two configs
     *
     * @param {Config} config
     * @param {Boolean} [overwrite] - Flag to toggle overwriting of existing values
     */
    merge(config, overwrite) {
        let thisConfig = this.data;
        let newConfig = config.data;

        function mergeObject(object, path, key) {
            let _path = path;
            if (key) {
                _path.push(key);
            }

            let keys = Object.keys(object);
            for (let k=0; k<keys.length; k++) {
                switch(true) {
                    case object[keys[k]] instanceof Array:
                        setValue(keys[k], object[keys[k]], _path);
                        break;
                    case object[keys[k]] instanceof Object:
                        if (Object.keys(object[keys[k]]).length === 0 && object[keys[k]].constructor === Object) {  //if th object is empty
                            setValue(keys[k],object[keys[k]], _path);   //set the value as entering empty object will yield no results
                        } else {
                            mergeObject(object[keys[k]], _path, keys[k]);
                            _path.pop();
                        }
                        break;
                    default:
                        setValue(keys[k],object[keys[k]], _path);
                        break;
                }
            }
        }

        mergeObject(newConfig, []);

        return thisConfig;

        function setValue(key, value, path) {
            let pointer = thisConfig;

            for (let p=0; p<path.length; p++) {
                if (pointer[path[p]] === undefined) {   //build the object
                    pointer[path[p]] = {};
                }

                pointer = pointer[path[p]];
            }

            if (pointer[key] === undefined || overwrite) {
                pointer[key] = value;
            }
        }
    }

    /**
     * Reads the config.json file. If no file is found, falls back to fetching from the database.
     *
     * @param {Function} callback
     * @param {String} [key] - Specific config data to return, if omitted all config data is returned.
     */
    static getConfig(callback, key) {
        const FileSystem = require("../../helper/filesystem");

        readConfigFileFromDir(appRoot + 'app/', function(err, config) { //attempt read from app directory
            if (err) {
                readConfigFileFromDir(appRoot, function(err, config) {  //fallback read to root directory
                    if (err) {
                        readConfigFromDB(callback, key);    //fallback to DB
                    } else if (config) {
                        readConfigFromFile(String(config), callback, key);
                    }
                });
            } else if (config) {
                readConfigFromFile(String(config), callback, key);
            }
        });

        function readConfigFileFromDir(dir, callback) {
            FileSystem.readFile(dir + "config.json", function (err, config) { //attempt to read the config file
                callback(err, config);
            });
        }
    }

    /**
     *
     * @param {Function} callback
     */
    static get(callback) {
        model ? model.find({}, function (err, configs) {
            callback(err, Config.toCollection(configs));
        }).lean() : callback();
    }

    static getOne(key, callback) {
        model ? model.findOne({id: key}, function (err, config) {
            callback(err, config);
        }).lean() : callback();
    }

    static toCollection(configs) {
        if (!(configs instanceof Array)) {  //if configs is not an array
            let _configs = [];
            let keys = Object.keys(configs);
            for (let k=0; k<keys.length; k++) {
                _configs.push({id: keys[k], data: configs[keys[k]]});
            }

            configs = _configs;
        }

        let collection = {};

        for (let c=0; c<configs.length; c++) {
            collection[configs[c].id] = configs[c].data;
        }

        return collection;
    }

    /**
     *
     * @param {Function} callback
     */
    create(callback) {
        let self = this;
        Config.getOne(self.id, function (err, _config) {   //check if the item already exists
            if (err) {
                callback(err);
            } else {
                if (!_config) {
                    model ? model.create(self, callback) : callback();
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
        let self = this;
        Config.getOne(self.id, function (err, _config) {   //check if the item already exists
            if (err) {
                callback(err);
            } else {
                if (_config) {
                    model ? model.findOneAndUpdate({id: self.id}, self, callback) : callback();
                } else {
                    callback(null, null);
                }
            }
        });
    }

    /**
     *
     * @param callback
     */
    save(callback) {
        let self = this;
        Config.getOne(self.id, function (err, _config) {   //check if the item already exists
            if (err) {
                callback(err);
            } else {
                if (_config) {
                    model ? model.findOneAndUpdate({id: self.id}, self, callback) : callback();
                } else {
                    model ? model.create(self, callback) : callback();
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
            callback(null, new Config({id: key, data: config[key]}));
        } else {
            readConfigFromDB(callback, key);
        }
    } else {
        callback(null, Config.toCollection(config));
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

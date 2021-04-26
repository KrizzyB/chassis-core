const CollectionAbstract = require("../abstract/collectionAbstract");
const Config = require("./config");

class ConfigCollection extends CollectionAbstract {
    constructor() {
        super(schema, "Config");
        this.ids = [];
        this.data = [];
        this.configs = [];
    }

    getDataByID(key) {
        let data;
        let keyIndex = this.ids.indexOf(key);
        if (keyIndex >= 0) {
           data = this.data[keyIndex];
        }

        return data;
    }

    getConfigByID(key) {
        let data;
        let keyIndex = this.ids.indexOf(key);
        if (keyIndex >= 0) {
            data = this.configs[keyIndex];
        }

        return data;
    }

    getConfigs(callback) {
        const _this = this;

        readConfigFromDB(function(err, config) {
            if (err) {
                Log.error(err.message, "configCollection");
                readConfigFromFile();
            } else {
                addDataToCollection(config);
                readConfigFromFile();
            }
        });

        function readConfigFromFile() {
            const FileSystem = require("../../helper/filesystem");
            FileSystem.readFile(appRoot + 'config.json', function (err, config) { //attempt to read the config file
                if (err) {
                    callback(err, _this);
                } else {
                    try {
                        config = JSON.parse(String(config));
                    } catch(e) {
                        config = {};
                    }
                    let configArray = [];
                    Object.keys(config).forEach(function(id) {
                        configArray.push({id: id, data: config[id]});
                    });
                    addDataToCollection(configArray);

                    callback(null, _this);
                }
            });
        }

        function readConfigFromDB(callback) {
            _this.getCollection(function (err, config) {
                callback(err, config);
            });
        }

        /**
         *
         * @param {Array} config
         */
        function addDataToCollection(config) {
            for (let c = 0; c < config.length; c++) {
                let _config = new Config(config[c]);
                let idIndex = _this.ids.indexOf(_config.id);
                if (idIndex >=0) {  //config id already exists
                    let currentConfig = _this.configs[idIndex];
                    currentConfig.merge(_config, true);   //merge this config with the existing data

                    _this.ids[idIndex] = currentConfig.id;
                    _this.data[idIndex] = currentConfig.data;
                    _this.configs[idIndex] = currentConfig;
                } else {
                    _this.ids.push(_config.id);
                    _this.data.push(_config.data);
                    _this.configs.push(_config);
                }
            }
        }
    }

    getConfigModel() {
        return Config;
    }
}

const schema = {
    id: {
        type: String
    },
    data: {
        type: Object
    }
};

module.exports = ConfigCollection;

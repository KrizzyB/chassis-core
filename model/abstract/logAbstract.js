const DB = requireOptional("chassis-database");
const mongoose = DB ? DB.getMongoose() : null;

class LogAbstract {
    constructor(schema, modelName) {
        if (mongoose) {
            let _model = mongoose.models[modelName];
            if (_model) {
                this.model = _model;
            } else {
                this.model = mongoose.model(modelName, mongoose.Schema(schema));
            }
        } else {
            this.model = null;
        }
    }

    /**
     *
     * @param {Function} callback
     */
    create() {
        if (this.model) {
            this.model.create(this);
        }
    }
}

module.exports = LogAbstract;

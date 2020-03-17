const DB = requireOptional("chassis-database");
const mongoose = DB ? DB.getMongoose() : null;

class LogAbstract {
    constructor(schema, modelName) {
        let _model = mongoose.models[modelName];
        if (_model) {
            this.model = _model;
        } else {
            this.model = mongoose ? mongoose.model(modelName, mongoose.Schema(schema)): null;
        }
    }

    /**
     *
     * @param {Function} callback
     */
    create() {
        this.model.create(this);
    }
}

module.exports = LogAbstract;

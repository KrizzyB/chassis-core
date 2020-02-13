const DB = requireOptional("chassis-database");
const mongoose = DB ? DB.getMongoose() : null;

class CollectionAbstract {
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
    getCollection(callback) {
        if (DB.getReadyState() && this.model) {
            this.model.find({}, function (err, items) {
                callback(err, items);
            }).lean()
        } else {
            callback(null, [])
        }
    }
}

module.exports = CollectionAbstract;

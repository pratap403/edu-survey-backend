const mongoose = require('mongoose');
const Promise = require('bluebird');
const { mongoURI } = require('./config').dbConnection;

const initMongoDB = async () => {

    mongoose.Promise = Promise;

    try {
        
    await mongoose.connect(mongoURI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        useFindAndModify: false,
        useCreateIndex: true,
        autoIndex: false
    });

    console.log("Mongodb Connection Successfull.");

    const db = mongoose.connection.db;
    } catch (error) {
        console.log(error);
    }
}

const ready = Promise.all([
    initMongoDB(),
  ]);

module.exports = {
    ready,
    getMongoose: () => mongoose,
    getMongoURI: () => mongoURI
}
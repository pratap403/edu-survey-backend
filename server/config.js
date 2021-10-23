var config = module.exports;

config.express = {
    port: process.env.APP_PORT || 3002
}

config.dbConnection = {
    string: process.env.MONGO_URI,
    mongoURI: process.env.MONGO_URI,
}

config.jwtSecret = process.env.JWT_SECRET || 'sdfasdf348fj5586';
config.jwtExpireTime = process.env.JWT_EXPIRE_TIME || '1h';
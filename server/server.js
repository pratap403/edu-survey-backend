require('dotenv').config();
const express = require('express');
const router = require('./router');
const db = require('./db');
const cookieParser = require('cookie-parser');
const config = require('./config');
const app = express();
const auth = require('../lib/auth');
const session = require('express-session');
const cors = require('cors');


// Swagger
const swaggerUi = require('swagger-ui-express');
const swaggerDoc = require('./swagger.json');

db.ready.then(() => {
    const port = config.express.port;

    // basic configuration
    app.set('trust proxy', true);
    app.set('view engine', 'ejs');

    // parse application/x-www-form-urlencoded
    app.use(express.urlencoded({ extended: false }));

    app.use(cors());

    // parse application/json
    app.use(express.json());

    // for parsing cookies
    app.use(cookieParser());

    app.use(session({
        secret: "secret",
        resave: true,
        saveUninitialized: false
    }));

    auth.configureMiddleware(app);


    //v1 api routes
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDoc));
    // Set the router entry point
    app.use('/', router);

    app.use(function (req, res, next) {
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
        next();
    });

    var server = app.listen(port, function () {
        console.log(`Server Started on Port ${server.address().port}`);
    });

})

// setup uncaught exception handler:
process.on('uncaughtException', (err) => {
    console.log('UNCAUGHT EXCEPTION', err.message);
    console.log(err.stack);
    process.exit(1);
});
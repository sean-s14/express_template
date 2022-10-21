require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const app = express();
const env = process?.env;

const bodyParser = require('body-parser'); // Convert the body of incoming requests into JavaScript objects
const cors = require('cors'); // Add headers stating that your API accepts requests coming from other origins
const helmet = require('helmet'); // Secure Express APIs by defining various HTTP headers
const morgan = require('morgan'); // Adds some logging capabilities
const cookieParser = require('cookie-parser');

// =============== DATABASE CONNECTION ===============

async function main() {
    await mongoose.connect(
        env?.DEV_LOCAL_DATABASE ? env.DEV_LOCAL_DATABASE : env?.DEV_REMOTE_DATABASE,
        // TODO: Set this to false when in production
        { autoIndex: false }
    );
}
main().catch(err => console.log(err));


// =============== MIDDLEWARE ===============
let whitelist = ['http://localhost:19006']
let corsOptions = {
    origin: function (origin, callback) {
        //   console.log("Origin:", origin);
        if (whitelist.indexOf(origin) !== -1) {
            callback(null, true)
        } else {
            callback(new Error('Not allowed by CORS'))
        }
    }
}
// app.use(cors(corsOptions));
app.use(cors());
app.use(helmet()); // adding Helmet to enhance your API's security
app.use(bodyParser.json()); // using bodyParser to parse JSON bodies into JS objects
app.use(morgan('combined')); // adding morgan to log HTTP requests
app.use(cookieParser(env?.COOKIE_SECRET));


// =============== ROUTES ===============
const Users = require('./src/routes/users');
app.use('/users', Users);

const Auth = require('./src/routes/auth');
app.use('/auth', Auth);


// =============== LISTENER ===============
// const port = env.PORT;
const port = env.NODE_ENV === 'production' ? 80 : 3000
app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});
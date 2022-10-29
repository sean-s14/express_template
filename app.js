require("dotenv").config();
const env = process.env;

const express = require("express");
const app = express();

// ========== DEVELOPMENT SSL CERTIFICATE ==========
const fs = require('fs');
const https = require("https");
const privateKey  = fs.readFileSync(env.SSL_KEY_FILE, 'utf8');
const certificate = fs.readFileSync(env.SSL_CRT_FILE, 'utf8');
const credentials = {key: privateKey, cert: certificate};

const mongoose = require("mongoose");
const bodyParser = require("body-parser"); // Convert the body of incoming requests into JavaScript objects
const cors = require("cors"); // Add headers stating that your API accepts requests coming from other origins
const helmet = require("helmet"); // Secure Express APIs by defining various HTTP headers
const morgan = require("morgan"); // Adds some logging capabilities
const cookieParser = require("cookie-parser");
const session = require("express-session");
// const cookieSession = require("cookie-session");

// =============== DATABASE CONNECTION ===============
mongoose.connect(
        env?.DEV_LOCAL_DATABASE ? env.DEV_LOCAL_DATABASE : env?.DEV_REMOTE_DATABASE,
        // TODO: Set this to false when in production
        { autoIndex: false }
    )
    .then( () => console.log("MongoDB Connected..."))
    .catch( err => console.log(err));


// =============== MIDDLEWARE ===============
let whitelist = [env.CORS_WHITELIST]
let corsOptions = {
    origin: function (origin, callback) {
        //   console.log("Origin:", origin);
        if (whitelist.indexOf(origin) !== -1) {
            callback(null, true)
        } else {
            callback(new Error("Not allowed by CORS"))
        }
    }
}
// app.use(cors(corsOptions));
app.use(cors({credentials: true, origin: env.CLIENT_URL}));
// app.use(function(req, res, next) {
//     res.header("Access-Control-Allow-Origin", env.CLIENT_URL);
//     res.header("Access-Control-Allow-Credentials", true);
//     res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
//     next();
// });
app.set("trust proxy", 1);
app.use(helmet()); // adding Helmet to enhance your API"s security
app.use(bodyParser.json()); // using bodyParser to parse JSON bodies into JS objects
app.use(morgan("combined")); // adding morgan to log HTTP requests
app.use(cookieParser(env.COOKIE_SECRET));
app.use(session({
    secret: env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      sameSite: "none",
      secure: true,
      maxAge: 1000 * 60 * 60 * 24 * 2 // One Week
    }
}));
// app.use(cookieSession({
//     name: "session", 
//     keys: ["lama"], 
//     maxAge: 24 * 60 * 60 * 100
// }));

// =============== PASSPORT ===============
// require("./src/middleware/passport")(passport);
// const Google = require("./src/routes/google");
// app.use("/google", Google);


// =============== ROUTES ===============
const User = require("./src/routes/user");
app.use("/user", User);

const Users = require("./src/routes/users");
app.use("/users", Users);

const Auth = require("./src/routes/auth");
app.use("/auth", Auth);

const Items = require("./src/routes/items");
app.use("/items", Items);


// =============== LISTENER ===============
https.createServer(credentials, app).listen(env.PORT, () => 
    console.log(`Listening at https://localhost:${env.PORT}`));
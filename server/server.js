const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const passport = require('passport');
require('./passport-config')(passport);
const session = require('express-session');


require('dotenv').config();
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

const app = express();
app.use(express.json());
const port = 3000;

app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const apiRoutes = require('./routes/api.js');
apiRoutes(app);

app.listen(3000, () => {
    console.log('Server is listening on port 3000');
});

const path = require('path');
// Join paths so you don't have to use index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/home.html'));
});

// in order to display on localhost:3000 
app.use(express.static('../public'));

// PSQL stuff
// const { Pool } = require('pg');
// const pool = new Pool({
//     user: 'postgres',
//     host: 'localhost',
//     database: 'recipeapp',
//     password: 'shadow11',
//     port: 5432,
// });


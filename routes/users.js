var express = require('express');
var cors = require('cors');
var bcrypt = require('bcrypt');
var jsonwebtoken = require('jsonwebtoken');

var router = express.Router();

// Allow express to use cross-origin resource sharing.
router.use(cors());

// This should be changed to something less obvious
process.env.SECRET_KEY = 'secret';

const SELECT_ALL = "SELECT * FROM users;";
const SELECT_ONE = "SELECT * FROM users WHERE user_id={0};";

/* GET users listing. */
router.get('/', (req, res) => {
    database.query(SELECT_ALL, (err, result) => {
        res.send(result);
    });
});

router.post('/register', (req, res, next) => {
    if (Object.keys(req.body).length === 0) {
        res.status(400).send("Invalid POST request.");
        return;
    }

    let form_data = {
        username: req.body.username,
        password: req.body.password,
        first_name: req.body.first_name,
        last_name: req.body.last_name
    };

    database.query(`SELECT user_id FROM users WHERE username='${form_data.username}';`, (err, result) => {
        if (err) {
            res.status(500).send(err);
            console.log(err);
            return;
        }
        console.log(result);
        if (result.length > 0) {
            res.status(400).send('Error: User already exists');
            return;
        } else {
            bcrypt.hash(form_data.password, bcrypt.genSaltSync(10), (err, hash) => {
                if (err) {
                    res.status(400).send('Error: Failed to set password');
                    return;
                }

                let date = new Date();
                let currentDate = date.getFullYear().toString() + '-' + (date.getMonth() + 1) + '-' + date.getDate().toString();

                let query = "INSERT INTO users (username,password,is_admin,date_created,date_last_login,first_name,last_name) " +
                            `VALUES ('${form_data.username}','${hash}',0,'${currentDate}','${currentDate}','${form_data.first_name}','${form_data.last_name}');`;

                database.query(query, (err, result) => {
                    if (err) {
                        res.status(400).send('Error: Unable to create user');
                        return;
                    }

                    res.json({ status: form_data.username + ' registered' });
                });
            });
        }
    });
});

router.post('/login', (req,res) => {
    if (Object.keys(req.body).length === 0) {
        res.status(400).send("Invalid POST request.");
        return;
    }

    let form_data = {
        username: req.body.username,
        password: req.body.password
    };

    database.query(`SELECT * FROM users WHERE username='${form_data.username}'`, (err, result) => {
        if (err) {
            res.status(400).send("Error: Unable to login.");
            return;
        }

        if (result.length > 0) {
            if (bcrypt.compareSync(form_data.password, result[0].password)) {
                let user = Object.assign({},result[0]);
                console.log(user);

                // Generate token and send it.
                let token = jsonwebtoken.sign(user, process.env.SECRET_KEY, { expiresIn: '7d' });
                res.send(token);
            } else {
                res.status(400).send('Error: Invalid credentials.');
            }
        } else {
            res.status(400).send("Error: Invalid credentials.");
            return;
        }
    });
});

module.exports = router;

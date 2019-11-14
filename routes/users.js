var express = require('express');
var cors = require('cors');
var bcrypt = require('bcrypt');
var jsonwebtoken = require('jsonwebtoken');
var authenticate = require('../authenticate');
var database = require('../database');

var router = express.Router();

// Allow express to use cross-origin resource sharing.
router.use(cors());

// This should be changed to something less obvious
process.env.SECRET_KEY = 'secret';

const SELECT_ALL = "SELECT * FROM users;";

/* GET users listing. */
router.get('/', (req, res) => {
    authenticate.doIfLoggedIn(req, res, () => {
        database.query(SELECT_ALL, (err, result) => {
            res.send(result);
        });
    });
});

/* GET user by username. */
router.get('/:username', (req, res) => {
    authenticate.doIfLoggedIn(req, res, () => {
        database.query(`SELECT * FROM users WHERE username='${req.params.username}';`, (err, result) => {
            res.send(result);
        });
    });
});

/* GET user by ID. */
router.get('/id/:user_id', (req, res) => {
    authenticate.doIfLoggedIn(req, res, () => {
        database.query(`SELECT * FROM users WHERE user_id='${req.params.user_id}';`, (err, result) => {
            res.send(result);
        });
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

router.post('/login', (req, res) => {
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
                let user = Object.assign({}, result[0]);

                // Generate token
                let token = jsonwebtoken.sign(user, process.env.SECRET_KEY, { expiresIn: '7d' });

                // Get the current date in YYYY/MM/DD format
                let date = new Date();
                let currentDate = date.getFullYear().toString() + '-' + (date.getMonth() + 1) + '-' + date.getDate().toString();

                // update date_last_login
                database.query(`UPDATE users SET date_last_login='${currentDate}' WHERE username='${form_data.username}';`, (err, result) => {
                    if (err) {
                        res.status(400).send("Error: Unable to set date_last_login to current date.");
                    }
                });

                console.log(`Login from user '${user.username}'`);

                // send user token
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

router.post('/update', (req, res) => {
    authenticate.doIfLoggedIn(req, res, () => {
        if (Object.keys(req.body).length === 0) {
            res.status(400).send("Invalid POST request.");
            return;
        }

        let form_data = {
            user_id: req.body.user_id,
            username: req.body.username,
            first_name: req.body.first_name,
            last_name: req.body.last_name
        };

        database.query(`UPDATE users SET username='${form_data.username}',first_name='${form_data.first_name}',last_name='${form_data.last_name}' WHERE user_id='${form_data.user_id}';`, (err, result) => {
            if (err) {
                res.status(400).send('Error: Unable to update user information.');
            } else {
                console.log(`Updated info for user: ${form_data.user_id}`);
                res.send(`Updated user info for user ${form_data.user_id} (${form_data.username})`);
            }
        });
    });
});

router.delete('/delete/:user_id', (req, res) => {
    authenticate.doIfLoggedIn(req, res, () => {
        database.query(`DELETE FROM users WHERE user_id='${req.params.user_id}';`, (err, result) => {
            if (err) {
                res.status(400).send('Error: Unable to delete user.');
            } else {
                console.log(`Deleted user: ${req.params.user_id}`);
                res.send(`Deleted user ${req.params.user_id}`);
            }
        });
    });
});

// TODO: change password route

module.exports = router;

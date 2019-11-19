var express = require('express');
var cors = require('cors');
var bcrypt = require('bcrypt');
var jsonwebtoken = require('jsonwebtoken');
var authenticate = require('../authenticate');
var database = require('../database/database');
var users = require('../database/queries/users');
var MongoDB = require('mongodb');

var router = express.Router();

// Allow express to use cross-origin resource sharing.
router.use(cors());

// This should be changed to something less obvious
process.env.SECRET_KEY = 'secret';

/* GET users listing. */
router.get('/', (req, res) => {
    authenticate.doIfLoggedIn(req, res, () => {
        users.getDocuments("users").then((result) => {
            console.log(result);
            res.json(result);
        }).catch(err => console.error(err));
    });
});

/* GET user by username. */
router.get('/:username', (req, res) => {
    authenticate.doIfLoggedIn(req, res, () => {
        users.getDocument("users", { username: req.params.username }).then((result) => {
            console.log(result);
            res.json(result);
        }).catch(err => console.error(err));
    });
});

/* GET user by ID. */
router.get('/id/:_id', (req, res) => {
    authenticate.doIfLoggedIn(req, res, () => {
        users.getDocument("users", { _id: new MongoDB.ObjectID(req.params._id) }).then((result) => {
            res.json(result);
        }).catch(err => console.error(err));
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

    users.getDocument({ username: form_data.username }).then((result) => {
        console.log(result);
        if (result) {
            res.status(400).json({ Error: 'User already exists' });
        } else {
            bcrypt.hash(form_data.password, bcrypt.genSaltSync(10), (err, hash) => {
                if (err) {
                    res.status(400).json({ Error: 'Failed to set password' });
                } else {
                    let date = new Date();
                    let currentDate = date.getFullYear().toString() + '-' + (date.getMonth() + 1) + '-' + date.getDate().toString();

                    users.insertDocument("users", {
                        username: form_data.username,
                        password: hash,
                        is_admin: 0,
                        date_created: currentDate,
                        date_last_login: currentDate,
                        first_name: form_data.first_name,
                        last_name: form_data.last_name
                    }).then(insertionResult => {
                        console.log(`Inserted ${insertionResult.insertedId}`);

                        let insertedData = insertionResult.ops;
                        // Append ID field to the object
                        insertedData["_id"] = insertionResult.insertedId;

                        res.json(insertionResult.ops);
                    }).catch(insertionError => {
                        console.error(insertionError);
                    });
                }
            });
        }
    }).catch(err => console.error(err));
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

    users.getDocument("users", { username: form_data.username }).then((user) => {
        if (user) {
            if (bcrypt.compareSync(form_data.password, user.password)) {
                // Generate token
                let token = jsonwebtoken.sign(user, process.env.SECRET_KEY, { expiresIn: '7d' });

                // Get the current date in YYYY/MM/DD format
                let date = new Date();
                let currentDate = date.getFullYear().toString() + '-' + (date.getMonth() + 1) + '-' + date.getDate().toString();

                users.updateDocument("users", { username: form_data.username }, { date_last_login: currentDate }).then(() => {
                    console.log(`Login from user '${user.username}'`);
                    res.send(token);
                }).catch(() => res.status(400).send("Error: Unable to login."));
            } else {
                res.status(400).send('Error: Invalid credentials.');
            }
        } else {
            res.status(400).send("Error: Invalid credentials.");
        }
    }).catch(() => res.status(400).send("Error: Unable to login."));
});

router.post('/update/:username', (req, res) => {
    authenticate.doIfLoggedIn(req, res, () => {
        let form_data = {
            username: req.body.username,
            first_name: req.body.first_name,
            last_name: req.body.last_name
        }

        var decoded_token = jsonwebtoken.verify(req.headers['authorization'], process.env.SECRET_KEY);

        if (decoded_token.username === req.params.username) {
            users.updateDocument("users", { username: req.params.username }, form_data).then(result => {
                console.log(`Updated info for user: ${req.params.username}`);
                res.json(result);
            }).catch(() => res.status(400).send('Error: Unable to update user information.'));
        } else {
            res.status(400).send('Error: You can only update your own user account.');
        }
    });
});

router.post('/update/password/:username', (req, res) => {
    authenticate.doIfLoggedIn(req, res, () => {
        var decoded_token = jsonwebtoken.verify(req.headers['authorization'], process.env.SECRET_KEY);

        if (decoded_token.username === req.params.username) {
            bcrypt.hash(req.body.password, bcrypt.genSaltSync(10), (err, hash) => {
                users.updateDocument("users", { username: req.params.username }, { password: hash }).then(result => {
                    console.log(`Updated info for user: ${req.params.username}`);
                    res.json(result);
                }).catch(() => res.status(400).send('Error: Unable to update user information.'));
            });
        } else {
            res.status(400).send('Error: You can only update your own user account.');
        }
    });
});

router.delete('/delete/:username', (req, res) => {
    authenticate.doIfLoggedIn(req, res, () => {
        var decoded_token = jsonwebtoken.verify(req.headers['authorization'], process.env.SECRET_KEY);

        if (decoded_token.username === req.params.username) {
            users.deleteDocument("users", { username: req.params.username }).then(result => {
                console.log(`Deleted user: ${req.params.username}`);
                res.json({ status: `Deleted user: ${req.params.username}` });
            }).catch(() => res.status(400).send('Error: Unable to delete user.'));
        } else {
            res.status(400).send('Error: You can only delete your own user account.');
        }
    });
});

module.exports = router;

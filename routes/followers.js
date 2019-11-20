var express = require('express');
var cors = require('cors');
var jsonwebtoken = require('jsonwebtoken');
var authenticate = require('../authenticate');
var database = require('../database/database');
var query = require('../database/queries');
var MongoDB = require('mongodb');

var router = express.Router();

// Allow express to use cross-origin resource sharing.
router.use(cors());

const COLLECTION = "followers";

/**
 * Get followers list
 */
router.get('/', (req, res) => {
    authenticate.doIfLoggedIn(req, res, () => {
        var decoded_token = jsonwebtoken.verify(req.headers['authorization'], process.env.SECRET_KEY);
        query.getDocuments(COLLECTION, { "usernames.0": decoded_token.username }).then(followers => {
            res.send(followers);
        });
    });
});

/**
 * Get followers list by username
 */
router.get('/:username', (req, res) => {
    authenticate.doIfLoggedIn(req, res, () => {
        query.getDocuments(COLLECTION, { "usernames.0": req.params.username }).then(followers => {
            res.send(followers);
        });
    });
});

/**
 * Add user to followers
 */
router.get('/add/:username', (req, res) => {
    authenticate.doIfLoggedIn(req, res, () => {
        var decoded_token = jsonwebtoken.verify(req.headers['authorization'], process.env.SECRET_KEY);
        query.getDocuments(COLLECTION, { "usernames.0": decoded_token.username }).then(result => {
            let following = false;
            result.forEach(record => {
                following = (record.usernames[1] === req.params.username);
            });

            if (following) {
                res.status(400).send('Error: You are already following this person.');
            } else {
                query.insertDocument(COLLECTION, {
                    usernames: [decoded_token.username, req.params.username]
                }).then(r => {
                    res.json(r);
                }).catch(() => res.status(400).send('Error: Unable to follow.'));
            }
        });
    });
});

/**
 * Remove user from followers
 */
router.get('/remove/:username', (req, res) => {
    authenticate.doIfLoggedIn(req, res, () => {
        var decoded_token = jsonwebtoken.verify(req.headers['authorization'], process.env.SECRET_KEY);
        query.getDocuments(COLLECTION, { "usernames.0": decoded_token.username }).then(result => {
            let following = false;
            let followerRecord = undefined;

            result.forEach(record => {
                if (record.usernames[1] === req.params.username) {
                    following = true;
                    followerRecord = record;
                } else {
                    following = false;
                }
            });

            console.log(following);

            if (following) {
                query.deleteDocument(COLLECTION, {
                    _id: MongoDB.ObjectID(followerRecord._id)
                }).then(r => {
                    res.json(r);
                }).catch(() => res.status(400).send('Error: Unable to unfollow.'));
            } else {
                res.status(400).send('Error: You are not following this person.');
            }
        });
    });
});

module.exports = router;
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

const COLLECTION = "friends";

/**
 * Get friends list
 */
router.get('/', (req, res) => {
    authenticate.doIfLoggedIn(req, res, () => {
        var decoded_token = jsonwebtoken.verify(req.headers['authorization'], process.env.SECRET_KEY);
        query.getDocuments(COLLECTION, {usernames: {$in: [decoded_token.username]}}).then(friends => {
            console.log(friends);
            res.send(friends);
        });
    });
});

module.exports = router;
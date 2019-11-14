var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/', function (req, res, next) {
    let query = "SELECT * FROM users;";

    database.query(query, (err, result) => {
        res.send(result);
    });
    //res.send('respond with a resource');
});

module.exports = router;

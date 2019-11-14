var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/', (req, res) => {
    database.query(SELECT_ALL, (err, result) => {
        res.send(result);
    });
});
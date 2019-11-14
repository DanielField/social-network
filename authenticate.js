const jwt = require('jsonwebtoken');
var database = require('./database');

// Verify that the user is logged in.
confirmLoggedIn = async function(token) {
    if (token === null || token === undefined) return 0;
    try {
        var decoded_token = jwt.verify(token, process.env.SECRET_KEY);
        var result = await database.query(`SELECT user_id FROM users WHERE user_id=${decoded_token.user_id};`);
        if (result) return 1;
    } catch(err) {
        console.log(err);
        return 0;
    }
    return 0;
}

// Verify that the user has admin privileges.
var confirmAdmin = async function(token) {
    if (token == null || token == undefined) return 0;
    try {
        var decoded_token = jwt.verify(token, process.env.SECRET_KEY);
        var result = await database.query(`SELECT user_id FROM users WHERE user_id=${decoded_token.user_id};`);
        if (result) return (result[0].is_admin) ? 1 : 0;
    } catch(err) {
        console.log(err);
        return 0;
    }
    return 0;
}

module.exports = {
    confirmLoggedIn,
    confirmAdmin
};
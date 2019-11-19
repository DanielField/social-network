const jwt = require('jsonwebtoken');
var users = require('./database/queries/users');

// Verify that the user is logged in.
var confirmLoggedIn = async function(token) {
    if (token === null || token === undefined) return 0;
    try {
        var decoded_token = jwt.verify(token, process.env.SECRET_KEY);
        var result = await users.getUsers({_id: decoded_token._id});
        if (result) return 1;
    } catch(err) {
        console.log(err);
        return 0;
    }
    return 0;
}

// Do action if user is logged in, else give 403 error.
function doIfLoggedIn(req, res, action) {
    confirmLoggedIn(req.headers['authorization']).then((is_logged_in) => {
        if (is_logged_in) {
            action();
        } else {
            res.status(403).send("You are not permitted to access this resource.");
        }
    });
}

// Verify that the user has admin privileges.
var confirmAdmin = async function(token) {
    if (token == null || token == undefined) return 0;
    try {
        var decoded_token = jwt.verify(token, process.env.SECRET_KEY);
        var result = await users.getUsers({_id: decoded_token._id});
        if (result) return (result[0].is_admin) ? 1 : 0;
    } catch(err) {
        console.log(err);
        return 0;
    }
    return 0;
}

// Do action if user is logged in and an administrator, else give 403 error.
function doIfAdmin(req, res, action) {
    confirmAdmin(req.headers['authorization']).then((is_admin) => {
        if (is_admin) {
            action();
        } else {
            res.status(403).send("You are not permitted to access this resource.");
        }
    });
}

module.exports = {
    confirmLoggedIn,
    confirmAdmin,
    doIfLoggedIn,
    doIfAdmin
};
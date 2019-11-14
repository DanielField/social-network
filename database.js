const util = require('util');
const mysql = require('mysql');

// Setup the database connection
const database = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'toor',
    database: 'socialnetwork',
    connectionLimit: 5
});

// Test the database connection.
database.getConnection((err, connection) => {
    // Error occurred
    if (err) {
        console.log("An error occurred while trying to connect to the database. Exiting the application...");
    }

    if (connection) {
        // Connected
        console.log("Connection to database has been established.");
        connection.release()
    };
});

database.query = util.promisify(database.query);

module.exports = database;
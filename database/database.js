const util = require('util');
const Strings = require('../strings.json');
const MongoClient = require('mongodb').MongoClient;

/**
 * Test the connection to the MongoDB server.
 */
async function testConnection() {
    const client = new MongoClient(Strings.server.uri, { useNewUrlParser: true, useUnifiedTopology: true });

    await client.connect();
    await client.close();
}

/**
 * Handle any database instructions, and close the client connection.
 * 
 * @param {*} instructions Function containing the database instructions. Example: handle(client => { return client.db().admin().listDatabases() });
 */
async function handle(instructions) {
    const client = new MongoClient(Strings.server.uri, { useNewUrlParser: true, useUnifiedTopology: true });

    try {
        await client.connect();
        return instructions(client);
    } catch (err) {
        throw err;
    } finally {
        await client.close();
    }
}

/**
 * Get a list of databases.
 */
async function getDatabases() {
    return handle(client => {
        return client.db().admin().listDatabases();
    });    
}

module.exports = { testConnection, handle, getDatabases };
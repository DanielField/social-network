const database = require('../database');

/**
 * Get a list of users. \
 * \
 * Examples: 
 * ```
 *  getUsers({first_name: "bob"},{last_name: 1},10); // get 10 users with first_name 'bob' sorted by last_name (asc).
 *  getUsers(); // Get all users
 * ```
 * @param {*} filter Filter documents by specific fields.
 * @param {*} sort Sort the results. Defaults to _id ascending.
 * @param {*} limit Limit the result count. (ignore limit parameter to get ALL users that match the filter)
 */
async function getUsers(filter, sort = {_id: 1}, limit = Number.MAX_SAFE_INTEGER) {
    return database.handle(client => {
        let res = client.db("db0").collection("users").find(filter).sort(sort);
        return limit? res.limit(limit).toArray() : res;
    });    
}

/**
 * Get a user that matches filter. \
 * \
 * Example: 
 * ```
 *  getUser({username: "bob"});
 * ```
 * 
 * @param {*} filter Filter results by specific fields. 
 */
async function getUser(filter) {
    return database.handle(client => {
        return client.db("db0").collection("users").findOne(filter);
    });    
}

/**
 * Insert a user. \
 * \
 * Example:
 *  
 * ```
 *  insertUser({
 *      username: "billy123", 
 *      password: "$2b$10$OpDgtVnP7uy.V.37D50Vzek2n8k61RPP50y7yP0siWx0911cIzZa6", 
 *      is_admin: 1, 
 *      date_created: "2019-11-14", 
 *      date_last_login: "2019-11-15",
 *      first_name: "Billy",
 *      last_name: "Bob"
 *  });
 * ```
 * 
 * @param {*} document The document to be inserted into the collection.
 */
async function insertUser(document) {
    return database.handle(client => {
        return client.db("db0").collection("users").insertOne(document);
    });    
}

/**
 * Update a user. \
 * \
 * Example:
 *  
 * ```
 *  updateUser({
 *      username: "billy123"
 *  },
 *  {
 *      first_name: "Billy",
 *      last_name: "Bobby"
 *  });
 * ```
 * 
 * @param {*} filter Filter users by specified fields (Only the documents that match will be updated).
 * @param {*} updatedValues The new values to update the document.
 */
async function updateUser(filter, updatedValues) {
    return database.handle(client => {
        return client.db("db0").collection("users").updateOne(filter, { $set: updatedValues });
    });    
}

async function deleteUser(filter) {
    return database.handle(client => {
        return client.db("db0").collection("users").deleteOne(filter);
    });    
}

module.exports = {getUsers, getUser, insertUser, updateUser, deleteUser};
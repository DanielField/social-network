const database = require('../database');

/**
 * Get a list of documents. \
 * \
 * Examples: 
 * ```
 *  getDocuments({first_name: "bob"},{last_name: 1},10); // get 10 documents with first_name 'bob' sorted by last_name (asc).
 *  getDocuments(); // Get all documents
 * ```
 * @param {*} filter Filter documents by specific fields.
 * @param {*} sort Sort the results. Defaults to _id ascending.
 * @param {*} limit Limit the result count. (ignore limit parameter to get ALL documents that match the filter)
 */
async function getDocuments(collection, filter, sort = { _id: 1 }, limit = Number.MAX_SAFE_INTEGER) {
    return database.handle(client => {
        let res = client.db("db0").collection(collection).find(filter).sort(sort);
        return limit ? res.limit(limit).toArray() : res;
    });
}

/**
 * Get a document that matches filter. \
 * \
 * Example: 
 * ```
 *  getDocument({username: "bob"});
 * ```
 * 
 * @param {*} filter Filter results by specific fields. 
 */
async function getDocument(collection, filter) {
    return database.handle(client => {
        return client.db("db0").collection(collection).findOne(filter);
    });
}

/**
 * Insert a document. \
 * \
 * Example:
 *  
 * ```
 *  insertDocument({
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
async function insertDocument(document) {
    return database.handle(client => {
        return client.db("db0").collection(collection).insertOne(document);
    });
}

/**
 * Update a document. \
 * \
 * Example:
 *  
 * ```
 *  updateDocument({
 *      username: "billy123"
 *  },
 *  {
 *      first_name: "Billy",
 *      last_name: "Bobby"
 *  });
 * ```
 * 
 * @param {*} filter Filter documents by specified fields (Only the documents that match will be updated).
 * @param {*} updatedValues The new values to update the document.
 */
async function updateDocument(collection, filter, updatedValues) {
    return database.handle(client => {
        return client.db("db0").collection(collection).updateOne(filter, { $set: updatedValues });
    });
}

async function deleteDocument(collection, filter) {
    return database.handle(client => {
        return client.db("db0").collection(collection).deleteOne(filter);
    });
}

module.exports = { getDocuments, getDocument, insertDocument, updateDocument, deleteDocument };
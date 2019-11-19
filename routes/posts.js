var express = require('express');
var jwt = require('jsonwebtoken');
var query = require('../database/queries');
var authenticate = require('../authenticate');
var MongoDB = require('mongodb');
var cors = require('cors');
var router = express.Router();

const COLLECTION = "posts";

// Allow express to use cross-origin resource sharing.
router.use(cors());

/* Get posts listing. */
router.get('/', (req, res) => {
    authenticate.doIfLoggedIn(req, res, () => {
        query.getDocuments(COLLECTION).then((result) => {
            console.log(result);
            res.json(result);
        }).catch(err => console.error(err));
    });
});

/* Get posts by username */
router.get('/:username', (req, res) => {
    authenticate.doIfLoggedIn(req, res, () => {
        query.getDocument(COLLECTION, { username: req.params.username }).then((result) => {
            console.log(result);
            res.json(result);
        }).catch(err => console.error(err));
    });
});

/* Create post */
router.post('/create', (req, res) => {
    authenticate.doIfLoggedIn(req, res, () => {
        let date = new Date();
        let currentDate = date.getFullYear().toString() + '-' + (date.getMonth() + 1) + '-' + date.getDate().toString();

        query.insertDocument(COLLECTION, {
            content: req.body.content,
            likes: [],
            dislikes: [],
            date_posted: currentDate,
            username: (jwt.verify(req.headers['authorization'], process.env.SECRET_KEY)).username,
            replies: []
        }).then((result) => {
            console.log(result);
            res.json(result);
        }).catch(err => console.error(err));
    });
});

/**
 * Update post by ID.
 */
router.post('/update/:_id', (req, res) => {
    authenticate.doIfLoggedIn(req, res, () => {

        var decoded_token = jwt.verify(req.headers['authorization'], process.env.SECRET_KEY);

        query.getDocument(COLLECTION, { _id: MongoDB.ObjectID(req.params._id) }).then(post => {
            if (decoded_token.username === post.username) {
                query.updateDocument(COLLECTION, { _id: MongoDB.ObjectID(req.params._id) }, {
                    content: req.body.content
                }).then(result => {
                    console.log(`Updated post for user: ${post.username}`);
                    res.json(result);
                }).catch(() => res.status(400).send('Error: Unable to update post.'));
            } else {
                res.status(400).send('Error: You can only update your own posts.');
            }
        }).catch(() => res.status(400).send('Error: Post does not exist.'));
    });
});

/**
 * Like post by ID. If user has already liked post, cancel the like.
 * If the user has disliked the post, remove the dislike and then like the post.
 */
router.post('/like/:_id', (req, res) => {
    authenticate.doIfLoggedIn(req, res, () => {

        var decoded_token = jwt.verify(req.headers['authorization'], process.env.SECRET_KEY);

        query.getDocument(COLLECTION, { _id: MongoDB.ObjectID(req.params._id) }).then(post => {
            // If user has not liked post yet, like it.
            if (!post.likes.includes(decoded_token.username)) {
                let updatedDislikes = post.dislikes;

                // remove the dislike, if it exists
                if (post.dislikes.includes(decoded_token.username)) {
                    let index = updatedDislikes.indexOf(decoded_token.username);
                    updatedDislikes.splice(index, 1);
                }


                query.updateDocument(COLLECTION, { _id: MongoDB.ObjectID(req.params._id) }, {
                    likes: [...post.likes, decoded_token.username],
                    dislikes: updatedDislikes
                }).then(result => {
                    console.log(`Liked post ${req.params._id}`);
                    res.json(result);
                }).catch(() => res.status(400).send('Error: Unable to like post.'));
            }
            // Else if user has already liked the post, unlike it.
            else {
                let index = post.likes.indexOf(decoded_token.username);
                let updatedLikes = post.likes;
                updatedLikes.splice(index, 1);

                query.updateDocument(COLLECTION, { _id: MongoDB.ObjectID(req.params._id) }, {
                    likes: updatedLikes
                }).then(result => {
                    console.log(`Unliked post ${req.params._id}`);
                    res.json(result);
                }).catch(() => res.status(400).send('Error: Unable to unlike post.'));
            }

        }).catch(() => res.status(400).send('Error: Post does not exist.'));
    });
});

/**
 * Dislike post by ID. If user has already disliked post, cancel the dislike.
 * If the user has liked the post, remove the like and then dislike the post.
 */
router.post('/dislike/:_id', (req, res) => {
    authenticate.doIfLoggedIn(req, res, () => {

        var decoded_token = jwt.verify(req.headers['authorization'], process.env.SECRET_KEY);

        query.getDocument(COLLECTION, { _id: MongoDB.ObjectID(req.params._id) }).then(post => {
            // If user has not disliked post yet, dislike it.
            if (!post.dislikes.includes(decoded_token.username)) {
                let updatedlikes = post.likes;

                // remove the like, if it exists
                if (post.likes.includes(decoded_token.username)) {
                    let index = updatedlikes.indexOf(decoded_token.username);
                    updatedlikes.splice(index, 1);
                }


                query.updateDocument(COLLECTION, { _id: MongoDB.ObjectID(req.params._id) }, {
                    dislikes: [...post.dislikes, decoded_token.username],
                    likes: updatedlikes
                }).then(result => {
                    console.log(`Disliked post ${req.params._id}`);
                    res.json(result);
                }).catch(() => res.status(400).send('Error: Unable to dislike post.'));
            }
            // Else if user has already disliked the post, cancel the dislike.
            else {
                let index = post.dislikes.indexOf(decoded_token.username);
                let updateddislikes = post.dislikes;
                updateddislikes.splice(index, 1);

                query.updateDocument(COLLECTION, { _id: MongoDB.ObjectID(req.params._id) }, {
                    dislikes: updateddislikes
                }).then(result => {
                    console.log(`Cancelled dislikes on post ${req.params._id}`);
                    res.json(result);
                }).catch(() => res.status(400).send('Error: Unable to cancel dislike on post.'));
            }

        }).catch(() => res.status(400).send('Error: Post does not exist.'));
    });
});

/* Delete post by ID */
router.delete('/delete/:_id', (req, res) => {
    authenticate.doIfLoggedIn(req, res, () => {

        var decoded_token = jwt.verify(req.headers['authorization'], process.env.SECRET_KEY);

        query.getDocument(COLLECTION, { _id: MongoDB.ObjectID(req.params._id) }).then(post => {
            if (decoded_token.username === post.username) {
                query.deleteDocument(COLLECTION, { _id: MongoDB.ObjectID(req.params._id) }).then(result => {
                    console.log(`Delete post for user: ${post.username}`);
                    res.json(result);
                }).catch(() => res.status(400).send('Error: Unable to delete post.'));
            } else {
                res.status(400).send('Error: You can only delete your own posts.');
            }
        }).catch(() => res.status(400).send('Error: Post does not exist.'));
    });
});

/* Get replies */
router.get('/replies/:_id', (req, res) => {
    authenticate.doIfLoggedIn(req, res, () => {
        query.getDocument(COLLECTION, { _id: MongoDB.ObjectID(req.params._id) }).then(post => {
            res.json(post.replies);
        }).catch(() => res.status(400).send('Error: Post does not exist.'));
    });
});

/* Create reply */
router.post('/create/:_id', (req, res) => {
    authenticate.doIfLoggedIn(req, res, () => {

        var decoded_token = jwt.verify(req.headers['authorization'], process.env.SECRET_KEY);
        let date = new Date();
        let currentDate = date.getFullYear().toString() + '-' + (date.getMonth() + 1) + '-' + date.getDate().toString();

        query.getDocument(COLLECTION, { _id: MongoDB.ObjectID(req.params._id) }).then(post => {
            query.updateDocument(COLLECTION, { _id: MongoDB.ObjectID(req.params._id) }, {
                replies: [...post.replies, {username: decoded_token.username, content: req.body.content, date_posted: currentDate}]
            }).then(result => {
                console.log(`Updated post for user: ${post.username}`);
                res.json(result);
            }).catch(() => res.status(400).send('Error: Unable to update post.'));
        }).catch(() => res.status(400).send('Error: Post does not exist.'));
    });
});

module.exports = router;
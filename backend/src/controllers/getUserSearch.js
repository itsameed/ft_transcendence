const UserSchema = require('../models/Schemas/User');



async function getUserSearch(req, res, next) {
    // const slice = req.body.slice; this is what's expected from the front-end to send each time the user types a char in the search bar
    // this line below only for testing purposes only . has nothing to do mm with the real time search outputs
    const slice = "w";
    const searchResults = await UserSchema.find({
        username: {$regex: slice, $options: 'i'}
    }).sort({ title: 1 }).limit(10).select("username -_id");
    res.json(searchResults);
    next();
}

module.exports = getUserSearch;
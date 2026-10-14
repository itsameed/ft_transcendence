const express = require('express');
const MyProfile = express.Router();
const Auth = require('../../controllers/middleware');
const getUserInfos = require('../../utils/getUserInfos');

MyProfile.get('/', Auth, async (req, res) => {
    res.send(await getUserInfos(req.session.userId));
});

module.exports = MyProfile;
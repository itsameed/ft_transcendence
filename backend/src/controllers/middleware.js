const express = require(`express`);

function Auth(req, res, next) {
    // const date = new Date();
    // const currentTime = date.toLocaleDateString();
    // process.stdout.write("user attempted getting at : ")
    // console.log(currentTime);
    // // console.log("ggg");
    // console.log(req.session.userId);
    if (!req.session?.userId)
        return res.redirect(`/signup`);
    return next()
}


module.exports = Auth;
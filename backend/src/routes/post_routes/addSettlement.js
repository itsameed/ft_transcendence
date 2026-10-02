const Mongoose = require(`mongoose`);
const express = require(`express`);
const Auth = require(`../../controllers/middleware`);
const SettlementRouter = express.Router();
const SettlementSchema = require(`../../Schemas/Settlement`);

SettlementRouter.post(`/`, Auth, async (req, res) => {
    const {groupId, toUserId, amount} = req.body;
    if (!groupId || !toUserId || !amount)
        return res.status(400).send("Settlement data is invalid !");
    if (toUserId === req.session.userId)
        return res,status(400).send("you Cannot settle with yourself.");
    const newSettlement = new SettlementSchema({
        group: req.body.groupId,
        fromUser: req.session.userId,
        toUser: req.body.toUserId,
        amount: req.body.amount,
    });
    try {
        await newSettlement.save();
        return res.redirect('Dashboard');   
    } catch (error) {
        console.error("Error while saving the settlement");
        return res.status(500).send("Internal Error while attempting to save the settlement.");
    }
});

module.exports = Settlement;
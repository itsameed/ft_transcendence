const Settlement = require('../models/Schemas/Settlement.js');


async function getSettlements(req, res, next) {
    try {
        const settlements = await Settlement.find({
            $or: [
                { fromUser: req.session.userId },
                { toUser: req.session.userId },
            ],
        }).sort({ date: -1 });
        return res.status(200).json({ settlements });
    } catch (error) {
        console.error('Error while retrieving settlements:', error);
        return res.status(500).send('Unable to retrieve settlements.');
    }
}



module.exports = getSettlements;
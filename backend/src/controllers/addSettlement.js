async function addSettlement(req, res, next) {
    const { groupId, toUserId, amount } = req.body;
    const settlementAmount = Number(amount);
    if (!groupId || !toUserId || !Number.isFinite(settlementAmount) || settlementAmount <= 0) {
        return res.status(400).send('Settlement data is invalid.');
    }
    if (String(toUserId) === String(req.session.userId)) {
        return res.status(400).send('You cannot settle with yourself.');
    }

    try {
        await Settlement.create({
            group: groupId,
            fromUser: req.session.userId,
            toUser: toUserId,
            status: 'pending',
            amount: settlementAmount,
        });
        printLogsDate(`User with Id ${req.session.userId} created a settlement at : `);
        return res.redirect('/dashboard');
    } catch (error) {
        console.error('Error while saving the settlement:', error);
        return res.status(500).send('Unable to save the settlement.');
    }
}

module.exports = addSettlement;
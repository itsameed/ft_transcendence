/**
 * Balance math shared by the dashboard and group pages.
 *
 * Convention: a positive net means the group owes that person money;
 * a negative net means they owe the group. Settlements are payments, so
 * they move the payer's net up and the receiver's net down — the expense
 * that created the debt is never deleted.
 */

const EPSILON = 0.005;

function round2(value) {
    return Math.round(value * 100) / 100;
}

/** What `userId` owes for a single expense (their share). */
function shareOf(expense, userId) {
    const target = String(userId);
    if (expense.splitMethod === 'custom' && Array.isArray(expense.customSplit)) {
        const entry = expense.customSplit.find((s) => String(s.user) === target);
        return entry ? Number(entry.amount) : 0;
    }
    const participants = (expense.participants ?? []).map(String);
    if (participants.length === 0) return 0;
    return Number(expense.amount) / participants.length;
}

/**
 * Net balance per member for one group.
 * @returns {Record<string, number>} userId -> net (positive = owed to them)
 */
function computeGroupBalances(expenses, settlements, memberIds) {
    const net = {};
    for (const id of memberIds) net[String(id)] = 0;

    for (const expense of expenses) {
        const payer = String(expense.payer);
        const participants = (expense.participants ?? []).map(String);

        if (expense.splitMethod === 'custom' && Array.isArray(expense.customSplit) && expense.customSplit.length) {
            for (const split of expense.customSplit) {
                const userId = String(split.user);
                const amount = Number(split.amount);
                if (net[payer] !== undefined) net[payer] += amount;
                if (net[userId] !== undefined) net[userId] -= amount;
            }
            continue;
        }

        if (participants.length === 0) continue;
        const each = Number(expense.amount) / participants.length;
        for (const userId of participants) {
            if (net[payer] !== undefined) net[payer] += each;
            if (net[userId] !== undefined) net[userId] -= each;
        }
    }

    for (const settlement of settlements) {
        const from = String(settlement.fromUser);
        const to = String(settlement.toUser);
        const amount = Number(settlement.amount);
        if (net[from] !== undefined) net[from] += amount;
        if (net[to] !== undefined) net[to] -= amount;
    }

    for (const id of Object.keys(net)) net[id] = round2(net[id]);
    return net;
}

/**
 * Pairwise debts between `userId` and everyone else, after settlements.
 * @returns {{ youOwe: Array<{userId: string, amount: number}>, oweYou: Array<{userId: string, amount: number}> }}
 */
function computePairwiseDebts(expenses, settlements, userId) {
    const me = String(userId);
    const youOwe = new Map();
    const oweYou = new Map();

    for (const expense of expenses) {
        const payer = String(expense.payer);
        if (payer === me) {
            for (const participant of (expense.participants ?? []).map(String)) {
                if (participant === me) continue;
                const share = shareOf(expense, participant);
                if (share <= 0) continue;
                oweYou.set(participant, (oweYou.get(participant) ?? 0) + share);
            }
        } else {
            const share = shareOf(expense, me);
            if (share <= 0) continue;
            youOwe.set(payer, (youOwe.get(payer) ?? 0) + share);
        }
    }

    for (const settlement of settlements) {
        const from = String(settlement.fromUser);
        const to = String(settlement.toUser);
        const amount = Number(settlement.amount);
        if (from === me) {
            youOwe.set(to, (youOwe.get(to) ?? 0) - amount);
        } else if (to === me) {
            oweYou.set(from, (oweYou.get(from) ?? 0) - amount);
        }
    }

    const toList = (map) => [...map.entries()]
        .map(([id, amount]) => ({ userId: id, amount: round2(amount) }))
        .filter((entry) => entry.amount > EPSILON);

    return { youOwe: toList(youOwe), oweYou: toList(oweYou) };
}

module.exports = { computeGroupBalances, computePairwiseDebts, shareOf, round2, EPSILON };

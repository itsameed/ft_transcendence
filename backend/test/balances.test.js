const test = require('node:test');
const assert = require('node:assert/strict');
const { computeGroupBalances, computePairwiseDebts } = require('../src/services/balances');

test('net opposite-direction debts instead of showing one person in both lists', () => {
    const me = 'me';
    const anas = 'anas';
    const omar = 'omar';

    const expenses = [
        { payer: me, splitMethod: 'equal', participants: [me, anas], amount: 140 },
        { payer: anas, splitMethod: 'equal', participants: [me, anas], amount: 170 },
        { payer: omar, splitMethod: 'equal', participants: [me, omar], amount: 501 },
        { payer: me, splitMethod: 'equal', participants: [me, omar], amount: 140 },
    ];

    const { youOwe, oweYou } = computePairwiseDebts(expenses, [], me);

    assert.deepEqual(youOwe, [
        { userId: anas, amount: 15 },
        { userId: omar, amount: 180.5 },
    ]);
    assert.deepEqual(oweYou, []);
});

test('use customSplit when the current user paid', () => {
    const me = 'me';
    const anas = 'anas';
    const expenses = [{
        payer: me,
        splitMethod: 'custom',
        participants: [],
        customSplit: [
            { user: me, amount: 40 },
            { user: anas, amount: 60 },
        ],
        amount: 100,
    }];

    const { youOwe, oweYou } = computePairwiseDebts(expenses, [], me);

    assert.deepEqual(youOwe, []);
    assert.deepEqual(oweYou, [{ userId: anas, amount: 60 }]);
});

test('three-way equal split settles exactly after two 33.33 payments', () => {
    const me = 'me';
    const anas = 'anas';
    const omar = 'omar';
    const expense = {
        payer: me,
        splitMethod: 'equal',
        participants: [me, anas, omar],
        amount: 100,
    };
    const settlements = [
        { fromUser: anas, toUser: me, amount: 33.33 },
        { fromUser: omar, toUser: me, amount: 33.33 },
    ];

    const net = computeGroupBalances([expense], settlements, [me, anas, omar]);
    const pairwise = computePairwiseDebts([expense], settlements, me);

    assert.equal(net[me], 0);
    assert.equal(net[anas], 0);
    assert.equal(net[omar], 0);
    assert.deepEqual(pairwise.youOwe, []);
    assert.deepEqual(pairwise.oweYou, []);
});

test('equal split allocates the remainder cent to the first participant', () => {
    const { equalShares } = require('../src/services/balances');
    const expense = {
        splitMethod: 'equal',
        participants: ['me', 'anas', 'omar'],
        amount: 100,
    };

    assert.deepEqual(equalShares(expense), [
        { userId: 'me', amount: 33.34 },
        { userId: 'anas', amount: 33.33 },
        { userId: 'omar', amount: 33.33 },
    ]);
});

const test = require('node:test');
const assert = require('node:assert/strict');
const { computePairwiseDebts } = require('../src/services/balances');

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

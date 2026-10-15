# Tally — frontend v2

Dashboard for splitting shared expenses (trips, flatmates, recurring events).
Design only: every number comes from `src/data/mock.ts`.

```bash
npm install
npm run dev      # http://localhost:5174
```

## Where things live

| Path | What |
|---|---|
| `src/types.ts` | The data shapes the UI expects (User, Group, Expense, Settlement, FriendBalance…) |
| `src/data/mock.ts` | Fake data. **Replace these exports with API calls** when you wire the backend |
| `src/lib/balances.ts` | Pure balance math: totals, "you lent / you borrowed", even split with exact cents |
| `src/lib/format.ts` | Money/date formatting. Change `CURRENCY` here |
| `src/styles/global.css` | Design tokens (colors, radius, shadows) for light + dark |
| `src/pages/Dashboard.tsx` | Assembles the page and holds local state (new expenses, toasts, dialog) |
| `src/components/dashboard/*` | Balance hero, friend balances chart, groups, activity feed, spending, add-expense dialog |

## Hooks for the backend

- `AddExpenseModal` → `onSave(expense, group)`: POST the expense here instead of only updating local state.
- `FriendBalances` → `onRemind` / `onPay`: currently just show a toast.
- `Settle up` in the top bar scrolls to the balances card.

Shortcut: press `n` anywhere to add an expense.

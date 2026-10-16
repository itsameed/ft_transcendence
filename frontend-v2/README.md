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
| `src/styles/global.css` | Design tokens for light + dark. Mostly neutral; `--owed` / `--owe` are the only hues |
| `src/pages/Dashboard.tsx` | Assembles the page and holds local state (new expenses, toasts, dialog) |
| `src/components/dashboard/*` | Balance overview, group tiles, recent activity, add-expense dialog |
| `src/components/ui/*` | Small building blocks: Button, Card, Section, Avatar, Toast |

## Hooks for the backend

- `AddExpenseModal` → `onSave(expense, group)`: POST the expense here instead of only updating local state.
- `BalanceOverview` → `onSettle` / `onRemind`: currently just show a toast.
- The dashboard shows the 5 most recent activity items (`ACTIVITY_PREVIEW` in `Dashboard.tsx`).

Shortcut: press `n` anywhere to add an expense.

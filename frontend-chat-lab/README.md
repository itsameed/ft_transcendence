# Splitify Chat — Design Lab 🧪

A **standalone design prototype** of a completely redesigned Splitify Chat page.
It is fully isolated: it does not import from, modify, or connect to the production
`frontend/` app or any backend. All data is local mock data.

## Run

```bash
cd frontend-chat-lab
npm install
npm run dev   # http://localhost:5188
```

## What's inside

- **App rail** — Splitify navigation with badges, theme toggle, profile + presence.
- **Conversation list** — search (⌘K affordance), All/Unread/Groups/Settled filters,
  pinned section, unread badges, typing indicator, mute state, per-group balance pills.
- **Thread** — group/AI mode switch, live balance strip with Settle/Remind actions,
  pinned-message bar, day dividers, grouped messages, receipts (sent/delivered/read),
  replies, reactions, hover actions (react/reply/pin), expense & settlement cards
  rendered inside the conversation, typing indicator, auto-scroll.
- **Ask AI mode** — suggested prompts, simulated streaming answers about the group's
  expenses/balances, AI disclaimer.
- **Composer** — multi-line (Enter to send, Shift+Enter for newline), emoji picker,
  reply preview, attach / add-expense / voice affordances, `/expense` hint.
- **Details panel** — group balance hero, who-owes-whom with Remind/Settle, members
  with presence + roles, recent expenses, shared media, call/mute/search actions,
  archive/clear/leave. Toggle from the header; becomes an overlay sheet on smaller screens.
- **Theming & responsive** — light/dark (respects OS on first load), desktop 3–4 pane,
  tablet overlay details, phone single-pane with back navigation and a bottom nav + FAB.
- Mock replies: send a message and "Salma" replies; read receipts flip after ~1.4s.

## Density system

The layout is driven by tokens in `styles.css` (`--rail-w`, `--list-w`,
`--details-w`, `--pad-pane`, `--row-pad`, `--bubble-pad`, `--fs-body`…), so
compactness is tuned in one place. Full-bleed desktop shell (no floating-card
margins); breakpoints rebalance rather than shrink: details becomes a
slide-over drawer under 1280px, the list collapses to an icon strip under
820px, and the thread uses container queries (`@container thread`) to tighten
its own chrome when it gets narrow. Measured at 1440px: thread 670→833px,
conversation rows ~93→78px, details 340→~266px.

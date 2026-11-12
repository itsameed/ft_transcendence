# Splitify Chat — Heritage Variant 🏛️

Every feature of the **Design Lab** chat (`frontend-chat-lab/`), re-dressed in
the **current platform design language** from `frontend/` (warm paper palette,
near-black primary, stone monogram avatars, panel-gradient sidebar, 10/14/20px
radii, `shadow-card`/`shadow-pop`, quiet hovers) — so you can see exactly how
the full feature set would look inside today's app.

Standalone prototype: mock data only, no backend, production untouched.

## Run

```bash
cd frontend-chat-heritage
npm install
npm run dev   # http://localhost:5189  (dark: /?theme=dark)
```

## Feature parity with the Design Lab

- Conversation list with search, All/Unread/Groups/Settled filters, pinned
  section, unread badges, muted + typing states, expense-count pills.
- Thread with Group ⇄ Ask AI switch (suggested prompts, simulated streaming),
  balance strip (Settle/Remind), pinned bar, day dividers, grouped messages,
  read receipts, replies, reactions, hover actions (react/reply/pin).
- Expense & settlement cards inside the conversation with Settle/Details.
- Composer: multiline, emoji popover, reply preview, attach/expense/voice.
- Details panel: balances with Remind/Settle, members + presence, recent
  expenses, shared media, mute/call/search, archive/clear/leave; slide-over
  drawer under 1280px, icon strip under 820px, single-pane phone layout.

## What changed vs the Lab (design language only)

| Lab (new identity) | Heritage (current platform) |
|---|---|
| Teal gradient brand, glass panes | Near-black primary, `panel-gradient` sidebar, solid surfaces |
| Colorful gradient avatars | Neutral stone-gradient monograms |
| Gradient "mine" bubbles + glow | `bubble-mine` warm gradient, flat |
| Floating rounded cards (28px) | Full-bleed panes, 10/14/20px radii, `shadow-card` |
| Icon rail (60px) | Labeled sidebar w/ profile + unread pills (216px) |
| `--fs-*` compact 13.5px body | Platform 14px body, 44px-class controls |

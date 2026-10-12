

--- START ---

# AI Data Layer

Data access layer for the per-group AI assistant.

Loads MongoDB documents and converts them into Arabic text chunks
that the RAG engine can ingest and query.

---

## Overview

This module is the **bridge** between MongoDB and the AI pipeline.

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   MongoDB    │ ──► │  dataSource  │ ──► │  ragEngine   │
│  (Mongoose)  │     │   (this)     │     │  (RAG + LLM) │
└──────────────┘     └──────────────┘     └──────────────┘
```

- **Input**: `userId` (from session) + `groupId` (from URL)
- **Output**: array of Arabic text strings + metadata
- **Consumers**: `routes/ai/chat.js` → `ragEngine.ingest()`

---

## File Structure

```
src/services/ai/
├── dataSource.js          ← this module
├── ragEngine.js           ← orchestrator (chunk → embed → retrieve → ask)
├── bm25.js                ← lexical search
├── retriever.js           ← hybrid (BM25 + semantic) ranking
├── chunker.js             ← splits long text into chunks
├── textUtils.js           ← tokenization + normalization
├── embeddingsClient.js    ← Jina API client
├── llmClient.js           ← Groq API client
└── ...
```

---

## Data Model

The AI reads from four MongoDB collections (Mongoose schemas):

### `User`
```javascript
{
  _id:      ObjectId,
  username: String,
  email:    String,
  password: String   // never exposed to AI
}
```

### `Group`
```javascript
{
  _id:       ObjectId,
  owner:     ObjectId → User,
  groupName: String,
  members:   [ObjectId → User],
  createdAt: Date
}
```

### `Expense`
```javascript
{
  _id:          ObjectId,
  group:        ObjectId → Group,
  payer:        ObjectId → User,
  participants: [ObjectId → User],
  amount:       Number,
  description:  String,
  date:         Date,
  splitMethod:  "equal" | "custom"
}
```

### `Settlement`
```javascript
{
  _id:      ObjectId,
  group:    ObjectId → Group,
  fromUser: ObjectId → User,
  toUser:   ObjectId → User,
  amount:   Number,
  status:   "pending" | "accepted" | "rejected",
  date:     Date
}
```

---

## Public API

### `loadGroupDocuments(userId, groupId)`

Loads everything related to **one specific group**.

**Parameters**

| Name      | Type     | Description                    |
|-----------|----------|--------------------------------|
| `userId`  | ObjectId | The user making the request    |
| `groupId` | ObjectId | The group to load              |

**Returns**

```javascript
{
  groupName: String,
  docs: [String]   // Arabic text chunks
}
```

Returns `null` if the user is **not** owner or member of the group.

**What it loads**

- Group info (name, owner, members, total expenses)
- Last 200 expenses of the group (populated: payer, participants)
- All settlements of the group (populated: fromUser, toUser)

**What it produces** (examples)

```
"المجموعة الحالية اسمها "Akchour Trip" وصاحبها هو Mohamed،
 وتضم الأعضاء: Mohamed، Yassine، Omar، Hamza.
 إجمالي مصاريف هذه المجموعة: 750 درهم."

"مصروف بعنوان "Food - Tagine" بمبلغ 400 درهم
 دفعه Yassine بتاريخ 2024-05-01
 وتم تقسيمه بين: Mohamed، Yassine، Omar، Hamza."

"Omar دفع لـ Mohamed بمبلغ 150 درهم."
```

---

### `loadUserContext(userId, groupId)`

Loads **who is asking** and **what is their role**.

**Parameters**

| Name      | Type     | Description        |
|-----------|----------|--------------------|
| `userId`  | ObjectId | Current user       |
| `groupId` | ObjectId | Current group      |

**Returns**

```javascript
{
  username:     String,
  email:        String,
  role:         "owner" | "member",
  currentGroup: {
    _id:       ObjectId,
    groupName: String,
    owner:     User,    // populated
    members:   [User]   // populated
  }
}
```

Returns `null` if the user does not exist.

**Why it's needed**

- Allows the AI to answer: *"Who am I?"*, *"What's my name?"*, *"Am I the owner?"*
- Adds personal context to the prompt before the LLM call.

---

## How the AI Uses This Data

The flow inside `routes/ai/chat.js`:

```
1. Extract userId from req.session, groupId from req.params
       │
       ▼
2. Call dataSource.loadUserContext(userId, groupId)
       │
       ▼
3. Call dataSource.loadGroupDocuments(userId, groupId)
       │
       ▼
4. Build userDocs: [ "You are X", "You are in group Y" ]
       │
       ▼
5. Merge: allDocs = userDocs + groupDocs
       │
       ▼
6. ragEngine.ingest(allDocs)
       │
       ├─► chunker.split()         → chunks[]
       ├─► bm25.fit(chunks)        → lexical index
       └─► embeddingsClient.embedBatch(chunks) → vectors[]
       │
       ▼
7. ragEngine.ask(question, onToken)
       │
       ├─► retriever.retrieve()    → top-K most relevant chunks
       ├─► promptBuilder.build()   → final prompt with context
       └─► llmClient.generateStream() → tokens via SSE
       │
       ▼
8. Send SSE events to browser
       event: token   → { text: "..." }
       event: sources → { sources: [...] }
       event: done    → {}
```

---

## How the Frontend Uses It

The AI is scoped to a **single group**. There is no global chatbot.

### Entry point

User clicks **"اسأل AI"** on a group card in `/MyGroups`.

### URL

```
GET /chat/group/:groupId
```

Rendered by `main.js` → `views/groupChat.ejs`.

### API endpoint

```
POST /api/chat/group/:groupId/stream
Content-Type: application/json

{
  "question": "شحال مصاريف هاد المجموعة؟"
}
```

### Response (SSE stream)

```
event: token
data: {"text":"مجموع "}

event: token
data: {"text":"مصاريف "}

event: token
data: {"text":"هذه المجموعة "}

event: token
data: {"text":"هو 750 درهم."}

event: sources
data: {"sources":[...]}

event: done
data: {}
```

### Frontend code (minimal example)

```javascript
const response = await fetch('/api/chat/group/' + GROUP_ID + '/stream', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'same-origin',
  body: JSON.stringify({ question: userQuestion })
});

const reader  = response.body.getReader();
const decoder = new TextDecoder();
let buffer = '';

while (true) {
  const { done, value } = await reader.read();
  if (done) break;

  buffer += decoder.decode(value, { stream: true });
  const events = buffer.split('\n\n');
  buffer = events.pop();

  for (const event of events) {
    // parse: event: <name>\n data: <json>
    // handle token / sources / done / error
  }
}
```

---

## Security

| Rule | Implementation |
|------|----------------|
| Must be logged in | `Auth` middleware on every route |
| Must belong to group | `Group.findOne({ _id, $or: [{ owner }, { members }] })` |
| No cross-group leakage | Every query is filtered by `groupId` |
| Password never sent to AI | Only `username` and `email` are selected |

---

## Notes

- **Language**: All generated text is in Arabic (Moroccan-friendly).
- **Currency**: All amounts are in Moroccan Dirham (`درهم`).
- **Module system**: CommonJS (`require` / `module.exports`).
- **Schema path**: `src/modles/Schemas/` (team convention).
- **Populate**: Uses Mongoose `.populate()` to fetch referenced users.
- **Limits**: Expenses capped at 200, sorted by `date` descending.

---

## Related Files

| File | Role |
|------|------|
| `routes/ai/chat.js` | HTTP controller + SSE |
| `services/ai/ragEngine.js` | Orchestrates the RAG pipeline |
| `services/ai/dataSource.js` | **This module** |
| `views/groupChat.ejs` | Frontend chat UI |
| `Schemas/*.js` | Mongoose models |


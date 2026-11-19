# AI Chat API — Frontend Integration Guide

## 1. Overview

The AI Chat API allows users to ask questions about their group's financial data.

The backend retrieves information from MongoDB, processes it using the RAG system, and generates an AI response.

**Main features:**

- Ask questions about group expenses.
- Receive answers in real time (Streaming).
- Receive the sources used to generate the answer.
- Access only authorized group data.

---

## 2. API Endpoint

**Method:** `POST`

**URL:**

```text
/api/chat/group/:groupId/stream
```

Example:

```text
/api/chat/group/671000000000000000000001/stream
```

**Headers:**

```text
Content-Type: application/json
```

**Request Body:**

```json
{
  "question": "شحال صرفنا فهاد المجموعة؟"
}
```

**Authentication:**

The backend uses session authentication through cookies.

Use:

```js
credentials: 'same-origin'
```

The user must be logged in.

---

## 3. How the API Works

1. The frontend sends a question and group ID.
2. The backend verifies the user's session.
3. The backend checks access to the group.
4. The backend retrieves group and expense information from MongoDB.
5. The RAG system processes the information.
6. The LLM generates an answer.
7. The backend sends the answer progressively using SSE.

---

## 4. Streaming Response (SSE)

The backend sends different events during the response.

| Event     | Data                        | Description         |
| --------- | --------------------------- | ------------------- |
| `token`   | `{ "text": "350" }`         | A new text fragment |
| `sources` | `{ "sources": [...] }`      | Sources used by RAG |
| `done`    | `{}`                        | Response completed  |
| `error`   | `{ "message": "حدث خطأ." }` | Server-side error   |

### Example response

```text
event: token
data: {"text":"المجموع"}

event: token
data: {"text":" هو"}

event: token
data: {"text":" 350 درهم"}

event: sources
data: {"sources":[...]}

event: done
data: {}
```

**Important:**

- Tokens are text fragments, not necessarily individual words.
- Append each received token to the current AI message.
- Do not replace the previous text with the new token.
- The `done` event indicates that the response has finished.

---

## 5. Frontend Requirements

The frontend should:

1. Get `groupId` from the current group URL.
2. Send a POST request using `fetch()`.
3. Include `credentials: 'same-origin'`.
4. Send the question as JSON.
5. Check `response.ok` before reading the stream.
6. Read the response using `response.body.getReader()`.
7. Decode incoming data using `TextDecoder`.
8. Parse SSE events (`event:` and `data:`).
9. Append received `token` text to the AI message.
10. Handle `sources`, `done`, and `error` events.

**Important:** Use `fetch()` with `response.body.getReader()`, not the native `EventSource` API, because this endpoint uses POST with a JSON body.

---

## 6. Error Handling

| HTTP Status | Meaning                       | Frontend Action                  |
| ----------- | ----------------------------- | -------------------------------- |
| `200`       | Request accepted              | Start reading SSE                |
| `400`       | Invalid or missing question   | Show validation message          |
| `401`       | Authentication required       | Redirect to login                |
| `302`       | Possible login redirect       | Check session and authentication |
| `429`       | Too many requests             | Ask user to wait                 |
| `500`       | Server error before streaming | Show generic error               |

**Important implementation detail:**

Once the backend calls `flushHeaders()`, the HTTP response has already started, normally with status 200.

Errors occurring after that point are sent through the SSE `error` event, not as a new HTTP 500 response.

The current backend also sends some access-related errors as `token` followed by `done`, so they may arrive inside an HTTP 200 response.

---

## 7. Available Questions

The AI can answer questions based on the available group and user context.

Examples:

| Question                  | Expected Information           |
| ------------------------- | ------------------------------ |
| شحال صرفنا فهاد المجموعة؟ | Total group expenses           |
| من أنا؟                   | Current user's information     |
| شكون صاحب المجموعة؟       | Group owner                    |
| شكون دفع أكثر؟            | Expense payer comparison       |
| ما هي آخر المصاريف؟       | Recent expenses                |
| شكون شارك فالمصاريف؟      | Expense participants           |
| شحال دفع أحمد؟            | Expenses associated with Ahmed |

The accuracy of answers depends on the information retrieved and the RAG implementation.

**Scope:** The endpoint is designed to answer questions using the current authorized group context. It does not automatically provide access to other groups.

---

## 8. Sources

After generating the answer, the backend sends:

```json
{
  "sources": [
    {
      "text": "مصروف بعنوان Dinner بمبلغ 300 درهم...",
      "score": 0.85
    }
  ]
}
```

The frontend can:

- Ignore sources initially.
- Display them below the AI response.
- Provide a collapsible section called "Sources".

The exact source structure depends on the RAG implementation.

---

## 9. Testing Checklist

Before integrating the chat, verify:

- [ ] The user can log in successfully.
- [ ] The user has access to the requested group.
- [ ] The frontend gets the correct `groupId`.
- [ ] The request uses POST.
- [ ] The request includes `Content-Type: application/json`.
- [ ] The request includes `credentials: 'same-origin'`.
- [ ] The question is sent in JSON format.
- [ ] The frontend reads the stream progressively.
- [ ] Tokens are appended to the same AI message.
- [ ] The frontend handles `done` and `error`.
- [ ] The frontend handles HTTP errors before reading SSE.

---

## 10. Important Notes

- Do not send an Authorization header unless the backend authentication design changes.
- Do not use EventSource for this POST endpoint.
- Do not forget session cookies.
- Do not expect one token event per word.
- Do not assume all errors will arrive as HTTP 500.
- Do not expose API keys or internal backend configuration in the frontend.

**Backend file:** `src/routes/ai/chat.js`

**Data source:** `src/services/ai/dataSource.js`

**RAG engine:** `src/services/ai/ragEngine.js`

**Frontend responsibility:** Send questions, display streamed answers, and handle events.

**Backend responsibility:** Authentication, authorization, data retrieval, RAG processing, and LLM generation.

---

**The AI Chat API is ready for frontend integration, subject to verifying the actual mounted route prefix and response behavior in the running application.**

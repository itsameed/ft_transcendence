# Backend Endpoints

This reference describes the routes mounted by `src/main.js` and the request data their current handlers read. Paths are relative to the backend origin (for example, `http://localhost:<PORT>`).

## Request conventions

- The server parses JSON (`Content-Type: application/json`) and URL-encoded form data (`application/x-www-form-urlencoded`). The legacy HTML forms use URL-encoded bodies.
- The app uses an Express session stored in MongoDB. Browser requests must retain the session cookie. Login establishes the session; logout clears it.
- The JSON API routers use `apiAuth`, which requires `req.session.userId`. The legacy page/form routes use `requireAuth` where indicated. Do not send the authenticated user's ID in the body; handlers derive it from the session.
- JSON API errors generally use `{ "message": "..." }`. Legacy form endpoints generally respond with a redirect or plain text.
- `<id>` values below are MongoDB ObjectIds unless otherwise stated.

## Authentication

| Method and path | Auth | Frontend data | Result |
| --- | --- | --- | --- |
| `GET /auth/login` | No | None | Renders `signup.ejs` (the combined login/signup page). |
| `POST /auth/login` | No | Form or JSON: `email` (string), `password` (string). `remember` is accepted by the form but ignored. | Creates a session and redirects to `/dashboard`; missing fields return 400, invalid credentials 401, suspended account 403. |
| `GET /auth/signup` | No | None | Renders `signup.ejs`. |
| `POST /auth/signup` | No authentication middleware | URL-encoded form fields: required `fullName`, `email`, `password`; optional `displayName`, `bio`, `phoneNumber`, and `gender`. `confirmPassword` and `terms` are submitted by the current form but ignored by the handler. | Stores `fullName` as `username`; generates `displayName` when omitted. Redirects to `/dashboard` on success, but does not establish a session. Duplicate email returns 400; duplicate-key errors return 409. |
| `GET /auth/logout` | `requireAuth` | None | Destroys the session; see `destroySession` behavior. |
| `GET /auth/google/auth/google` | No application session required | Starts Google OAuth; Passport requests the user's profile and email. | Redirects to Google for authentication. |
| `GET /auth/google/auth/google/callback` | Google OAuth callback | Google OAuth response handled by Passport. | On success, stores the authenticated user's ID in the session and redirects to `/`; on failure, redirects to `/login`. |

## Groups API

The same API router is mounted at both `/api/groups` and `/my-groups`. Each endpoint below is available under both prefixes. All require an authenticated session.

| Method and path | Frontend data | Result |
| --- | --- | --- |
| `POST <prefix>` | JSON `{ "name": "Trip group" }` | Creates a group and its conversation. Returns 201 with `{ message, group, conversation }`. |
| `POST <prefix>/:groupId/members` | Path `groupId`; JSON `{ "userId": "<userId>" }` | Adds a member. Owner only. Returns `{ message, group }`. |
| `DELETE <prefix>/:groupId/members/:userId` | Path `groupId`, `userId`; no body | Removes a non-owner member. Owner only. |
| `GET <prefix>/me` | No body or query | Returns `{ count, groups }` for the current user. |
| `GET <prefix>/:groupId` | Path `groupId`; no body | Returns `{ group }` if the current user is a member. |
| `DELETE <prefix>/:groupId/leave` | Path `groupId`; no body | Current user leaves (owners cannot leave). |
| `PATCH <prefix>/:groupId` | Path `groupId`; JSON `{ "name": "Updated name" }` | Renames a group. Owner only. |
| `DELETE <prefix>/:groupId` | Path `groupId`; no body | Deletes the group and its conversation data. Owner only. |

For `<prefix>`, use `/api/groups` or `/my-groups` (for example, `GET /api/groups/me`). The `/my-groups` mount does not define a page-rendering `GET /my-groups/` handler; it mounts these API routes only.

## Friends API

All routes require an authenticated session.

| Method and path | Frontend data | Result |
| --- | --- | --- |
| `POST /api/friends/request` | JSON `{ "receiverId": "<userId>" }` | Sends a friend request. Returns 201 with `{ message, friendship }`; may emit `newNotification` to the recipient. |
| `PATCH /api/friends/request/:friendshipId/accept` | Path `friendshipId`; no body | Accepts a pending request addressed to the current user. |
| `PATCH /api/friends/request/:friendshipId/reject` | Path `friendshipId`; no body | Rejects a pending request addressed to the current user. |
| `GET /api/friends` | No body or query | Returns `{ friends }`. |
| `GET /api/friends/requests` | No body or query | Returns `{ requests }` for incoming pending requests. |
| `DELETE /api/friends` | JSON `{ "friendId": "<userId>" }` | Removes the accepted friendship with that user. |

## Group invitations API

All routes require an authenticated session.

| Method and path | Frontend data | Result |
| --- | --- | --- |
| `POST /api/group-invitations/:groupId` | Path `groupId`; JSON `{ "userId": "<userId>" }` | Owner invites a user. Returns 201 with `{ message, invitation }`; may emit `newNotification`. |
| `PATCH /api/group-invitations/:invitationId/accept` | Path `invitationId`; no body | Accepts the current user's pending invitation and adds them to the group conversation. |
| `PATCH /api/group-invitations/:invitationId/reject` | Path `invitationId`; no body | Rejects the current user's pending invitation. |

## Notifications API

All routes require an authenticated session.

| Method and path | Frontend data | Result |
| --- | --- | --- |
| `GET /api/notifications` | No body or query | Returns the current user's notifications, newest first. |
| `PATCH /api/notifications/:notificationId/read` | Path `notificationId`; no body | Marks that user's notification as read and returns it. |
| `DELETE /api/notifications/user/all` | No body | Deletes all current-user notifications; returns `{ message, deletedCount }`. |
| `DELETE /api/notifications/:id` | Path `id`; no body | Deletes one current-user notification. |

## Conversations and messages API

All routes require an authenticated session.

| Method and path | Frontend data | Result |
| --- | --- | --- |
| `POST /api/conversations` | JSON `{ "userId": "<otherUserId>" }` | Creates a conversation between the current user and `userId`; returns the conversation. |
| `GET /api/conversations` | No body or query | Returns the current user's conversations, newest updated first. |
| `POST /api/conversations/:conversationId/messages` | Path `conversationId`; JSON `{ "content": "Message text" }` | Creates a message (participant only), returns it with sender info, and emits `newMessage` to the conversation and `newNotification` to recipients. |
| `GET /api/conversations/:conversationId/messages` | Path `conversationId`; no body or query | Returns messages in chronological order (participant only). |

## Admin API

All routes require an authenticated, active session and the `admin` role. User and group IDs are MongoDB ObjectIds. User responses exclude the password field.

| Method and path | Frontend data | Result |
| --- | --- | --- |
| `GET /api/admin/users` | No body or query | Returns `{ count, users }`, newest users first. |
| `GET /api/admin/users/:id` | Path `id`; no body | Returns `{ user }`; invalid IDs return 400 and missing users return 404. |
| `PATCH /api/admin/users/:id/suspend` | Path `id`; no body | Suspends a regular user's account. Admin accounts and the current admin cannot be suspended. Returns `{ message, user }`. |
| `PATCH /api/admin/users/:id/reactivate` | Path `id`; no body | Reactivates a regular user's account. Returns `{ message, user }`. |
| `GET /api/admin/groups` | No body or query | Returns `{ count, groups }`, newest groups first, with creator and member summaries. |
| `GET /api/admin/groups/:id` | Path `id`; no body | Returns `{ group }` with creator, members, and conversation populated; invalid IDs return 400 and missing groups return 404. |
| `GET /api/admin/statistics` | No body or query | Returns totals for users (including active, suspended, and admin counts), groups, and expenses. |

Unauthenticated requests receive 401. Suspended accounts receive 403; authenticated non-admin users also receive 403.

## Legacy page and form routes

These routes render EJS pages or process browser forms. They use the session cookie; the table lists frontend fields read by the active handler.

| Method and path | Auth | Frontend data | Result |
| --- | --- | --- | --- |
| `GET /` and `GET /dashboard` | `requireAuth`, `cookieAuth` | None | Runs `calculateUserBalance` and renders `Dashboard`. |
| `GET /group-details` | `requireAuth` | No request data | Runs `getGroupExpenses` and renders `Dashboard`. The current utility uses a hard-coded group ID. |
| `GET /my-profile` | `requireAuth`, `cookieAuth` | No request data | Loads profile and statistics and renders `my-profile`. |
| `GET /profile/edit` | `requireAuth` | No request data | Intended to render the edit profile page. |
| `PATCH /profile/edit` | `requireAuth`, `cookieAuth` | Form or JSON: `username`, `email` | Updates the current user's username and email; returns the updated user as JSON. |
| `GET /groups/create` | `requireAuth` | No request data | Renders `CreateGroup.ejs`. |
| `POST /groups/create` | `requireAuth` | Form fields: required `groupName`; optional `groupDesc`. The form also submits `coverImage`, but the handler does not process it. | Creates a group for the session user and redirects to `/my-groups`. |
| `GET /expenses` and `GET /createExpense` | `requireAuth` | No request data | Renders `createExpense.ejs`. |
| `POST /expenses` and `POST /createExpense` | `requireAuth` | Form fields: `groupId`, numeric `amount`, optional `description`, `splitMethod` (`equal` or `custom`), `participants` (JSON-encoded array of user IDs), `customSplits` (JSON-encoded array of `{ "user": "<userId>", "amount": number }`). At least one participant is required. | Creates an expense with payer taken from the session, then redirects to `/dashboard`. |
| `GET /settlements` and `GET /settlements/addSettlement` | `requireAuth`, `cookieAuth` | No request data | Returns `{ settlements }` for the current user. |
| `POST /settlements` and `POST /settlements/addSettlement` | `requireAuth`, `cookieAuth` | Form or JSON: `groupId`, `toUserId`, positive numeric `amount`. The sender is taken from the session. | Intended to create a pending settlement and redirect to `/dashboard`. |
| `GET /my-groups/total-expenses` | `requireAuth` | No request data | Runs `GroupTotalExpenses` and renders `Dashboard`; current utility uses a hard-coded group ID. |

The duplicate settlement mount means `/settlements/addSettlement` is an additional alias to the same router's root GET and POST handlers; it is not a separate settlement-ID endpoint.

## Socket.IO

Socket.IO is attached to the same server. These are socket events, not HTTP endpoints.

| Event | Client data | Behavior |
| --- | --- | --- |
| `joinUser` | `userId` string | Joins room `user:<userId>` for user-targeted notifications. |
| `joinConversation` | `conversationId`, `userId` strings (two event arguments) | Joins `conversation:<conversationId>` only if the supplied user is a member of a group linked to that conversation; otherwise emits `chatError`. |
| `newMessage` | Server to conversation room | Broadcast when a message is sent. |
| `newNotification` | Server to user room | Broadcast for new friend requests, group invitations, and chat messages. |
| `chatError` | Server to requesting socket | Error object with a `message` property when joining a conversation fails. |

## Known implementation mismatches

- Signup currently does not establish a session before redirecting to `/dashboard`, so the redirected request may be sent back to login by the dashboard authentication middleware. The signup form's `confirmPassword` and `terms` fields are not validated; `phoneNumber` is accepted by the controller but is not persisted, and the current form does not provide the optional profile fields or an avatar upload.
- The legacy login and signup utilities call `printLogsDate` without importing it. This may fail after successful credential validation or user creation.
- `POST /expenses` calls `printLogsDate` without importing it. Its frontend submits `customSplits` as JSON, which is parsed by the utility; the backend does not validate that custom split amounts add up to `amount`.
- `POST /settlements` references `Settlement` and `printLogsDate` without imports in `addSettlement.js`, so it cannot currently complete successfully.
- `GET /profile/edit` references `User` without importing it in `EditProfile.js`.
- `GET /group-details` and `GET /my-groups/total-expenses` currently use a hard-coded group ID rather than a frontend-supplied group ID.
- `src/routes/updateExpense.js`, the older `FriendsList` route, and other route files not mounted by `src/main.js` are not active endpoints in this catalog.

```
FRONTEND EXPECTS                            CURRENT BACKEND
┌───────────────────────────────┐           ┌───────────────────────────────┐
│ id             (string)       │  ◄──map── │ _id            (ObjectId)     │
│ name           (string)       │  ◄─────── │ name           (string)       │
│ emoji          (string)       │  ◄──MISSING                             │
│ kind           (trip/home/...)│  ◄──MISSING                             │
│ startDate      (Date/string)  │  ◄──MISSING                             │
│ endDate        (Date/string)  │  ◄──MISSING                             │
│ memberIds      [UserId]       │  ◄──map── │ members        [{userId}]     │
│ totalSpent     (number)       │  ◄──calc─ (not stored, computed from exp) │
│ yourBalance    (number)       │  ◄──calc─ (not stored, computed per user) │
│ lastActivityAt (string)       │  ◄──map── │ updatedAt      (timestamp)    │
└───────────────────────────────┘           └───────────────────────────────┘
```
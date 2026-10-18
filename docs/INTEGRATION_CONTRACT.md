# HabitFlow Integration Contract (Owner A &rarr; Owner B)

**Document Version:** 1.0.0  
**Owner A Scope:** Project Foundation, Database, Authentication/Security, Question Management & Outcomes, Hourly Track Sheet, Basic Dashboard, Shared Calculation Utilities.  
**Owner B Scope:** Advanced Analytics (Daily/Weekly/Monthly/Heatmap), Hourly Push Reminders/Notifications, Offline PWA & Service Worker.

---

## 1. Core Principles & Critical Product Rules

1. **Separation of Raw Answer and Evaluated Outcome:**
   - **NEVER assume `YES` means Positive or `NO` means Negative.**
   - In habit tracking, avoiding unwanted behaviors (e.g. smoking, junk food) means `YES` = **Negative** and `NO` = **Positive**.
   - Every answer option on a question has its own configured outcome (`positive`, `negative`, or `neutral`).
2. **Outcome Snapshots (`outcome_snapshot`):**
   - Each `hourly_entries` row saves both the raw answer (`value`) and the evaluated outcome snapshot (`outcome_snapshot`).
   - If a question's option rules are changed in the future, historical snapshots are **never** silently rewritten.
3. **Missing Data vs. Negative:**
   - **Unanswered slots are missing data, NEVER a negative outcome.**
   - Analytics completion calculations must use explicit denominators (e.g. `answered_slots / total_slots`).
4. **Server-Side Authorization & User Isolation:**
   - Every API route and database query verifies the authenticated session via HTTP-only cookies and filters strictly by `user_id`. Never trust client-supplied user IDs.

---

## 2. Database Schema Entities

The database uses PostgreSQL dialect (supported in production on Neon/PostgreSQL via `DATABASE_URL`, or locally via embedded PGlite in `./data/habitflow_pg`):

### `users`
| Column | Type | Description |
|---|---|---|
| `id` | `TEXT PRIMARY KEY` | e.g. `usr_...` |
| `email` | `TEXT NOT NULL UNIQUE` | Lowercased user email |
| `name` | `TEXT` | Optional display name |
| `password_hash` | `TEXT NOT NULL` | Scrypt salted hash (`salt:hex`) |
| `created_at` | `TIMESTAMPTZ` | Timestamp |
| `updated_at` | `TIMESTAMPTZ` | Timestamp |

### `sessions`
| Column | Type | Description |
|---|---|---|
| `id` | `TEXT PRIMARY KEY` | Session token (stored in `habitflow_session` HTTP-only cookie) |
| `user_id` | `TEXT REFERENCES users(id)` | Foreign key on cascade |
| `expires_at` | `TIMESTAMPTZ` | Expiration (30-day default) |
| `created_at` | `TIMESTAMPTZ` | Timestamp |

### `questions`
| Column | Type | Description |
|---|---|---|
| `id` | `TEXT PRIMARY KEY` | e.g. `q_...` |
| `user_id` | `TEXT REFERENCES users(id)` | Foreign key on cascade |
| `text` | `TEXT NOT NULL` | Prompt text (e.g. "Drank Water", "Focused Work") |
| `category` | `TEXT NOT NULL` | e.g. "Health", "Focus", "Routine" |
| `answer_type` | `TEXT NOT NULL` | Phase 1 default `'yes_no'`; extensible for Phase 2 |
| `active` | `BOOLEAN NOT NULL` | `true` = active on Track Sheet, `false` = archived |
| `order` | `INTEGER NOT NULL` | Display sequence on spreadsheet |
| `description` | `TEXT` | Optional guidance note |
| `created_at` / `updated_at` | `TIMESTAMPTZ` | Timestamps |

### `question_options`
| Column | Type | Description |
|---|---|---|
| `id` | `TEXT PRIMARY KEY` | e.g. `opt_...` |
| `question_id` | `TEXT REFERENCES questions(id)` | Foreign key on cascade |
| `text` | `TEXT NOT NULL` | Option label (e.g. "Yes", "No") |
| `outcome` | `TEXT NOT NULL` | `'positive'` \| `'negative'` \| `'neutral'` |
| `explanation` | `TEXT` | Explanation for this outcome |
| `order` | `INTEGER NOT NULL` | Option display order |

### `hourly_entries`
| Column | Type | Description |
|---|---|---|
| `id` | `TEXT PRIMARY KEY` | e.g. `entry_...` |
| `user_id` | `TEXT REFERENCES users(id)` | Foreign key on cascade |
| `question_id` | `TEXT REFERENCES questions(id)` | Foreign key on cascade |
| `option_id` | `TEXT REFERENCES question_options(id)` | Configured option ID (nullable) |
| `value` | `TEXT NOT NULL` | Selected raw value ("Yes", "No", etc.) |
| `date` | `TEXT NOT NULL` | `YYYY-MM-DD` string format |
| `time_slot` | `TEXT NOT NULL` | `HH:MM` string format (e.g. `"06:00"`, `"14:00"`) |
| `outcome_snapshot` | `TEXT NOT NULL` | `'positive'` \| `'negative'` \| `'neutral'` |
| `notes` | `TEXT` | Optional hourly note |
| **Unique Constraint** | `(user_id, question_id, date, time_slot)` | One entry per slot |

### `user_settings`
| Column | Type | Description |
|---|---|---|
| `id` | `TEXT PRIMARY KEY` | e.g. `settings_...` |
| `user_id` | `TEXT UNIQUE REFERENCES users(id)` | Foreign key on cascade |
| `tracking_start_hour` | `INTEGER NOT NULL` | Default `6` (6 AM) |
| `tracking_end_hour` | `INTEGER NOT NULL` | Default `21` (9 PM) |
| `tracking_interval_minutes` | `INTEGER NOT NULL` | Default `60` |
| `timezone` | `TEXT NOT NULL` | e.g. `"UTC"` or `"America/New_York"` |
| `theme` | `TEXT NOT NULL` | Default `"dark"` |

---

## 3. Shared TypeScript Types

Import all shared types from `@/types`:

```typescript
import type {
  Outcome,             // 'positive' | 'negative' | 'neutral'
  AnswerType,          // 'yes_no' | 'single_choice' | ...
  User,
  Session,
  Question,
  QuestionOption,
  HourlyEntry,
  UserSettings,
  OutcomeCounts,
  CompletionStats,
  TimeOfDaySummary,
  DailySummary,
} from '@/types';
```

---

## 4. Shared Calculation Utilities

Import pure calculations from `@/lib/calculations`:

```typescript
import {
  generateTimeSlots,          // (startHour?, endHour?, interval?) => ['06:00', ..., '21:00']
  formatSlotLabel,            // ("06:00") => "6 AM", ("13:00") => "1 PM"
  calculateOutcomeCounts,     // (entries) => { positive, negative, neutral, totalAnswered }
  calculateCompletionStats,   // (totalSlots, answeredSlots) => { totalSlots, answeredSlots, unansweredSlots, completionRatePercent }
  getTimeOfDayCategory,       // ("08:00") => 'morning' | 'afternoon' | 'evening'
  calculateTimeOfDaySummary,  // (entries) => { morning, afternoon, evening }
  calculateDailySummary,      // (date, totalQuestions, slotsPerQuestion, entries) => DailySummary
  getTodayString,             // (date?) => "YYYY-MM-DD"
  getAdjacentDate,            // (dateStr, offsetDays) => "YYYY-MM-DD"
  isValidDateString,          // (dateStr) => boolean
  formatDisplayDate,          // ("2026-10-18") => "Sun, Oct 18, 2026"
} from '@/lib/calculations';
```

---

## 5. API Endpoints for Owner B Consumption

All endpoints require authentication (session cookie):

### Entries Query (For Analytics & Heatmaps)
- `GET /api/entries?date=YYYY-MM-DD`
  - Returns `{ entries: HourlyEntry[], date: string }`
- `GET /api/entries?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD`
  - Returns `{ entries: HourlyEntry[] }` for the multi-day range (e.g. 7 days or 30 days)

### Question Management
- `GET /api/questions?includeArchived=false`
  - Returns `{ questions: Question[] }`
- `POST /api/questions`
  - Body: `CreateQuestionInput`
- `PATCH /api/questions/:id`
  - Body: `UpdateQuestionInput`
- `DELETE /api/questions/:id`

### Settings
- `GET /api/settings`
  - Returns `{ settings: UserSettings }`
- `PATCH /api/settings`
  - Body: `Partial<UserSettings>`

---

## 6. Development & Testing Commands

```bash
# Run local development server
npm run dev

# Run TypeScript type check
npm run typecheck

# Run ESLint
npm run lint

# Run all test suites
npm test

# Build production bundle
npm run build
```

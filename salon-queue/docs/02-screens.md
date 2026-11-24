# Screens & Features

## Shared UI
Use charcoal backgrounds, gold primary actions, rounded cards, clear typography and status labels with icons (not colour alone). Provide EN/GU toggle on every screen, persisting choice locally. All text, errors, service names and alerts are translated. Minimum 44px touch targets. Show loading, connection loss, retry and mutation errors; never report success before storage confirms it. Disable pending actions to avoid double submissions. Preserve form values on failure. Staff screens require role-appropriate demo authentication; public TV exposes tokens only, not names or phone numbers.

## 1. Home — `/`
**User/purpose:** Customer checks salon availability and joins.
- Header: salon name, logo, language toggle; open/closed status and closing time (9 PM demo default).
- Live summary: count of Waiting customers and approximate wait for a new customer choosing Any.
- Barber cards: Ravi, Amit, Imran with Available, Busy, On break or Off duty labels.
- Gold Join Queue button navigates to `/join`; disabled when online joining is closed, with explanation.
- Empty state: No one waiting — walk right in! If nobody is working, show wait unavailable instead of zero.
- Mobile: one-column layout; desktop: cards in a row.

## 2. Join Queue — `/join`
**User/purpose:** Customer requests a queue spot.
- Name (required, trimmed), phone (exactly 10 digits).
- Service cards with checkbox, name, duration and price. Select 1–3 enabled services.
- Sample catalogue: Haircut / હેરકટ (30 min, ₹150); Beard trim / દાઢી ટ્રિમ (15 min, ₹80); Hair spa / હેર સ્પા (45 min, ₹400); Hair wash / હેર વોશ (15 min, ₹100); Hair styling / હેર સ્ટાઇલિંગ (20 min, ₹200).
- Barber picker: Any barber (fastest), Ravi, Amit, Imran; show busy/break labels, disable off-duty choices.
- Live summary: total duration, price and approximate wait for selection.
- Confirm validates inputs and current online availability, creates a token, opens private `/status/:id`. Duplicate phone returns existing spot through an appropriate recovery/verification mechanism, not a second entry.
- Back returns home. Empty catalogue: disable Confirm. Display errors inline, including service availability changing mid-form.
- Mobile: stacked form and sticky summary/action; desktop: form beside summary.

## 3. My Status — `/status/:id`
**User/purpose:** Customer tracks own spot using an unguessable status link.
- Large token S-14, current status, selected services, preferred/assigned barber, position and estimated wait.
- Circular wait indicator updates with shared queue changes. Position 2: Start coming to the salon; position 1: You're next!
- Called: full-screen gold alert, assigned barber, time remaining before no-show eligibility; optional vibration when supported and permitted.
- In chair: show service in progress. Done: thank-you message. Cancelled/No-show: explain status and offer Join again.
- Cancel my spot: confirmation dialog; available only while Waiting.
- Missing/invalid link: friendly error and Home action. Offline: stale-data warning and retry.
- Mobile-first single column; large token and action buttons.

## 4. Reception Dashboard — `/reception`
**User/purpose:** Receptionist manages the live queue.
- Header: queue status, waiting count, Add walk-in, language and sign-out.
- Barber cards: name, availability, current token/name, services and estimated time left. Call next enabled only for available, on-duty, unassigned barbers with eligible waiting customers.
- Waiting list sorted by join order: token, name, services, preference, elapsed wait; amber highlight after 60 minutes.
- Cancel action on Waiting rows (confirmation); called customers in separate active section with elapsed call time and No-show enabled after 10 minutes.
- Add walk-in opens quick form using same validations as Join; online closure does not block walk-ins.
- Empty state: no customers waiting; no eligible customer message per barber. Handle stale/conflicting actions by refreshing shared data.
- Tablet landscape: barber cards left/top, queue right/below; phone: stacked cards; desktop: wider two-panel layout.

## 5. Barber View — `/barber/:name`
**User/purpose:** Barber manages own assigned service.
- Header: barber name, status, language and sign-out.
- Current customer: token, name, selected services and total duration.
- Start enabled only for Called; starts elapsed timer. Done enabled only for In chair; completes service and frees barber.
- Next for you: earliest Waiting customer eligible for this barber (preview only).
- On break / Available toggle; cannot start break while assigned to a customer. Off-duty state disables work actions.
- Empty: Waiting for next customer. Invalid barber or unauthorized access: clear error.
- Phone: large stacked buttons and timer; tablet: side-by-side cards.

## 6. Waiting Area TV — `/display`
**User/purpose:** Visitors see called and current tokens from a distance.
- Header: salon logo, current time and connection status.
- Barber cards: name/photo or initials, current token, Called/In chair/Available/On break/Off duty.
- Next five Waiting tokens in join order with approximate wait and preferred barber when relevant.
- Newly Called token flashes gold briefly; play one chime per new call if sound has been enabled through user interaction. Include Enable sound control for browser autoplay restrictions.
- Empty: No customers waiting. Offline: prominently label data as stale.
- 16:9 TV landscape, high contrast, large typography readable from a distance; smaller screens stack content. Never display customer names or phone numbers.

## 7. Owner Settings — `/admin`
**User/purpose:** Owner controls salon operations.
- Daily stats: completed customers, average wait (join to Start for completed customers), no-shows.
- Services: add/edit name EN/GU, positive duration in minutes, nonnegative price, enable/disable; changes affect future joins only.
- Barber roster: on-duty toggles; do not remove a barber from duty while assigned or while customers are waiting specifically for them. Explain why toggle is blocked.
- Online queue Open/Closed switch; effective closure also follows closing-time cutoff. Show scheduled closing time and cutoff.
- Save changes with validation and success/error feedback. Empty lists show add-service action or no staff available message.
- Desktop/tablet: stats row and settings cards; phone: single-column panels.

## Integration requirements
All seven screens consume the Express REST API and subscribe to authorized Socket.IO updates. PostgreSQL is the source of truth. Re-fetch current state after reconnect; show a stale-data warning during outages. Keep private status links separate from public tokens.

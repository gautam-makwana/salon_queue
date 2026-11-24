# Flows & Rules

## Remote customer flow
1. Home → Join Queue → enter details, select services and barber or Any.
2. Confirm creates token and private status link; customer sees Waiting, position and estimated wait.
3. At position 2 show Start coming; position 1 show You're next.
4. Reception calls next for an eligible barber; status becomes Called; customer alert and TV highlight appear.
5. Barber taps Start → In chair; then Done → terminal status; barber becomes available.

## Walk-in flow
Reception → Add walk-in → enter same required details → Confirm. Walk-ins join the same queue at the end and receive a token/status link. Online closure does not prevent staff adding walk-ins.

## Status transitions
| From | To | Actor / condition |
|---|---|---|
| New | Waiting | Valid join or walk-in |
| Waiting | Called | Reception calls eligible customer |
| Waiting | Cancelled | Customer or reception confirms |
| Called | In chair | Assigned barber starts |
| Called | No-show | Reception, at least 10 minutes after call |
| In chair | Done | Assigned barber completes |

Done, Cancelled and No-show are terminal. Never move backwards. A returning no-show receives a fresh token at the end. Waiting, Called and In chair are active statuses.

## Queue ordering and assignment
- First come, first served among eligible customers; use server-generated join timestamp and stable sequence to break ties.
- Call next for barber X selects the earliest Waiting entry preferring X or Any. Never assign a specific preference to another barber.
- A barber may hold only one Called or In chair entry. Barber must be on duty and not on break to call next.
- Claim customer and barber atomically in shared storage; simultaneous calls must not assign one customer twice.
- One active entry per normalized 10-digit phone. Enforce on the shared storage side, including simultaneous requests. Do not expose personal details through public phone lookup; explain secure demo recovery before implementing it.
- Token numbers increase monotonically within the demo queue; never reuse a token when cancelled or re-added. Private status identifier is separate from public token.
- Position = 1 plus number of Waiting entries ahead in global arrival order. Explain this is overall queue position, not a guarantee of service order because preferences differ.

## Waiting time
Lab approximation: sum total service minutes of Waiting customers ahead divided by count of on-duty barbers not on break (including busy barbers). Add estimated remaining work of active Called/In chair customers to the numerator so the first waiting customer does not incorrectly see zero when everyone is busy. For a specific barber, use one barber as divisor and include that barber's remaining work and earlier entries eligible for that barber. This is an estimate, not an exact schedule. Round up to whole minutes. Clamp remaining service time to zero; if a busy service overruns, display an estimate uncertainty message. When no eligible barber is working, display unavailable/on break rather than divide by zero. For a new join, calculate as if appended to the queue. Recompute on changes and periodically while connected.

Example: three earlier Waiting customers require 30, 15 and 45 minutes; three working barbers and no active workload give an estimate of 30 minutes.

## Operational rules
- Online joining closes 30 minutes before scheduled closing (8:30 PM for 9 PM), or when owner closes it manually. Use salon local time Asia/Kolkata. Staff can add walk-ins even when online joining is closed.
- Existing active entries remain valid after closing; owner may not reopen online joining during cutoff. Demo opening time 9 AM.
- On break allowed only if unassigned; customers with that preference see break notice and retain their place.
- Owner cannot mark a barber off duty if assigned or specifically requested by a Waiting customer; prevent new selections of off-duty barbers.
- Enabled service selections must be valid at confirmation. Store service name, duration and price snapshots with each entry so settings edits do not change existing entries.
- No-show is manual and enabled only after 10 minutes from Called. It frees barber immediately. Cancel Waiting frees the queue spot immediately.
- Use shared persistent storage and authoritative timestamps. All connected screens should reflect successful updates within five seconds under normal connectivity; show errors/stale status when disconnected. Do not rely on localStorage as the queue database.
- Staff permissions: reception can add/call/cancel/no-show; barber can start/done/break for own profile; owner manages settings and may access staff functions. Customer can view/cancel only own entry. Public TV receives non-personal fields only. Use server-enforced access controls; no privileged keys in frontend.
- Daily stats use Asia/Kolkata day: Done count by completion date, average minutes from join to Start for those completed, No-show count by no-show date. Empty average displays —.

## Test checklist (record actual results, do not mark passed without testing)
- [ ] Select Haircut + Beard trim: 45 min and ₹230.
- [ ] Reject invalid phone, blank name, zero or more than three services.
- [ ] Repeated/concurrent same-phone join creates only one active entry.
- [ ] Walk-in appears at queue end; remote and walk-in share order.
- [ ] Amit skips earlier Ravi-only customer and calls earliest eligible customer.
- [ ] Concurrent Call next actions never claim the same customer twice.
- [ ] Called alert and TV update within five seconds across separate devices.
- [ ] Start/Done update reception, status and TV; invalid transitions rejected.
- [ ] No-show disabled before 10 min; afterward frees barber; re-add gets fresh token at end.
- [ ] Cancel Waiting entry removes it from queue; cannot cancel after Called.
- [ ] Close online queue and simulate cutoff: joining blocked, walk-ins allowed.
- [ ] Disable service: hidden from new join, existing entry unchanged.
- [ ] Break updates customer notice; no calls to barber on break; all unavailable gives no numeric estimate.
- [ ] Wait estimate decreases when workload finishes (all else equal); first waiting customer sees nonzero estimate when all eligible barbers have positive remaining work.
- [ ] EN/GU toggle translates labels, alerts and errors without overflow.
- [ ] Phone, tablet and TV layouts work; refresh preserves shared state.
- [ ] Public TV does not leak names/phones; unauthorized staff mutations denied.
- [ ] Daily stats match known completed/no-show sample entries.
- [ ] Disconnect/reconnect displays stale warning and recovers without duplicate entries.

## Backend implementation constraints
- Express is the authority for validation, queue transitions and permissions; Prisma connects to PostgreSQL.
- Use database transactions and appropriate unique constraints/indexes (including partial unique indexes via SQL migrations where needed) for active phone numbers and active barber assignments. Use transactional locking or serializable transactions with retry to preserve eligible queue ordering under concurrency. Generate tokens using a database sequence; gaps are acceptable.
- Emit Socket.IO events only after successful commits. Authorize private subscriptions and expose only safe public data. Re-fetch authoritative state after reconnect.
- Keep credentials server-side, hash staff passwords with bcrypt, enforce JWT roles and restrict production CORS to the intended frontend.
- Use migrations and seed scripts with demo data; document local and hosted setup. Test concurrent requests against PostgreSQL before claiming success.

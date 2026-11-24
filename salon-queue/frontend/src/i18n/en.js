// src/i18n/en.js — English translation dictionary

const en = {
  // ── App-wide ─────────────────────────────────────────────────────────────
  salonName:        'Royal Cut Salon',
  language:         'ગુ', // label to switch TO Gujarati
  loading:          'Loading…',
  error:            'Something went wrong. Please try again.',
  retry:            'Retry',
  back:             'Back',
  save:             'Save',
  cancel:           'Cancel',
  confirm:          'Confirm',
  close:            'Close',
  staleWarning:     'Connection lost — data may be stale. Reconnecting…',
  offlineWarning:   'You are offline. Queue data may not be current.',

  // ── Status labels ─────────────────────────────────────────────────────────
  status: {
    WAITING:   'Waiting',
    CALLED:    'Called',
    IN_CHAIR:  'In Chair',
    DONE:      'Done',
    CANCELLED: 'Cancelled',
    NO_SHOW:   'No Show',
  },

  barberStatus: {
    AVAILABLE: 'Available',
    BUSY:      'Busy',
    ON_BREAK:  'On Break',
    OFF_DUTY:  'Off Duty',
  },

  // ── Home ─────────────────────────────────────────────────────────────────
  home: {
    openLabel:         'Open',
    closedLabel:       'Closed',
    closesAt:          'Closes at',
    waitingCount:      (n) => `${n} customer${n === 1 ? '' : 's'} waiting`,
    estimatedWait:     (m) => `~${m} min wait`,
    waitUnavailable:   'Wait time unavailable',
    noOneWaiting:      'No one waiting — walk right in!',
    joinQueue:         'Join Queue',
    joiningClosed:     'Online joining is closed',
    noStaffWorking:    'No barbers on duty right now',
    barbers:           'Our Barbers',
  },

  // ── Join Queue ───────────────────────────────────────────────────────────
  join: {
    title:          'Join the Queue',
    name:           'Your Name',
    namePlaceholder:'Enter your full name',
    phone:          'Phone Number',
    phonePlaceholder:'10-digit mobile number',
    services:       'Select Services (1–3)',
    barberPref:     'Preferred Barber',
    anyBarber:      'Any Barber (Fastest)',
    summary:        'Your Selection',
    totalDuration:  'Total Time',
    totalPrice:     'Total Price',
    estimatedWait:  'Est. Wait',
    confirmJoin:    'Confirm & Join',
    emptyServices:  'No services available. Please visit the salon.',
    errors: {
      nameRequired: 'Name is required.',
      phoneInvalid: 'Enter a valid 10-digit phone number.',
      selectService:'Select at least one service (max 3).',
      barberOffDuty:'This barber is off duty. Please choose another.',
      closedOnline: 'Online joining is currently closed.',
      duplicate:    'You already have an active queue spot.',
    },
  },

  // ── My Status ────────────────────────────────────────────────────────────
  status: {
    title:          'Your Queue Status',
    token:          'Token',
    position:       'Position',
    estimatedWait:  'Est. Wait',
    services:       'Services',
    preferredBarber:'Preferred Barber',
    assignedBarber: 'Assigned Barber',
    cancelSpot:     'Cancel My Spot',
    cancelConfirm:  'Are you sure you want to cancel your spot?',
    cancelWarning:  'You will lose your place in the queue.',
    joinAgain:      'Join Again',
    comeToSalon:    'Start heading to the salon!',
    youreNext:      "You're next!",
    calledAlert:    "You've been called!",
    barberWaiting:  (name) => `${name} is ready for you`,
    noShowTimer:    (mins) => `No-show eligible in ${mins} min`,
    serviceInProgress: 'Service in progress',
    thankYou:       'Thank you for visiting!',
    statusCancelled:'Your spot was cancelled.',
    statusNoShow:   'You were marked as no-show.',
    invalidLink:    'This status link is invalid or expired.',
    goHome:         'Go to Home',
    minutes:        'min',
    any:            'Any',
  },

  // ── Reception ────────────────────────────────────────────────────────────
  reception: {
    title:          'Reception Dashboard',
    addWalkin:      'Add Walk-in',
    callNext:       'Call Next',
    noShow:         'No-show',
    cancelEntry:    'Cancel',
    waitingList:    'Waiting',
    activeCalls:    'Active Calls',
    noWaiting:      'No customers waiting',
    noEligible:     'No eligible customer for this barber',
    elapsed:        'Waiting',
    calledElapsed:  'Called',
    highlight60min: 'Waiting over 60 min',
    noShowInfo:     'No-show available after 10 minutes',
    walkinTitle:    'Register Walk-in',
    signOut:        'Sign Out',
  },

  // ── Barber View ──────────────────────────────────────────────────────────
  barber: {
    title:       (name) => `${name}'s Station`,
    current:     'Current Customer',
    start:       'Start Service',
    done:        'Done',
    onBreak:     'Go on Break',
    endBreak:    'End Break',
    nextFor:     'Next for You',
    noCustomer:  'Waiting for next customer',
    offDuty:     'You are currently off duty',
    breakActive: 'On Break',
    timer:       'Service Timer',
    signOut:     'Sign Out',
  },

  // ── TV Display ───────────────────────────────────────────────────────────
  display: {
    title:          'Now Serving',
    nowServing:     'Now Serving',
    nextUp:         'Next Up',
    noWaiting:      'No customers waiting',
    available:      'Available',
    enableSound:    'Enable Sound',
    soundEnabled:   'Sound On',
    stale:          '⚠ DATA MAY BE STALE',
    connectionLost: 'Connection Lost',
  },

  // ── Admin / Owner ────────────────────────────────────────────────────────
  admin: {
    title:          'Owner Settings',
    dailyStats:     'Today\'s Stats',
    completed:      'Completed',
    noShows:        'No-shows',
    avgWait:        'Avg Wait',
    noAvgWait:      '—',
    services:       'Services',
    addService:     'Add Service',
    editService:    'Edit Service',
    barberRoster:   'Barber Roster',
    onDuty:         'On Duty',
    offDuty:        'Off Duty',
    queueControl:   'Online Queue',
    queueOpen:      'Open',
    queueClosed:    'Closed',
    scheduledClose: 'Closes at',
    cutoffNote:     'Online joining closes 30 min before closing',
    reopenBlocked:  'Cannot reopen during the closing window',
    saveSuccess:    'Changes saved.',
    saveError:      'Save failed. Please try again.',
    signOut:        'Sign Out',
    nameEn:         'Name (English)',
    nameGu:         'Name (Gujarati)',
    duration:       'Duration (min)',
    price:          'Price (₹)',
    enabled:        'Enabled',
    disabled:       'Disabled',
    enable:         'Enable',
    disable:        'Disable',
    edit:           'Edit',
    noServices:     'No services yet.',
    dutyBlocked:    (reason) => reason,
  },

  // ── Auth ─────────────────────────────────────────────────────────────────
  auth: {
    loginTitle:    'Staff Login',
    username:      'Username',
    password:      'Password',
    login:         'Log In',
    invalidCreds:  'Invalid username or password.',
    sessionExpired:'Session expired. Please log in again.',
  },

  // ── Misc ─────────────────────────────────────────────────────────────────
  mins: (n) => `${n} min`,
  currency: (n) => `₹${n}`,
  any: 'Any',
};

export default en;

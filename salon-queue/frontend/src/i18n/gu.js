// src/i18n/gu.js — Gujarati translation dictionary

const gu = {
  // ── App-wide ─────────────────────────────────────────────────────────────
  salonName:        'રોયલ કટ સલૂન',
  language:         'EN', // label to switch TO English
  loading:          'લોડ થઈ રહ્યું છે…',
  error:            'કંઈક ખોટું થયું. ફરી પ્રયાસ કરો.',
  retry:            'ફરી પ્રયાસ',
  back:             'પાછળ',
  save:             'સાચવો',
  cancel:           'રદ કરો',
  confirm:          'પુષ્ટિ કરો',
  close:            'બંધ',
  staleWarning:     'કનેક્શન ખોવાઈ ગઈ — ડેટા જૂની હોઈ શકે. ફરી જોડાઈ રહ્યા છીએ…',
  offlineWarning:   'તમે ઑફ‌લાઇન છો. ક્યુ ડેટા અપ-ટૂ-ડેટ ન હોઈ શકે.',

  // ── Status labels ─────────────────────────────────────────────────────────
  status: {
    WAITING:   'રાહ જોઈ રહ્યા છે',
    CALLED:    'બોલાવ્યા',
    IN_CHAIR:  'ખુરશી પર',
    DONE:      'પૂર્ણ',
    CANCELLED: 'રદ',
    NO_SHOW:   'ગેરહાજર',
  },

  barberStatus: {
    AVAILABLE: 'ઉપલબ્ધ',
    BUSY:      'વ્યસ્ત',
    ON_BREAK:  'વિરામ પર',
    OFF_DUTY:  'ફરજ બહાર',
  },

  // ── Home ─────────────────────────────────────────────────────────────────
  home: {
    openLabel:         'ખુલ્લું',
    closedLabel:       'બંધ',
    closesAt:          'બંધ થાય છે',
    waitingCount:      (n) => `${n} ગ્રાહક${n === 1 ? '' : 'ો'} રાહ જોઈ રહ્યા છે`,
    estimatedWait:     (m) => `~${m} મિનિટ રાહ`,
    waitUnavailable:   'રાહ સમય ઉપલબ્ધ નથી',
    noOneWaiting:      'કોઈ રાહ નથી જોઈ રહ્યું — સીધા આવો!',
    joinQueue:         'ક્યુ જોઇ ઓ',
    joiningClosed:     'ઑનલાઇન જોડાણ બંધ છે',
    noStaffWorking:    'હમણાં કોઈ નાઈ ફરજ પર નથી',
    barbers:           'અમારા નાઈ',
  },

  // ── Join Queue ───────────────────────────────────────────────────────────
  join: {
    title:          'ક્યુ માં જોડાઓ',
    name:           'તમારું નામ',
    namePlaceholder:'તમારું પૂરું નામ દાખલ કરો',
    phone:          'ફોન નંબર',
    phonePlaceholder:'10-અંકનો મોબાઇલ નંબર',
    services:       'સેવા પસંદ કરો (1–3)',
    barberPref:     'પसंदीदा નાઈ',
    anyBarber:      'કોઈ પણ નાઈ (ઝડપી)',
    summary:        'તમારી પસંદ',
    totalDuration:  'કુલ સમય',
    totalPrice:     'કુલ ભાવ',
    estimatedWait:  'અ. રાહ',
    confirmJoin:    'પુષ્ટિ કરો & જોડાઓ',
    emptyServices:  'કોઈ સેવા ઉpalbdh નથી. સલૂનની મુ‌લાકાત લો.',
    errors: {
      nameRequired: 'નામ જરૂરી છે.',
      phoneInvalid: 'માન્ય 10-અંકનો ફોન નંબર દાખલ કરો.',
      selectService:'ઓછામાં ઓછી 1 સેવા પસંદ કરો (વધુમાં 3).',
      barberOffDuty:'આ નાઈ ફરજ બહાર છે. બીજો પસંદ કરો.',
      closedOnline: 'ઑનલાઇન જોડાણ હાલ બંધ છે.',
      duplicate:    'તમારી પાસે પહેેlethee  ઍક્ટિવ ક્યુ સ્થળ છે.',
    },
  },

  // ── My Status ────────────────────────────────────────────────────────────
  status: {
    title:          'તમારી ક્યુ સ્થiTI',
    token:          'ટોકન',
    position:       'ક્રm',
    estimatedWait:  'અ. રાહ',
    services:       'સેવaOO',
    preferredBarber:'પsandida નaI',
    assignedBarber: 'nh nai',
    cancelSpot:     'સ્થan rdD karo',
    cancelConfirm:  'ckhas tmaRo sthAn rdD karvA maGo cho?',
    cancelWarning:  'tme queue maN tmaRi jagyA gamavsho.',
    joinAgain:      'fari joDaao',
    comeToSalon:    'sAluN traf aavvA nIkaLo!',
    youreNext:      'tmaRo varo aavI gayo!',
    calledAlert:    'tmaane boLavyA!',
    barberWaiting:  (name) => `${name} tmaRe maTe tayAr chhe`,
    noShowTimer:    (mins) => `${mins} mInITmaM no-show lAgU thaShe`,
    serviceInProgress: 'sevA chalU chhe',
    thankYou:       'AavvA bAdal AABhAr!',
    statusCancelled:'tmaRo sthAn rdD karyO.',
    statusNoShow:   'tmaane no-show gaNAvvAmAM AvyA.',
    invalidLink:    'Aa status link anuPravesh chhe yA melyadi gaI chhe.',
    goHome:         'mukhy pAnA par jAo',
    minutes:        'min',
    any:            'koi paN',
  },

  // ── Reception ────────────────────────────────────────────────────────────
  reception: {
    title:          'risepSan DAshboard',
    addWalkin:      'walk-in nondho',
    callNext:       'agle ne bolAvo',
    noShow:         'no-show',
    cancelEntry:    'rdD karo',
    waitingList:    'rAhjo',
    activeCalls:    'ckTiv kol',
    noWaiting:      'koi grAhak rAh nathi jotA',
    noEligible:     'aa nAI mATe koi yogya grAhak nathi',
    elapsed:        'rAhyA',
    calledElapsed:  'bolAvyA',
    highlight60min: '60 min thI vadhu rAhjo',
    noShowInfo:     '10 minIT bAd no-show UpalabdH thaShe',
    walkinTitle:    'walk-in nondho',
    signOut:        'bAhar nikLo',
  },

  // ── Barber View ──────────────────────────────────────────────────────────
  barber: {
    title:       (name) => `${name}nI khurSI`,
    current:     'hAlno grAhak',
    start:       'sevA sHurU karo',
    done:        'pUrN',
    onBreak:     'viRAm lo',
    endBreak:    'viRAm baMdH karo',
    nextFor:     'tmarA mATe agle',
    noCustomer:  'agle grAhakni pratIkSA',
    offDuty:     'tme hAl farj bahar cho',
    breakActive: 'virAm par',
    timer:       'sevA Timer',
    signOut:     'bAhar nikLo',
  },

  // ── TV Display ───────────────────────────────────────────────────────────
  display: {
    title:          'hAl sevA maM',
    nowServing:     'hAl sevA maM',
    nextUp:         'agle',
    noWaiting:      'koi grAhak rAh nathi jotA',
    available:      'UpalabdH',
    enableSound:    'savAj chAlu karo',
    soundEnabled:   'savAj chAlu',
    stale:          '⚠ dETA jUno hoi Sake',
    connectionLost: 'kaneKSan khoyAI gaI',
  },

  // ── Admin / Owner ────────────────────────────────────────────────────────
  admin: {
    title:          'mAlik seTiMgs',
    dailyStats:     'AajnA aaMkDAA',
    completed:      'pUrN thayA',
    noShows:        'no-show',
    avgWait:        'sarAsar rAh',
    noAvgWait:      '—',
    services:       'sevAo',
    addService:     'sevA umerao',
    editService:    'sevA sampAdit karo',
    barberRoster:   'nAI yAdI',
    onDuty:         'farj par',
    offDuty:        'farj bahar',
    queueControl:   'oNlaIn kyU',
    queueOpen:      'khullu',
    queueClosed:    'baMdH',
    scheduledClose: 'baMdH thAy chhe',
    cutoffNote:     'baMdH thavAnA 30 min paheLAM oNlaIn joDANu baMdH thAy',
    reopenBlocked:  'baMdH viNDo daurmiyAn fari khoLI SakAtu nathi',
    saveSuccess:    'FerfAr sAcHavyA.',
    saveError:      'sAcHavanI nakAmi. fari prayAs karo.',
    signOut:        'bAhar nikLo',
    nameEn:         'nAm (aMgrejI)',
    nameGu:         'nAm (gujarAtI)',
    duration:       'samay (min)',
    price:          'aMkam (₹)',
    enabled:        'sAkrIya',
    disabled:       'nIskrIya',
    enable:         'chAlu karo',
    disable:        'baMdH karo',
    edit:           'sampAdit karo',
    noServices:     'koi sevA nathi.',
    dutyBlocked:    (reason) => reason,
  },

  // ── Auth ─────────────────────────────────────────────────────────────────
  auth: {
    loginTitle:    'stAf logIn',
    username:      'yUzarnEm',
    password:      'pASavard',
    login:         'logIn karo',
    invalidCreds:  'anuPraveSh denAro nAm yA pASavard anucit.',
    sessionExpired:'seSan expAyar thaI gaI. fari logIn karo.',
  },

  // ── Misc ─────────────────────────────────────────────────────────────────
  mins: (n) => `${n} min`,
  currency: (n) => `₹${n}`,
  any: 'koi paN',
};

export default gu;

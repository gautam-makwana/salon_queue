// src/lib/socket.js
// Holds the Socket.IO server instance so controllers can emit events.
// Initialised in src/index.js; imported everywhere else.

let _io = null;

export function initSocket(io) {
  _io = io;
}

export function getIO() {
  if (!_io) throw new Error('Socket.IO not initialised — call initSocket(io) first.');
  return _io;
}

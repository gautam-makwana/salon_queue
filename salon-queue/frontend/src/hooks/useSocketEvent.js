// src/hooks/useSocketEvent.js
// Subscribe to a Socket.IO event; unsubscribes on cleanup.

import { useEffect } from 'react';
import { useSocket } from '../context/SocketContext';

/**
 * @param {string}   event    - Socket.IO event name
 * @param {Function} handler  - Callback when event fires
 * @param {any[]}    deps     - Additional useEffect dependencies
 */
export function useSocketEvent(event, handler, deps = []) {
  const { socket } = useSocket();

  useEffect(() => {
    const sock = socket.current;
    if (!sock) return;
    sock.on(event, handler);
    return () => sock.off(event, handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event, ...deps]);
}

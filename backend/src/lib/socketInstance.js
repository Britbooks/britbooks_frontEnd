/**
 * Holds the shared Socket.IO instance.
 * Exists as a separate module to break the circular dependency:
 *   chatService → server → chatRoutes → chatController → chatService
 */
let _io = null;

export function setIO(io) {
  _io = io;
}

export function getIO() {
  return _io;
}

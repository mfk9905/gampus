import { EventEmitter } from 'events';

// Global singleton message bus for server-side real-time events
const globalForBus = globalThis as unknown as {
  messageBus: EventEmitter | undefined;
};

export const messageBus = globalForBus.messageBus ?? new EventEmitter();
globalForBus.messageBus = messageBus;

messageBus.setMaxListeners(1000);


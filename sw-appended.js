const WRITE = 0;
const PULL = 0;
const ERROR = 1;
const ABORT = 1;
const CLOSE = 2;
const PING = 3;
class MessagePortSource {
  controller;
  constructor(port) {
    this.port = port;
    this.port.onmessage = (evt) => this.onMessage(evt.data);
  }
  start(controller) {
    this.controller = controller;
  }
  pull() {
    this.port.postMessage({ type: PULL });
  }
  cancel(reason) {
    this.port.postMessage({ type: ERROR, reason: reason.message });
    this.port.close();
  }
  onMessage(message) {
    if (message.type === WRITE) {
      this.controller.enqueue(message.chunk);
    }
    if (message.type === ABORT) {
      this.controller.error(message.reason);
      this.port.close();
    }
    if (message.type === CLOSE) {
      this.controller.close();
      this.port.close();
    }
  }
}
self.addEventListener("install", () => {
  self.skipWaiting();
});
self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});
const map = new Map();
globalThis.addEventListener("message", (evt) => {
  const data = evt.data;
  if (data.url && data.readablePort) {
    data.rs = new ReadableStream(
      new MessagePortSource(evt.data.readablePort),
      new CountQueuingStrategy({ highWaterMark: 4 }),
    );
    map.set(data.url, data);
  }
});
globalThis.addEventListener("fetch", (evt) => {
  const url = evt.request.url;
  const data = map.get(url);
  if (!data) {
    return null;
  }
  map.delete(url);
  evt.respondWith(new Response(data.rs, { headers: data.headers }));
});

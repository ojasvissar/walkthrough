const map = document.querySelector('#map');
const status = document.querySelector('#status');
const dot = document.querySelector('#dot');
const floor = document.querySelector('#floor');
const key = new URL(location.href).searchParams.get('session');
let x = .5;
let z = .85;
let pointer;
let pending;
const socket = key ? new WebSocket((location.protocol === 'https:' ? 'wss://' : 'ws://') + location.host + '/live?key=' + encodeURIComponent(key)) : null;

function move(nextX, nextZ) {
  x = Math.max(.015, Math.min(.985, nextX));
  z = Math.max(.015, Math.min(.985, nextZ));
  dot.style.left = x * 100 + '%';
  dot.style.top = z * 100 + '%';
  if (pending) return;
  pending = setTimeout(() => {
    pending = null;
    if (socket?.readyState === WebSocket.OPEN) socket.send(JSON.stringify({ x, z, floor: Number(floor.value) }));
  }, 70);
}

function touch(event) {
  const rect = map.getBoundingClientRect();
  move((event.clientX - rect.left) / rect.width, (event.clientY - rect.top) / rect.height);
}
map.onpointerdown = (event) => {
  pointer = event.pointerId;
  map.setPointerCapture(pointer);
  touch(event);
};
map.onpointermove = (event) => { if (pointer === event.pointerId) touch(event); };
map.onlostpointercapture = () => { pointer = null; };
map.onkeydown = (event) => {
  const directions = { ArrowLeft: [-.05, 0], ArrowRight: [.05, 0], ArrowUp: [0, -.05], ArrowDown: [0, .05] };
  if (!directions[event.key]) return;
  event.preventDefault();
  const [dx, dz] = directions[event.key];
  move(x + dx, z + dz);
};
floor.onchange = () => move(x, z);
if (!socket) status.textContent = 'Open the audience link shared by the presenter.';
else {
  socket.onmessage = () => { status.textContent = 'You’re in the building.'; move(x, z); };
  socket.onclose = () => { status.textContent = 'Connection ended. Reopen the audience link to join again.'; };
}

import { demoHistory, tourStops } from './story.js';
import { scanGitHub } from './repository.js';
import { apiAction } from './runtime.js';

const total = 90_000;

export function setupExperience({ palace, getModel, selectRoom, setCamera, showStatus, openDialog, runtime, onTourStart }) {
  const $ = (selector) => document.querySelector(selector);
  const tourPanel = $('#tour-panel');
  const gitPanel = $('#git-panel');
  const slider = $('#git-slider');
  let tour;
  let commits = [];
  let playback;
  let audience;
  let audienceSocket;

  function closeTour() {
    if (tour) cancelAnimationFrame(tour.frame);
    tour = null;
    tourPanel.hidden = true;
    palace?.reset();
  }

  function closeGit() {
    clearInterval(playback);
    playback = null;
    $('#git-play').textContent = 'Play';
    gitPanel.hidden = true;
    palace?.setTimeline(null);
  }

  function requestFrame() {
    if (tour) tour.frame = requestAnimationFrame(advanceTour);
  }

  function advanceTour(now) {
    if (!tour || tour.paused) return;
    const elapsed = Math.min(total, now - tour.started);
    const index = Math.min(tour.stops.length - 1, Math.floor(elapsed / tour.interval));
    const remaining = Math.ceil((total - elapsed) / 1000);
    $('#tour-progress').value = elapsed / 1000;
    if (index !== tour.index) {
      tour.index = index;
      const stop = tour.stops[index];
      const room = getModel().rooms.find((entry) => entry.id === stop.id);
      selectRoom(stop.id);
      palace?.tourFocus(stop.id);
      $('#tour-heading').textContent = room.name;
      $('#tour-note').textContent = stop.note;
    }
    $('#tour-count').textContent = remaining + ' seconds left · Stop ' + (index + 1) + ' of ' + tour.stops.length;
    if (remaining === 0) {
      $('#tour-heading').textContent = 'That’s the first week of onboarding, done in 90 seconds.';
      $('#tour-note').textContent = 'Try the quiz to see what you remember.';
      $('#tour-pause').textContent = 'Replay tour';
      $('#tour-next').disabled = true;
      tour.done = true;
    } else requestFrame();
  }

  function beginTour() {
    onTourStart();
    if (tour) closeTour();
    closeGit();
    setCamera('orbit');
    const stops = tourStops(getModel());
    if (!stops.length) return;
    tour = { stops, index: -1, started: performance.now(), interval: total / stops.length };
    $('#tour-pause').textContent = 'Pause';
    $('#tour-next').disabled = false;
    tourPanel.hidden = false;
    showStatus('');
    requestFrame();
  }

  $('#start-tour').onclick = beginTour;
  $('#tour-close').onclick = closeTour;
  $('#tour-pause').onclick = () => {
    if (!tour) return;
    if (tour.done) return beginTour();
    if (tour.paused) {
      tour.started += performance.now() - tour.paused;
      tour.paused = null;
      $('#tour-pause').textContent = 'Pause';
      requestFrame();
    } else {
      tour.paused = performance.now();
      cancelAnimationFrame(tour.frame);
      $('#tour-pause').textContent = 'Resume';
    }
  };
  $('#tour-next').onclick = () => {
    if (!tour) return;
    cancelAnimationFrame(tour.frame);
    tour.started = performance.now() - Math.min(total, (tour.index + 1) * tour.interval);
    tour.paused = null;
    $('#tour-pause').textContent = 'Pause';
    requestFrame();
  };

  function showCommit() {
    const index = Number(slider.value);
    const frame = commits[index];
    if (!frame) return;
    palace?.setTimeline(frame);
    $('#git-meta').textContent = (getModel().kind === 'demo' ? 'Demo history' : frame.sha.slice(0, 7)) +
      ' · Commit ' + (index + 1) + ' of ' + commits.length +
      (frame.date ? ' · ' + new Date(frame.date).toLocaleDateString() : '');
    $('#git-title').textContent = frame.title;
  }

  async function openGit() {
    closeTour();
    const model = getModel();
    commits = model.kind === 'demo' ? demoHistory : model.history || [];
    if (!commits.length && model.kind === 'snapshot') {
      showStatus('Reading recent GitHub commits…');
      try {
        const current = await scanGitHub(model.slug, () => {}, AbortSignal.timeout(25000));
        if (getModel() !== model) return;
        const known = new Set(model.rooms.map((room) => room.id));
        const paths = new Map(model.rooms.map((room) => [room.path, room.id]));
        const links = new Map(current.rooms.map((room) => [room.id, paths.get(room.path)]));
        commits = current.history.map((frame) => ({
          ...frame, rooms: [...known], changed: frame.changed.map((id) => links.get(id)).filter(Boolean),
          hot: frame.hot.map((id) => links.get(id)).filter(Boolean),
        }));
      } catch { commits = []; }
    }
    if (getModel() !== model) return;
    if (!commits.length) {
      return showStatus('No commit history came with this model. Try The Tiny Shop or scan a public GitHub repo.');
    }
    setCamera('orbit');
    showStatus('');
    slider.max = String(commits.length - 1);
    slider.value = '0';
    gitPanel.hidden = false;
    showCommit();
  }
  $('#git-history').onclick = openGit;
  $('#git-close').onclick = closeGit;
  slider.oninput = showCommit;
  $('#git-play').onclick = () => {
    if (playback) {
      clearInterval(playback);
      playback = null;
      $('#git-play').textContent = 'Play';
      return;
    }
    if (slider.value === slider.max) { slider.value = '0'; showCommit(); }
    $('#git-play').textContent = 'Pause';
    playback = setInterval(() => {
      if (slider.value === slider.max) {
        clearInterval(playback);
        playback = null;
        $('#git-play').textContent = 'Replay';
        return;
      }
      slider.value = String(Number(slider.value) + 1);
      showCommit();
    }, 1400);
  };

  function joinDetails() {
    openDialog('Audience walk-in', 'Live session',
      '<div id="audience-qr"></div><p>Scan the code on a phone connected to the presenter’s network, then tap the map to move a dot.</p>' +
      '<label>Join link<input id="audience-link" readonly></label><div class="dialog-actions"><button id="copy-audience" class="btn primary">Copy link</button><a id="open-audience" class="btn" target="_blank" rel="noopener">Open join page</a></div>' +
      '<p id="audience-dialog-count" role="status"></p>', (content) => {
      const link = content.querySelector('#audience-link');
      link.value = audience.join;
      content.querySelector('#open-audience').href = audience.join;
      const makeQR = globalThis.qrcode;
      if (typeof makeQR === 'function') {
        const qr = makeQR(0, 'M');
        qr.addData(audience.join);
        qr.make();
        content.querySelector('#audience-qr').innerHTML = qr.createImgTag(6, 24, 'QR code for this WalkThrough audience session');
      }
      content.querySelector('#copy-audience').onclick = async (event) => {
        link.select();
        const copied = await navigator.clipboard?.writeText(link.value).then(() => true, () => false);
        if (copied) event.target.textContent = 'Copied';
      };
    });
  }

  $('#audience').onclick = async (event) => {
    if (audience) return joinDetails();
    const config = await runtime;
    if (!config?.audience) {
      return openDialog('Audience walk-in', 'Presenter runtime',
        '<p>Run the local presenter with audience mode enabled to get a QR code. Audience phones join on the same network.</p>' +
        '<pre class="patch">npm install\nWALKTHROUGH_AUDIENCE=1 npm start</pre>');
    }
    const button = event.currentTarget || $('#audience');
    button.disabled = true;
    try {
      audience = await apiAction('audience');
      audienceSocket = new WebSocket(audience.host);
      audienceSocket.onmessage = ({ data }) => {
        const { people } = JSON.parse(data);
        palace?.setAudience(people);
        $('#audience-count').textContent = people.length ? ' · ' + people.length : '';
        const count = $('#audience-dialog-count');
        if (count) count.textContent = people.length + (people.length === 1 ? ' guest connected' : ' guests connected');
      };
      audienceSocket.onclose = () => {
        audience = null;
        palace?.setAudience([]);
        $('#audience-count').textContent = '';
      };
      joinDetails();
    } catch (error) { showStatus(error.message, true); }
    finally { button.disabled = false; }
  };

  $('#show-backup').onclick = () => openDialog('The Tiny Shop on stage', 'Offline backup · Acts 2–4',
    '<video class="backup-video" controls playsinline preload="metadata" poster="./walkthrough-backup.jpg" src="./walkthrough-backup.mp4"></video>' +
    '<a class="btn" href="./walkthrough-backup.mp4" download>Download the backup film</a>');

  return {
    startTour: beginTour,
    reset() {
      if (tour) closeTour();
      if (!gitPanel.hidden) closeGit();
    },
  };
}

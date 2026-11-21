import { apiAction } from './runtime.js';
import { createSourceContext, sourceFallback } from './source-context.js';

function element(tag, options = {}) {
  return Object.assign(document.createElement(tag), options);
}

function suggestedQuestions(model, selected) {
  if (model.kind === 'demo') return [
    'Where does payment validation happen?',
    'How does a login request reach the user store?',
    'Why does mixed-case email matter in Auth Service?',
  ];
  const room = model.rooms.find(({ id }) => id === selected) || model.rooms[0];
  return [
    'What does ' + room.name + ' do?',
    'Which modules does ' + room.name + ' depend on?',
    room.functions.length ? 'How does ' + room.functions[0] + ' work?' : 'Where does the application start?',
  ];
}

function renderAnswer(outlet, result, sources, jump) {
  outlet.replaceChildren();
  const citations = sources.filter((source) => result.citations.includes(source.id));
  const metadata = element('div', { className: 'ask-provider', textContent: result.provider });
  const answer = element('p', { className: 'ask-answer' });
  const known = new Set(citations.map(({ id }) => id));
  for (const part of result.answer.split(/(\[S[1-8]\])/g)) {
    const id = part.slice(1, -1);
    if (/^\[S[1-8]\]$/.test(part) && known.has(id)) {
      const link = element('button', { className: 'citation-inline', type: 'button', textContent: id });
      link.setAttribute('aria-label', 'Show source ' + id);
      link.onclick = () => {
        const source = outlet.querySelector('[data-source="' + id + '"]');
        source.open = true;
        source.scrollIntoView({ block: 'nearest' });
      };
      answer.append(link);
    } else answer.append(document.createTextNode(part));
  }
  outlet.append(metadata, answer);
  if (!citations.length) return;
  const list = element('div', { className: 'ask-sources' });
  list.append(element('h3', { textContent: 'Sources' }));
  for (const source of citations) {
    const card = element('details', { className: 'ask-source' });
    card.dataset.source = source.id;
    card.append(element('summary', { textContent: source.id + ' · ' + source.path + ':' + source.line + '–' + source.end }));
    card.append(element('pre', { textContent: source.code }));
    const actions = element('div', { className: 'dialog-actions' });
    if (source.href) actions.append(element('a', { className: 'btn', target: '_blank', rel: 'noopener noreferrer', href: source.href, textContent: 'View source' }));
    if (source.room) {
      const button = element('button', { className: 'btn', type: 'button', textContent: 'Show room' });
      button.onclick = () => jump(source.room.id);
      actions.append(button);
    }
    card.append(actions);
    list.append(card);
  }
  outlet.append(list);
}

export function setupAsk({ openDialog, getModel, getRoom, jump }) {
  const contexts = new WeakMap();
  let pending;

  function cancel() {
    pending?.abort();
    pending = null;
  }

  function open() {
    const model = getModel();
    if (!contexts.has(model)) contexts.set(model, { source: createSourceContext(model), attachments: 0 });
    const context = contexts.get(model);
    const selected = getRoom();
    openDialog('Ask the building', model.slug,
      '<p>Ask about the loaded repository. Each answer can point you to the source lines it used.</p>' +
      '<div id="ask-examples" class="ask-examples"></div>' +
      '<form id="ask-form" class="ask-form"><label for="ask-question">Question</label>' +
      '<textarea id="ask-question" name="question" rows="2" maxlength="700" spellcheck="false" placeholder="Where is sign-in handled?" required autofocus></textarea>' +
      '<div class="ask-actions"><button class="btn primary" type="submit">Ask</button>' +
      '<button class="text-btn" id="ask-attach" type="button">Attach source files</button>' +
      '<input id="ask-files" type="file" accept=".js,.jsx,.mjs,.cjs,.ts,.tsx,.py" multiple hidden></div></form>' +
      '<p id="ask-status" role="status" hidden></p><div id="ask-output" class="ask-output" aria-live="polite" hidden></div>', (content) => {
        const $ = (selector) => content.querySelector(selector);
        const form = $('#ask-form');
        const question = $('#ask-question');
        const status = $('#ask-status');
        const output = $('#ask-output');
        const button = $('button[type=submit]');
        const files = $('#ask-files');
        const attach = $('#ask-attach');
        for (const suggestion of suggestedQuestions(model, selected)) {
          const pick = element('button', { type: 'button', className: 'ask-suggestion', textContent: suggestion });
          pick.onclick = () => { question.value = suggestion; form.requestSubmit(); };
          $('#ask-examples').append(pick);
        }
        if (context.last) {
          question.value = context.last.question;
          output.hidden = false;
          renderAnswer(output, context.last.result, context.last.evidence, jump);
        }
        attach.onclick = () => files.click();
        files.onchange = async () => {
          const chosen = Array.from(files.files || []).slice(0, 24 - context.attachments);
          const result = await Promise.allSettled(chosen.map(async (file) =>
            file.size <= 320_000 && context.source.attach(file.webkitRelativePath || file.name, await file.text())));
          const accepted = result.filter((item) => item.status === 'fulfilled' && item.value).length;
          context.attachments += accepted;
          status.hidden = false;
          status.textContent = accepted ? accepted + (accepted === 1 ? ' file' : ' files') + ' added to this repository’s source context.' :
            'Choose JavaScript, TypeScript, or Python source files under 320 KB. Up to 24 files can be attached.';
          files.value = '';
        };
        form.onsubmit = async (event) => {
          event.preventDefault();
          const text = question.value.trim();
          if (!text || pending) return;
          const controller = new AbortController();
          pending = controller;
          button.disabled = true;
          output.hidden = true;
          status.hidden = false;
          status.textContent = 'Finding source …';
          const previousQuestion = context.last?.question || '';
          try {
            const evidence = await context.source.search(text, {
              selected: getRoom(), previousQuestion,
              signal: AbortSignal.any([controller.signal, AbortSignal.timeout(12_000)]),
            });
            if (!evidence.length) {
              status.textContent = 'Source is unavailable for this map. Attach the source files or load its public GitHub repository.';
              return;
            }
            status.textContent = 'Reading ' + evidence.length + (evidence.length === 1 ? ' source excerpt …' : ' source excerpts …');
            let result;
            try {
              result = await apiAction('ask', {
                question: text, previousQuestion, repository: model.slug,
                evidence: evidence.map(({ id, path, line, code }) => ({ id, path, line, code })),
              }, AbortSignal.any([controller.signal, AbortSignal.timeout(57_000)]));
            } catch {
              controller.signal.throwIfAborted();
              result = sourceFallback(text, evidence);
            }
            controller.signal.throwIfAborted();
            context.last = { question: text, result, evidence };
            status.hidden = true;
            output.hidden = false;
            renderAnswer(output, result, evidence, jump);
          } catch (error) {
            if (!controller.signal.aborted) status.textContent = error.name === 'TimeoutError'
              ? 'Source lookup took too long. Try a filename or attach the file.' : 'Could not read the repository. Try again.';
          } finally {
            if (pending === controller) pending = null;
            button.disabled = false;
          }
        };
      }, 'ask');
  }

  return { open, cancel };
}

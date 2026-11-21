# WalkThrough

Onboarding to a new codebase takes weeks. Give us 90 seconds.

WalkThrough maps a GitHub repository into a stylized Three.js architectural model. Floors represent layers, rooms represent modules, and illuminated hallway routes represent imports. Click a room or one of its function objects to inspect it. Orbit gives you a cutaway view and Play lets you walk through the same building.

## Run the presenter

```sh
npm install
WALKTHROUGH_CODEX=1 npm start
```

Open [http://127.0.0.1:8765](http://127.0.0.1:8765). The Codex option uses an authenticated Codex CLI on this machine. The browser demo runs with the bundled assets and requires only a local static server.

**Orbit** shows the full building. In **Play**, the voxel Codex bot is your default avatar. Use the picker to switch to the man or woman. Move with WASD or the arrow keys, hold Shift to run, and drag to look around. Follow the stairwell between floors. Enter a room through its doorway or press E to inspect it.

## Avatar assets

The three local rigs follow the [Codex 3D Asset voxel preset](https://github.com/anisayari/codex-3d-asset/blob/main/data/style-presets.json) and stay within its 2,500-triangle budget. Their picker portraits are rendered from those same rigs. The repository’s external generation workflow uses Tripo credentials.

## Three-minute stage demo

1. **See it.** Paste a public GitHub URL, load a preprocessed example, or import architecture JSON. A **90-second tour** flies through the architecture. End with the memory quiz.
2. **Watch it.** Select **Trace login**, then submit the Tiny Shop account. The separate shop page also streams events back to WalkThrough when someone clicks **Log in**. Flip on the slow lookup to see the request wait in the User Store.
3. **Break it.** Let a volunteer pick a line change. The test executes a faulty auth module in an isolated local copy. Auth Service lights up, fills with smoke, and the request figure collapses.
4. **Fix it.** Open **Repair**. The local Codex runtime reads the failing source and trace, returns a one-line patch, and verifies the same test against the edited source. The figure stands up and finishes its route. The repair offers a Git patch and an optional GitHub draft PR.

Select **Backup film** to play or download the offline replay of Acts 2–4. It is rendered from captured Tiny Shop runtime events.

## Repository examples

- **Full Stack FastAPI** is the clearest four-floor tour. Walk from the React form to the Python route, authentication helpers, and data models. [GitHub repository](https://github.com/fastapi/full-stack-fastapi-template)
- **Express** is a short JavaScript walkthrough of requests, responses, middleware, and rendering. [GitHub repository](https://github.com/expressjs/express)
- **Flask** tours Python blueprints, dispatch, templating, and sessions. [GitHub repository](https://github.com/pallets/flask)
- **Vite** covers the TypeScript CLI, development server, plugin pipeline, and build. [GitHub repository](https://github.com/vitejs/vite)

**Example repos** includes all four as offline snapshots. Audience repositories use the read-only architecture flow. The Tiny Shop powers the live acts.

## Repo analysis and Git replay

**Map with Codex** is available in the local presenter. It inventories tracked JS, TS, and Python modules and gives Codex source and Git history for the room model. The private hosted version provides a direct GitHub scan and displays how much source was read. It can also load a Codex-generated architecture file.

```sh
node tools/map-with-codex.mjs /path/to/checkout architecture.json
```

Select **Example repos → Import architecture JSON**. The file format is in [tools/architecture-schema.json](tools/architecture-schema.json). **Git replay** uses recent commits from the repository, the imported model’s history, or the Tiny Shop’s staged history.

## Ask the building

The header opens the tour, building, request log, alarms, and repository Q&A. **Ask the building** looks up source in the loaded repository and displays file and line citations. **Attach source files** adds local JS, TS, or Python files to the current model, including maps imported from a private checkout.

The local presenter uses the signed-in Codex CLI with `WALKTHROUGH_CODEX=1`. It can also read an `OPENAI_API_KEY` from its process environment. The private hosted version reads that key as a Sites runtime secret. Repository excerpts are passed to the answer provider when you submit a question. Source excerpts remain available when a provider is unavailable.

## Audience walk-in

Start with `WALKTHROUGH_AUDIENCE=1 npm start`, then choose **Audience** to display the QR code. Phones on the same network can choose a floor and tap to move a dot in the presenter’s building. The guest server defaults to port 8767. Set `WALKTHROUGH_AUDIENCE_ADDRESS` to the presenter’s LAN address if the auto-selected interface is wrong.

## Draft repair PR

Use a GitHub repository and base branch you control, with the project files and the demo fault in `dist/auth.js`. For a lowercasing fault, replace `return value.trim().toLowerCase();` with `return value.trim();` in that branch. Sign in to the GitHub CLI, then start the presenter with the configured target.

```sh
WALKTHROUGH_CODEX=1 WALKTHROUGH_PR_REPO=owner/repository WALKTHROUGH_PR_BASE=demo-broken npm start
```

Set `WALKTHROUGH_PR_FILE=codebase-palace/dist/auth.js` if the project sits in that subdirectory of the target repository.

After the repair passes, **Open draft PR** shows the exact target and asks for the publish action. The presenter pushes a repair branch and returns the draft’s GitHub URL.

## Checks

```sh
npm test
```

The backup renderer takes actual trace data from `tools/backup-traces.mjs`, draws frames with Pillow, and encodes them with FFmpeg. The pre-rendered MP4 is included.

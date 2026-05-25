# Contributing

Thanks for taking the time to look at this. A few notes before you send a PR, these help me review faster and keep the plugin from drifting away from what it's meant to be.

## Before you start

**For bug fixes and small improvements:** just send the PR.

**For new features or larger changes:** please open an issue first so we can talk about it. The plugin is intentionally minimalist (one single card format, no variants, no tinkering knobs) and not every feature is a good fit. Better to find out before you write the code than after.

A few things that are likely out of scope:

- Alternative card syntaxes or formats (the whole point of the plugin is that there's exactly one way to write a card).
- Bidirectional sync (Anki → Obsidian). This plugin syncs one direction on purpose.
- Other Anki note types beyond Basic. Cloze, reverse, image occlusion etc. are not planned.
- Per-card configuration options or front-matter switches.
- Features that meaningfully expand the UI beyond the current settings tab and commands.
- Heavy dependencies. The plugin should stay small.

If in doubt, open an issue and ask.

## Pull request checklist

- One topic per PR. If your branch fixes a bug and adds a feature and refactors a module, please split it.
- Keep the diff focused. Reformatting unrelated files makes review much harder.
- Test it manually with a real Obsidian vault and a real Anki instance running AnkiConnect. Describe what you tested in the PR description (which formats, sync direction, deck setup).
- If you changed how cards are parsed or how content is sent to Anki, please include a small example markdown file (front, back, any embeds) that you tested with.
- If you changed anything visual or added a setting, include a screenshot.
- If you added a dependency, mention why it's necessary.

## Using AI tools

Codex, Claude Code, Copilot, Cursor are all fine. But please:

1. Mention it in the PR description.
2. Confirm you actually ran the code and tested it against a real Anki instance.
3. Read the diff before submitting. If you can't explain what a part of your PR does, I probably shouldn't merge it.

AI-generated PRs are not rejected on principle, but they tend to over-engineer and add code that isn't needed. Trim before you submit.

## Development setup

```bash
npm install
npm run dev
```

`npm run dev` watches for changes and rebuilds `main.js`. Point your test vault's `.obsidian/plugins/simple-anki-sync/` folder at the build output (or symlink it) and reload Obsidian to pick up changes.

For a production build:

```bash
npm run build
```

You'll need a working Anki + AnkiConnect setup to actually test sync behavior. Make sure Anki is running before triggering any sync commands.

## Review timeline

This is a side project, so reviews can take a few days to a week. If a PR has been sitting for two weeks without a response, feel free to ping it.

## Reporting bugs

Open an issue with:

- Your Obsidian version and OS
- Your AnkiConnect version
- A minimal markdown example that reproduces the problem (front, back, any embeds)
- What you expected to happen
- What happened instead
- Any errors from Obsidian's developer console (Ctrl+Shift+I → Console)

Thanks for contributing.

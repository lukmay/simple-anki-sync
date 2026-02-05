import { Plugin, TFile, MarkdownView, Notice, arrayBufferToBase64 } from 'obsidian';
import { AnkiService } from './anki-service';
import { ObsidianNote, ProcessedMediaResult } from './types';
import { DEFAULT_SETTINGS, SimpleAnkiSyncSettingTab, SimpleAnkiSyncSettings } from './settings';
import { TableToggleManager } from './table-toggle';

// Regex-Templates
const DECK_TAG = /#anki\/([^\s]+)/;
const NOTE_ID_COMMENT = /<!--ANKI_NOTE_ID:(\d+)-->/;
const NOTE_ID_COMMENT_GLOBAL = /<!--ANKI_NOTE_ID:(\d+)-->/g;
const IMAGE_EMBED = /!\[\[([^|\]\n]+)(?:\|(\d+))?\]\]/g;
const BLOCK_LATEX = /\$\$([\s\S]*?)\$\$/g;
const INLINE_LATEX = /(?<![\$\\])\$([^$]+?)(?<!\\)\$/g;

const DEFAULT_MODEL = 'Basic';

export default class SimpleAnkiSyncPlugin extends Plugin {
  private anki!: AnkiService;
  public settings: SimpleAnkiSyncSettings = DEFAULT_SETTINGS;
  private tableToggle!: TableToggleManager;

  async onload() {
    console.log('Loading Simple Anki Sync Plugin');
    this.anki = new AnkiService(this.app);

    await this.loadSettings();

    this.tableToggle = new TableToggleManager(this.settings);
    this.tableToggle.registerMarkdownPostProcessor(this);
    this.tableToggle.onLoad();

    this.addSettingTab(new SimpleAnkiSyncSettingTab(this.app, this));

    this.addCommand({
      id: 'sync-current-file-with-anki',
      name: 'Sync current file with Anki',
      checkCallback: (checking) => {
        const view = this.app.workspace.getActiveViewOfType(MarkdownView);
        if (view?.file) {
          if (!checking) this.syncFile(view.file);
          return true;
        }
        return false;
      },
    });

    this.addCommand({
      id: 'sync-vault-with-anki',
      name: 'Sync entire vault with Anki',
      callback: async () => {
        await this.syncVault();
      },
    });

    this.addCommand({
      id: 'unsync-current-file-with-anki',
      name: 'Unsync current file with Anki',
      checkCallback: (checking) => {
        const view = this.app.workspace.getActiveViewOfType(MarkdownView);
        if (view?.file) {
          if (!checking) this.unSyncFile(view.file);
          return true;
        }
        return false;
      },
    });

    this.addCommand({
      id: 'collapse-anki-card-tables',
      name: 'Collapse all Anki card tables on page',
      checkCallback: (checking) => {
        const view = this.app.workspace.getActiveViewOfType(MarkdownView);
        if (!view) return false;
        if (checking) return true;
        if (!this.settings.enableAnswerToggle) {
          new Notice('Answer table toggles are disabled in settings.');
          return;
        }
        this.tableToggle.setTablesCollapsedInScope(view.contentEl, true);
      },
    });

    this.addCommand({
      id: 'expand-anki-card-tables',
      name: 'Expand all Anki card tables on page',
      checkCallback: (checking) => {
        const view = this.app.workspace.getActiveViewOfType(MarkdownView);
        if (!view) return false;
        if (checking) return true;
        if (!this.settings.enableAnswerToggle) {
          new Notice('Answer table toggles are disabled in settings.');
          return;
        }
        this.tableToggle.setTablesCollapsedInScope(view.contentEl, false);
      },
    });
  }

  onunload() {
    console.log('Unloading Simple Anki Sync Plugin');
    this.tableToggle?.onUnload();
  }

  private async loadSettings(): Promise<void> {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  public async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
  }

  public applyRowToggleSettings(): void {
    this.tableToggle?.updateSettings(this.settings);
    this.tableToggle?.applySettings();
  }

  // Splits a table row into its cells
  private splitTableRow(row: string): string[] {
    const clean = row.trim().replace(/^\||\|$/g, '');
    const cells: string[] = [];
    let buf = '';

    let inBrackets = false;    // [[...]]
    let inInlineMath = false;  // $...$
    let inBlockMath = false;   // $$...$$

    for (let i = 0; i < clean.length; i++) {
      if (!inInlineMath && clean.slice(i, i + 2) === '$$') {
        inBlockMath = !inBlockMath;
        buf += '$$';
        i++;
        continue;
      }
      if (!inBlockMath && clean[i] === '$') {
        inInlineMath = !inInlineMath;
        buf += '$';
        continue;
      }
      if (!inBrackets && clean.slice(i, i + 2) === '[[') {
        inBrackets = true;
        buf += '[[';
        i++;
        continue;
      }
      if (inBrackets && clean.slice(i, i + 2) === ']]') {
        inBrackets = false;
        buf += ']]';
        i++;
        continue;
      }

      const ch = clean[i];
      if (ch === '\\' && clean[i + 1] === '|') {
        buf += '|';
        i++;
        continue;
      }
      if (ch === '|' && !inBrackets && !inInlineMath && !inBlockMath) {
        cells.push(buf.trim());
        buf = '';
        continue;
      }

      buf += ch;
    }

    cells.push(buf.trim());
    return cells.filter((c) => c !== '' || cells.length === 1);
  }

  // Parses the content of a file and extracts notes and deck name
  private parseNotesFromContent(
    content: string,
    file: TFile
  ): { notes: ObsidianNote[]; deckName: string | null } {
    const tagMatch = content.match(DECK_TAG);
    const deckName = tagMatch?.[1]?.replace(/\//g, '::') ?? null;
    const notes: ObsidianNote[] = [];
    const lines = content.split('\n');

    for (let i = 0; i < lines.length - 2; i++) {
      const h = lines[i];
      const sep = lines[i + 1];
      const d = lines[i + 2];

      if (
        h.trim().startsWith('|') &&
        sep.match(/^\|\s*-{3,}\s*\|$/) &&
        d.trim().startsWith('|')
      ) {
        const headerCells = this.splitTableRow(h);
        const dataCells = this.splitTableRow(d);
        if (headerCells.length !== 1 || dataCells.length !== 1) {
          i++;
          continue;
        }

        const nextLine = lines[i + 3];
        if (nextLine?.trim().startsWith('|')) {
          i++;
          continue;
        }

        let existingId: number | undefined;
        let endLine = i + 2;
        const maybeComment = lines[i + 3];
        const idMatch = maybeComment?.match(NOTE_ID_COMMENT);
        if (idMatch) {
          existingId = parseInt(idMatch[1], 10);
          endLine = i + 3;
        }

        notes.push({
          sourceId: `${file.path}-${i}`,
          front: headerCells[0],
          back: dataCells[0],
          noteId: existingId,
          startLine: i,
          endLine,
        });

        i = endLine;
      }
    }

    return { notes, deckName };
  }

  private async processMedia(
    text: string,
    file: TFile
  ): Promise<ProcessedMediaResult> {
    let out = text;
    const uploads: { ankiFileName: string; dataBase64: string }[] = [];

    const matches = Array.from(text.matchAll(IMAGE_EMBED));
    for (const m of matches) {
      const [md, linkPath, size] = m;
      const imageFile = this.app.metadataCache.getFirstLinkpathDest(
        linkPath,
        file.path
      );
      if (!(imageFile instanceof TFile)) continue;

      const buffer = await this.app.vault.readBinary(imageFile);
      const dataBase64 = arrayBufferToBase64(buffer);

      uploads.push({
        ankiFileName: imageFile.name,
        dataBase64,
      });

      const tag = size
        ? `<img src="${imageFile.name}" width="${size}">`
        : `<img src="${imageFile.name}">`;
      out = out.replace(md, tag);
    }

    return { content: out, mediaToUpload: uploads };
  }

  private convertLatexDelimiters(text: string): string {
    let tmp = text.replace(BLOCK_LATEX, '\\[$1\\]');
    return tmp.replace(INLINE_LATEX, '\\($1\\)');
  }

  private convertMarkdownBoldToHtml(text: string): string {
    // Convert Markdown bold (**text**) to HTML bold (<b>text</b>)
    return text.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');
  }

  async syncFile(file: TFile, silent = false): Promise<number[]> {
    // Check AnkiConnect availability before syncing
    if (!(await this.anki.verifyConnection())) {
      new Notice('AnkiConnect is not available. Please make sure Anki is running and AnkiConnect is installed.');
      return [];
    }

    if (!silent) new Notice(`Syncing ${file.basename}...`);
    const orig = await this.app.vault.read(file);
    const { notes, deckName } = this.parseNotesFromContent(orig, file);
    if (!deckName) {
      if (!silent) new Notice(`No #anki/deck tag found in ${file.basename}. Skipping.`);
      return [];
    }
    await this.anki.createDeck(deckName);

    const existingIds: number[] = [];
    for (const m of orig.matchAll(NOTE_ID_COMMENT_GLOBAL)) existingIds.push(+m[1]);

    const lines = orig.split('\n');
    let offset = 0;
    const newIds: number[] = [];

    for (const note of notes) {
      // Media
      const frontMed = await this.processMedia(note.front, file);
      const backMed = await this.processMedia(note.back, file);
      for (const u of [...frontMed.mediaToUpload, ...backMed.mediaToUpload]) {
        await this.anki.storeMediaBase64(u.ankiFileName, u.dataBase64);
      }

      // LaTeX
      let frontHtml = this.convertLatexDelimiters(frontMed.content);
      let backHtml = this.convertLatexDelimiters(backMed.content);

      // Convert Markdown bold to HTML bold
      frontHtml = this.convertMarkdownBoldToHtml(frontHtml);
      backHtml = this.convertMarkdownBoldToHtml(backHtml);

      // Obsidian-Link
      const vault = this.app.vault.getName();
      const url = `obsidian://open?vault=${encodeURIComponent(vault)}&file=${encodeURIComponent(
        file.path
      )}`;
      backHtml += `<br><small><a href="${url}" style="text-decoration:none;color:grey;font-size:0.8em;">Obsidian Note</a></small>`;

      const fields = { Front: frontHtml, Back: backHtml };

      if (note.noteId) {
        await this.anki.updateNote(note.noteId, fields);
        newIds.push(note.noteId);
        const info = await this.anki.fetchCardInfo([note.noteId]);
        if (info[0]?.deckName !== deckName) {
          await this.anki.changeDeck([note.noteId], deckName);
        }
      } else {
        const created = await this.anki.addNote(deckName, DEFAULT_MODEL, fields);
        if (created) {
          newIds.push(created);
          lines.splice(note.endLine + 1 + offset, 0, `<!--ANKI_NOTE_ID:${created}-->`);
          offset++;
        }
      }
    }

    // Remove old IDs and Anki-Cards
    const toDelete = existingIds.filter(id => !newIds.includes(id));
    if (toDelete.length) {
      await this.anki.deleteNotes(toDelete);
      for (const id of toDelete) {
        const commentLine = `<!--ANKI_NOTE_ID:${id}-->`;
        const idx = lines.findIndex(l => l.trim() === commentLine);
        if (idx !== -1) {
          lines.splice(idx, 1);
          if (idx < notes.length) offset--;
        }
      }
    }

    const updated = lines.join('\n');
    if (updated !== orig) {
      await this.app.vault.modify(file, updated);
    }
    if (!silent) new Notice(`${file.basename} synced.`);
    return newIds;
  }

  async syncVault(): Promise<void> {
    // Check AnkiConnect availability before vault sync
    if (!(await this.anki.verifyConnection())) {
      new Notice('AnkiConnect is not available. Please make sure Anki is running and AnkiConnect is installed.');
      return;
    }

    new Notice('Starting vault sync. This may take a while...');
    const files = this.app.vault.getMarkdownFiles();
    for (const f of files) {
      try {
        await this.syncFile(f, true);
      } catch (e) {
        console.error(`Error in vault sync for ${f.path}:`, e);
        new Notice(`Error syncing ${f.basename}. See console for Details.`);
      }
    }
    new Notice('Vault sync complete.');
  }

  async unSyncFile(file: TFile, silent = false): Promise<void> {
    // Check AnkiConnect availability before syncing
    if (!(await this.anki.verifyConnection())) {
      new Notice('AnkiConnect is not available. Please make sure Anki is running and AnkiConnect is installed.');
      return;
    }

    if (!silent) new Notice(`Unsyncing ${file.basename}...`);
    const orig = await this.app.vault.read(file);
    const existingIds: number[] = [];
    for (const m of orig.matchAll(NOTE_ID_COMMENT_GLOBAL)) existingIds.push(+m[1]);
    const lines = orig.split('\n');

    // Remove all IDs and Anki-Cards
    if (existingIds.length) {
      await this.anki.deleteNotes(existingIds);
      for (const id of existingIds) {
        const commentLine = `<!--ANKI_NOTE_ID:${id}-->`;
        const idx = lines.findIndex(l => l.trim() === commentLine);
        if (idx !== -1) {
          lines.splice(idx, 1);
        }
      }
    }

    const updated = lines.join('\n');
    if (updated !== orig) {
      await this.app.vault.modify(file, updated);
    }
    if (!silent) new Notice(`${file.basename} successfully unsynced`);
    return;
  }
}

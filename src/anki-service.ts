import { Notice, TFile, App } from 'obsidian';

const ANKI_CONNECT_URL = 'http://127.0.0.1:8765';
const MANAGED_NOTE_TAG = 'obsidian_simple_anki_sync_created';

async function sendRequest(action: string, params: any = {}): Promise<any> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.addEventListener('error', () =>
      reject(new Error('Failed to issue request to AnkiConnect. Is Anki running?'))
    );
    xhr.addEventListener('load', () => {
      try {
        const resp = JSON.parse(xhr.responseText);
        if (resp.error) {
          console.error('AnkiConnect Error:', resp.error);
          reject(new Error(`AnkiConnect error: ${resp.error}`));
        } else {
          resolve(resp.result);
        }
      } catch (err) {
        console.error('Failed to parse AnkiConnect response:', err);
        reject(new Error('Failed to parse AnkiConnect response.'));
      }
    });
    xhr.open('POST', ANKI_CONNECT_URL);
    xhr.send(JSON.stringify({ action, version: 6, params }));
  });
}

export class AnkiService {
  constructor(private app: App) {}

  async verifyConnection(): Promise<boolean> {
    try {
      await sendRequest('requestPermission');
      const decks = await sendRequest('deckNames');
      return Array.isArray(decks);
    } catch (err) {
      new Notice('AnkiConnect connection failed. Is Anki open with AnkiConnect installed?');
      console.error('verifyConnection error:', err);
      return false;
    }
  }

  async fetchDecks(): Promise<string[]> {
    try {
      return await sendRequest('deckNames');
    } catch (err) {
      new Notice('Failed to retrieve deck list from Anki.');
      console.error(err);
      return [];
    }
  }

  async createDeck(name: string): Promise<void> {
    try {
      await sendRequest('createDeck', { deck: name });
    } catch (err) {
      if (err instanceof Error && err.message.includes('deck already exists')) return;
      new Notice(`Could not create deck "${name}".`);
      console.error(err);
    }
  }

  async addNote(
    deck: string,
    model: string,
    fields: Record<string, string>,
    tags: string[] = []
  ): Promise<number | null> {
    try {
      const allTags = [...tags, MANAGED_NOTE_TAG];
      const result = await sendRequest('addNote', {
        note: { deckName: deck, modelName: model, fields, tags: allTags },
      });
      if (typeof result === 'number') return result;
      new Notice('AnkiConnect did not return a valid note ID.');
      return null;
    } catch (err) {
      new Notice(`Failed to add note: ${err instanceof Error ? err.message : err}`);
      console.error(err);
      return null;
    }
  }

  async updateNote(noteId: number, fields: Record<string, string>): Promise<void> {
    try {
      await sendRequest('updateNoteFields', {
        note: { id: noteId, fields },
      });
      // Ensure our tag persists
      const infos = await this.fetchNotesInfo([noteId]);
      if (infos[0] && !infos[0].tags.includes(MANAGED_NOTE_TAG)) {
        await sendRequest('updateNoteTags', {
          note: noteId,
          tags: [...infos[0].tags, MANAGED_NOTE_TAG],
        });
      }
    } catch (err) {
      new Notice(`Failed to update note ${noteId}: ${err}`);
      console.error(err);
    }
  }

  async deleteNotes(ids: number[]): Promise<void> {
    if (!ids.length) return;
    try {
      await sendRequest('deleteNotes', { notes: ids });
      new Notice(`Deleted ${ids.length} note(s) from Anki.`);
    } catch (err) {
      new Notice(`Could not delete notes: ${err}`);
      console.error(err);
    }
  }

  async fetchNotesInfo(ids: number[]): Promise<Array<{ noteId: number; fields: any; modelName: string; tags: string[] }>> {
    if (!ids.length) return [];
    try {
      return await sendRequest('notesInfo', { notes: ids });
    } catch (err) {
      new Notice('Failed to fetch note info from Anki.');
      console.error(err);
      return [];
    }
  }

  async findManagedNotes(): Promise<number[]> {
    try {
      const result = await sendRequest('findNotes', { query: `tag:${MANAGED_NOTE_TAG}` });
      return Array.isArray(result) ? result : [];
    } catch (err) {
      new Notice('Could not find managed notes in Anki.');
      console.error(err);
      return [];
    }
  }

  async changeDeck(cardIds: number[], deckName: string): Promise<boolean> {
    try {
      const ok = await sendRequest('changeDeck', { cards: cardIds, deck: deckName });
      return ok === true;
    } catch (err) {
      new Notice(`Failed to move card(s): ${err}`);
      console.error(err);
      return false;
    }
  }

  async fetchCardInfo(cardIds: number[]): Promise<Array<{ deckName: string }>> {
    try {
      return await sendRequest('cardsInfo', { cards: cardIds });
    } catch (err) {
      new Notice(`cardsInfo error: ${err}`);
      console.error(err);
      return [];
    }
  }

  async storeMedia(filename: string, path: string): Promise<string | null> {
    try {
      const result = await sendRequest('storeMediaFile', { filename, path });
      return typeof result === 'string' ? result : filename;
    } catch (err) {
      new Notice(`Failed to store media "${filename}": ${err}`);
      console.error(err);
      return null;
    }
  }

  resolveAbsolutePath(vaultPath: string): string | null {
    const file = this.app.vault.getAbstractFileByPath(vaultPath);
    if (file instanceof TFile) {
      // @ts-ignore
      return this.app.vault.adapter.getFullPath(file.path);
    }
    console.warn(`File not found in vault: ${vaultPath}`);
    return null;
  }
}

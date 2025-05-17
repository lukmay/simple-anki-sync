export interface AnkiNote {
  noteId?: number;
  front: string;
  back: string;
  deckName: string;
}

export interface ObsidianNote {
  sourceId: string;
  front: string;
  back: string;
  noteId?: number;
  startLine: number;
  endLine: number;
}

export interface ProcessedMediaResult {
  content: string;
  mediaToUpload: {
    ankiFileName: string;
    dataBase64:   string;
  }[];
}
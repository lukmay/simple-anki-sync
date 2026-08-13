const ENCODED_SPACE = /--/g;

export function decodeDeckTag(tag: string): string {
  return tag
    .split('/')
    .map((segment) => segment.replace(ENCODED_SPACE, ' '))
    .join('::');
}

import { TFile } from 'obsidian';

const SCALE = 1.5;

type Fragment = { kind: 'group' | 'area' | 'frame' | 'clippedframe'; id: string };

type Rect = { topX: number; topY: number; width: number; height: number };

function getEa(): any | null {
  return (window as any).ExcalidrawAutomate ?? null;
}

export function isExcalidrawFile(file: TFile): boolean {
  const ea = getEa();
  return !!ea && ea.isExcalidrawFile(file);
}

// Parses subpaths like "#^group=abc", "#^area=xyz", "#^frame=..." or "#^clippedframe=...".
// Returns null for anything else (including plain block refs).
function parseFragment(subpath: string): Fragment | null {
  if (!subpath) return null;
  const match = subpath.replace(/^#/, '').match(/^\^?(group|area|frame|clippedframe)=(.+)$/i);
  if (!match) return null;
  return { kind: match[1].toLowerCase() as Fragment['kind'], id: match[2] };
}

function rectsOverlap(a: Rect, b: Rect): boolean {
  return !(
    a.topX + a.width < b.topX ||
    b.topX + b.width < a.topX ||
    a.topY + a.height < b.topY ||
    b.topY + b.height < a.topY
  );
}

// Returns the scene elements to render for the given fragment, or null if the fragment
// target cannot be resolved. Area filtering is bbox-overlap — it may overshoot for
// shapes crossing the boundary, but avoids empty renders.
function filterElements(elements: any[], fragment: Fragment, ea: any): any[] | null {
  const target =
    elements.find((e) => e.id === fragment.id) ??
    ((fragment.kind === 'frame' || fragment.kind === 'clippedframe')
      ? elements.find((e) => e.type === 'frame' && e.name === fragment.id)
      : undefined);
  if (!target) return null;

  switch (fragment.kind) {
    case 'group': {
      const groups: string[] = target.groupIds ?? [];
      if (!groups.length) return [target];
      const groupSet = new Set(groups);
      return elements.filter((e) => (e.groupIds ?? []).some((g: string) => groupSet.has(g)));
    }
    case 'frame':
    case 'clippedframe':
      return elements.filter((e) => e.frameId === target.id || e.id === target.id);
    case 'area': {
      const bounds = ea.getBoundingBox([target]);
      return elements.filter(
        (e) => e.id === target.id || rectsOverlap(bounds, ea.getBoundingBox([e]))
      );
    }
  }
}

// Renders an Excalidraw file (or a fragment of it) to a PNG blob. If `subpath` names
// a known fragment that resolves, only those elements are rendered; otherwise the
// whole file is rendered.
//
// Returns `{ blob, fragmentSuffix }` — the suffix is appended to the Anki filename
// so different fragments of the same file get distinct media keys.
export async function renderExcalidrawPng(
  file: TFile,
  subpath: string
): Promise<{ blob: Blob; fragmentSuffix: string }> {
  const ea = getEa();
  if (!ea) throw new Error('ExcalidrawAutomate not available');

  const fragment = parseFragment(subpath);
  if (fragment) {
    const scene = await ea.getSceneFromFile(file);
    const elements = scene?.elements ?? [];
    const filtered = filterElements(elements, fragment, ea);
    if (filtered && filtered.length) {
      ea.reset();
      ea.copyViewElementsToEAforEditing(filtered);
      const blob: Blob = await ea.createPNG(undefined, SCALE);
      const safeId = fragment.id.replace(/[^a-zA-Z0-9_-]/g, '');
      return { blob, fragmentSuffix: `_${fragment.kind}_${safeId}` };
    }
    console.warn(
      `Simple Anki Sync: Excalidraw fragment "${subpath}" not found in ${file.path}; falling back to full file.`
    );
  }

  const blob: Blob = await ea.createPNG(file.path, SCALE);
  return { blob, fragmentSuffix: '' };
}

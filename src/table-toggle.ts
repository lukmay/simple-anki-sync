import { Plugin } from 'obsidian';
import { SimpleAnkiSyncSettings } from './settings';

const STYLE_ID = 'single-column-toggle-table-style';
const DATA_APPLIED = 'rowToggleApplied';
const CLASS_TABLE = 'row-toggle-table';
const CLASS_COLLAPSED = 'is-collapsed';
const CLASS_TRIGGER = 'row-toggle-trigger';
const CLASS_BUTTON = 'row-toggle-button';
const CLASS_TEXT = 'row-toggle-text';
const CLASS_EDITING = 'is-editing';
const MARKDOWN_VIEW_SELECTOR = '.markdown-preview-view, .markdown-source-view.mod-cm6';
const EDITABLE_CELL_SELECTOR = 'td, th';
const TOGGLE_LABEL = 'Toggle answer row';

const STYLES = `
.markdown-rendered table.${CLASS_TABLE} .${CLASS_TRIGGER} {
  position: relative;
  padding-left: 1.2em !important;
}

/* Reading view can override table cell padding; enforce spacing there only. */
.markdown-reading-view .markdown-rendered table.${CLASS_TABLE} .${CLASS_TRIGGER} {
  padding-left: 1.2em !important;
}

.markdown-source-view.mod-cm6 .cm-table-widget table.${CLASS_TABLE} .${CLASS_TRIGGER} {
  position: relative;
  padding-left: 1.2em;
}

.markdown-rendered table.${CLASS_TABLE} .${CLASS_BUTTON} {
  all: unset;
  position: absolute;
  top: 50%;
  left: 0.35em;
  transform: translateY(-50%);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.1em;
  height: 1.1em;
  line-height: 1;
  cursor: pointer;
  z-index: 1;
}

.markdown-rendered table.${CLASS_TABLE} .${CLASS_TEXT} {
  display: block;
  padding-left: 0 !important;
}

.markdown-reading-view .markdown-rendered table.${CLASS_TABLE} .${CLASS_TEXT} {
  padding-left: 0 !important;
}

.markdown-rendered table.${CLASS_TABLE} .${CLASS_BUTTON}::before {
  content: ">";
}

.markdown-rendered table.${CLASS_TABLE}:not(.${CLASS_COLLAPSED}) .${CLASS_BUTTON}::before {
  content: "v";
}

.markdown-rendered table.${CLASS_TABLE} .${CLASS_BUTTON}:focus-visible {
  outline: 1px solid var(--text-accent, currentColor);
  border-radius: var(--radius-s, 4px);
  outline-offset: 2px;
}

.markdown-rendered table.${CLASS_TABLE}.${CLASS_COLLAPSED} tbody tr {
  display: none;
}

.markdown-rendered table.${CLASS_TABLE} th,
.markdown-rendered table.${CLASS_TABLE} td,
.markdown-source-view.mod-cm6 .cm-table-widget table.${CLASS_TABLE} th,
.markdown-source-view.mod-cm6 .cm-table-widget table.${CLASS_TABLE} td {
  overflow-wrap: anywhere;
}

.markdown-rendered .table-wrapper:has(table.${CLASS_TABLE}),
.markdown-source-view.mod-cm6 .cm-table-widget:has(table.${CLASS_TABLE}) {
  overflow-x: hidden;
  overflow-x: clip;
}

.markdown-source-view.mod-cm6 .cm-table-widget table.${CLASS_TABLE} .${CLASS_TEXT} {
  padding-left: 0;
}

.markdown-source-view.mod-cm6 .cm-table-widget table.${CLASS_TABLE} th .cm-line {
  padding-left: 0 !important;
}

.markdown-source-view.mod-cm6 .cm-table-widget table.${CLASS_TABLE} th.${CLASS_EDITING} .cm-line {
  padding-left: 0 !important;
}
`;

const stopEvent = (event: Event) => {
  event.preventDefault();
  event.stopPropagation();
};

export class TableToggleManager {
  private settings: SimpleAnkiSyncSettings;
  private observer: MutationObserver | null = null;

  constructor(settings: SimpleAnkiSyncSettings) {
    this.settings = settings;
  }

  updateSettings(settings: SimpleAnkiSyncSettings): void {
    this.settings = settings;
  }

  registerMarkdownPostProcessor(plugin: Plugin): void {
    plugin.registerMarkdownPostProcessor((el) => this.decorateTables(el));
  }

  onLoad(): void {
    this.startDomObserver();
    this.applySettings();
  }

  onUnload(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    this.removeToggleDecorations(document.body);
    this.removeStyles();
  }

  applySettings(): void {
    if (!document.body) return;

    if (this.settings.enableAnswerToggle) {
      this.injectStyles();
      this.decorateTables(document.body);
      this.setAllTablesCollapsed(this.settings.defaultCollapsed, document.body);
    } else {
      this.removeToggleDecorations(document.body);
      this.removeStyles();
    }
  }

  setTablesCollapsedInScope(container: HTMLElement, collapsed: boolean): void {
    this.decorateTables(container);
    this.setAllTablesCollapsed(collapsed, container);
  }

  private injectStyles(): void {
    if (document.getElementById(STYLE_ID)) {
      return;
    }

    const styleElement = document.createElement('style');
    styleElement.id = STYLE_ID;
    styleElement.textContent = STYLES;
    document.head.appendChild(styleElement);
  }

  private removeStyles(): void {
    const styleElement = document.getElementById(STYLE_ID);
    if (styleElement) {
      styleElement.remove();
    }
  }

  private startDomObserver(): void {
    if (!document.body || this.observer) {
      return;
    }

    this.observer = new MutationObserver((mutations) => {
      if (!this.settings.enableAnswerToggle) {
        return;
      }

      for (const mutation of mutations) {
        for (const node of Array.from(mutation.addedNodes)) {
          this.decorateTables(node);
        }
      }
    });

    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  private decorateTables(container: Node): void {
    if (!this.settings.enableAnswerToggle) {
      return;
    }

    if (!(container instanceof HTMLElement)) {
      return;
    }

    const tables = container instanceof HTMLTableElement
      ? [container]
      : Array.from(container.querySelectorAll('table'));

    for (const table of tables) {
      if (table instanceof HTMLTableElement) {
        this.decorateTable(table);
      }
    }
  }

  private decorateTable(table: HTMLTableElement): void {
    if (table.dataset[DATA_APPLIED] === 'true') {
      return;
    }

    if (!this.isInsideMarkdownView(table) || !this.isTargetTable(table)) {
      return;
    }

    const headerCell = table.tHead?.rows?.[0]?.cells?.[0];
    if (!headerCell) {
      return;
    }

    table.dataset[DATA_APPLIED] = 'true';
    table.classList.add(CLASS_TABLE);

    headerCell.classList.add(CLASS_TRIGGER);
    headerCell.style.setProperty('padding-left', '1.2em', 'important');

    const textWrapper = this.wrapHeaderText(headerCell);
    textWrapper.style.setProperty('padding-left', '0', 'important');
    textWrapper.style.setProperty('margin-left', '0', 'important');
    textWrapper.style.setProperty('display', 'block', 'important');
    const toggleButton = this.createToggleButton();
    headerCell.insertBefore(toggleButton, textWrapper);
    this.ensureToggleSpacing(headerCell, textWrapper, toggleButton);

    const toggle = () => {
      this.setTableCollapsed(table, !table.classList.contains(CLASS_COLLAPSED));
    };

    toggleButton.addEventListener('click', (event) => {
      stopEvent(event);
      toggle();
    });
    toggleButton.addEventListener('pointerdown', stopEvent);
    toggleButton.addEventListener('mousedown', stopEvent);

    this.bindEditingState(table, headerCell);
    this.setTableCollapsed(table, this.settings.defaultCollapsed);
  }


  private wrapHeaderText(cell: HTMLTableCellElement): HTMLSpanElement {
    const existing = cell.querySelector(`:scope > .${CLASS_TEXT}`);
    if (existing instanceof HTMLSpanElement) {
      return existing;
    }

    const wrapper = document.createElement('span');
    wrapper.className = CLASS_TEXT;
    while (cell.firstChild) {
      wrapper.appendChild(cell.firstChild);
    }
    cell.appendChild(wrapper);
    return wrapper;
  }

  private unwrapHeaderText(cell: HTMLTableCellElement): void {
    const wrapper = cell.querySelector(`:scope > .${CLASS_TEXT}`);
    if (!(wrapper instanceof HTMLSpanElement)) {
      return;
    }

    while (wrapper.firstChild) {
      cell.insertBefore(wrapper.firstChild, wrapper);
    }
    wrapper.remove();
  }

  private createToggleButton(): HTMLButtonElement {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = CLASS_BUTTON;
    button.setAttribute('aria-label', TOGGLE_LABEL);
    button.setAttribute('aria-expanded', 'false');
    return button;
  }

  private ensureToggleSpacing(
    headerCell: HTMLTableCellElement,
    textWrapper: HTMLSpanElement,
    toggleButton: HTMLButtonElement
  ): void {
    const applySpacing = () => {
      if (!headerCell.isConnected) return;

      const buttonRect = toggleButton.getBoundingClientRect();
      const textRect = textWrapper.getBoundingClientRect();
      if (buttonRect.width === 0 || textRect.width === 0) return;

      const fontSize = Number.parseFloat(getComputedStyle(headerCell).fontSize || '16');
      const desiredGapPx = fontSize * 0.25;
      const desiredLeft = buttonRect.right + desiredGapPx;
      const currentLeft = textRect.left;

      if (currentLeft >= desiredLeft - 0.5) {
        return;
      }

      const currentMargin = Number.parseFloat(getComputedStyle(textWrapper).marginLeft || '0');
      const delta = desiredLeft - currentLeft;
      const nextMargin = currentMargin + delta;
      textWrapper.style.setProperty('margin-left', `${nextMargin}px`, 'important');
    };

    requestAnimationFrame(applySpacing);
  }

  private bindEditingState(table: HTMLTableElement, headerCell: HTMLTableCellElement): void {
    const updateEditingState = () => {
      const active = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      const activeCell = active?.closest(EDITABLE_CELL_SELECTOR) ?? null;
      headerCell.classList.toggle(CLASS_EDITING, activeCell === headerCell);
    };

    table.addEventListener('focusin', updateEditingState);
    table.addEventListener('focusout', () => {
      setTimeout(updateEditingState, 0);
    });
  }

  private setTableCollapsed(table: HTMLTableElement, collapsed: boolean): void {
    table.classList.toggle(CLASS_COLLAPSED, collapsed);
    const button = table.querySelector(`.${CLASS_BUTTON}`) as HTMLButtonElement | null;
    if (button) {
      button.setAttribute('aria-expanded', String(!collapsed));
    }
  }

  private setAllTablesCollapsed(collapsed: boolean, container: HTMLElement): void {
    const tables = Array.from(container.querySelectorAll(`table.${CLASS_TABLE}`)) as HTMLTableElement[];
    for (const table of tables) {
      this.setTableCollapsed(table, collapsed);
    }
  }

  private removeToggleDecorations(container: HTMLElement | null): void {
    if (!container) {
      return;
    }

    const tables = Array.from(container.querySelectorAll(`table.${CLASS_TABLE}`)) as HTMLTableElement[];
    for (const table of tables) {
      table.classList.remove(CLASS_TABLE, CLASS_COLLAPSED);
      delete table.dataset[DATA_APPLIED];

      const headerCell = table.tHead?.rows?.[0]?.cells?.[0];
      if (headerCell) {
        headerCell.classList.remove(CLASS_TRIGGER, CLASS_EDITING);
        const button = headerCell.querySelector(`.${CLASS_BUTTON}`);
        if (button) {
          button.remove();
        }
        this.unwrapHeaderText(headerCell);
      }
    }
  }

  private isInsideMarkdownView(table: HTMLTableElement): boolean {
    return Boolean(table.closest(MARKDOWN_VIEW_SELECTOR));
  }

  private isTargetTable(table: HTMLTableElement): boolean {
    if (!table.tHead || table.tHead.rows.length !== 1) {
      return false;
    }

    const headRow = table.tHead.rows[0];
    if (headRow.cells.length !== 1) {
      return false;
    }

    const body = table.tBodies[0];
    if (!body || body.rows.length !== 1) {
      return false;
    }

    return body.rows[0].cells.length === 1;
  }
}

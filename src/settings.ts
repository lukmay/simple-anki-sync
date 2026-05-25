import { AbstractInputSuggest, App, Plugin, PluginSettingTab, Setting } from 'obsidian';
import { AnkiService } from './anki-service';

export interface SimpleAnkiSyncSettings {
  enableAnswerToggle: boolean;
  defaultCollapsed: boolean;
  defaultModel: string;
}

export const DEFAULT_SETTINGS: SimpleAnkiSyncSettings = {
  enableAnswerToggle: true,
  defaultCollapsed: true,
  defaultModel: 'Basic',
};

export interface SettingsHost {
  settings: SimpleAnkiSyncSettings;
  anki: AnkiService;
  saveSettings(): Promise<void>;
  applyRowToggleSettings(): void;
}

class ModelNameSuggest extends AbstractInputSuggest<string> {
  private models: string[] = [];
  private readonly el: HTMLInputElement;

  constructor(app: App, inputEl: HTMLInputElement, anki: AnkiService) {
    super(app, inputEl);
    this.el = inputEl;
    void anki.getModelNames().then(m => { this.models = m; }).catch(() => {});
  }

  protected getSuggestions(query: string): string[] {
    const q = query.toLowerCase();
    return this.models.filter(m => m.toLowerCase().includes(q));
  }

  renderSuggestion(value: string, el: HTMLElement): void {
    el.setText(value);
  }

  selectSuggestion(value: string): void {
    this.setValue(value);
    this.el.trigger('input');
    this.close();
  }
}

export class SimpleAnkiSyncSettingTab extends PluginSettingTab {
  private plugin: SettingsHost;

  constructor(app: App, plugin: SettingsHost & Plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    containerEl.createEl('h2', { text: 'Simple Anki Sync' });

    new Setting(containerEl)
      .setName('Default note type')
      .setDesc('Note type used for newly created cards. Only types with "Front" and "Back" fields are supported. Existing cards keep their original note type. Connect Anki to get autocomplete suggestions.')
      .addText(text => {
        text
          .setPlaceholder('Basic')
          .setValue(this.plugin.settings.defaultModel)
          .onChange(async (value) => {
            this.plugin.settings.defaultModel = value.trim() || 'Basic';
            await this.plugin.saveSettings();
          });
        new ModelNameSuggest(this.app, text.inputEl, this.plugin.anki);
      });

    new Setting(containerEl)
      .setName('Enable answer table toggles')
      .setDesc('Allow collapsing/expanding single-column Anki tables in preview and source view.')
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.enableAnswerToggle)
          .onChange(async (value) => {
            this.plugin.settings.enableAnswerToggle = value;
            await this.plugin.saveSettings();
            this.plugin.applyRowToggleSettings();
            this.display();
          })
      );

    new Setting(containerEl)
      .setName('Collapse tables by default')
      .setDesc('When enabled, newly rendered single-column Anki tables start collapsed.')
      .addToggle((toggle) => {
        toggle
          .setValue(this.plugin.settings.defaultCollapsed)
          .setDisabled(!this.plugin.settings.enableAnswerToggle)
          .onChange(async (value) => {
            this.plugin.settings.defaultCollapsed = value;
            await this.plugin.saveSettings();
            this.plugin.applyRowToggleSettings();
          });
      });
  }
}

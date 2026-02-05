import { App, Plugin, PluginSettingTab, Setting } from 'obsidian';

export interface SimpleAnkiSyncSettings {
  enableAnswerToggle: boolean;
  defaultCollapsed: boolean;
}

export const DEFAULT_SETTINGS: SimpleAnkiSyncSettings = {
  enableAnswerToggle: true,
  defaultCollapsed: true,
};

export interface SettingsHost {
  settings: SimpleAnkiSyncSettings;
  saveSettings(): Promise<void>;
  applyRowToggleSettings(): void;
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

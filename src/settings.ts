import { App, PluginSettingTab, Setting } from "obsidian";
import PersonalFinancePlugin from "./main";

export interface FinancePluginSettings {
	// Future settings can be added here
}

export const DEFAULT_SETTINGS: FinancePluginSettings = {
}

export class FinanceSettingTab extends PluginSettingTab {
	plugin: PersonalFinancePlugin;

	constructor(app: App, plugin: PersonalFinancePlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();
		containerEl.createEl('h2', { text: 'Personal Finance Settings' });
		containerEl.createEl('p', { text: 'Settings for the finance dashboard plugin.' });
	}
}

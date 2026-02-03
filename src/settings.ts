import { App, PluginSettingTab, Setting } from "obsidian";
import PersonalFinancePlugin from "./main";

export interface CommodityPrice {
	value: number;
	currency: '₹' | '$';
}

export interface FinancePluginSettings {
	currencySymbol: '₹' | '$';
	commodityPrices: Record<string, CommodityPrice>;
	usdToInr: number;
	tableRowsToShow: number;
	snapshotsFolderPath: string;
}

export const DEFAULT_SETTINGS: FinancePluginSettings = {
	currencySymbol: '₹',
	commodityPrices: {},
	usdToInr: 83.0,
	tableRowsToShow: 10,
	snapshotsFolderPath: 'transaction-snapshots'
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

		new Setting(containerEl)
			.setName('Currency Symbol')
			.setDesc('Select the currency symbol to use throughout the plugin')
			.addDropdown(dropdown => dropdown
				.addOption('₹', '₹ (Rupee)')
				.addOption('$', '$ (Dollar)')
				.setValue(this.plugin.settings.currencySymbol)
				.onChange(async (value: '₹' | '$') => {
					this.plugin.settings.currencySymbol = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('USD to INR Conversion Rate')
			.setDesc('Current exchange rate for converting USD to INR')
			.addText(text => text
				.setPlaceholder('83.0')
				.setValue(this.plugin.settings.usdToInr.toString())
				.onChange(async (value) => {
					const parsed = parseFloat(value);
					if (!isNaN(parsed) && parsed > 0) {
						this.plugin.settings.usdToInr = parsed;
						await this.plugin.saveSettings();
					}
				}));

		new Setting(containerEl)
			.setName('Table Rows to Display')
			.setDesc('Number of transaction rows to show in the table view')
			.addText(text => text
				.setPlaceholder('10')
				.setValue(this.plugin.settings.tableRowsToShow.toString())
				.onChange(async (value) => {
					const parsed = parseInt(value);
					if (!isNaN(parsed) && parsed > 0) {
						this.plugin.settings.tableRowsToShow = parsed;
						await this.plugin.saveSettings();
					}
				}));

		new Setting(containerEl)
			.setName('Snapshots Folder Path')
			.setDesc('Folder path where snapshots will be saved (relative to vault root)')
			.addText(text => text
				.setPlaceholder('transaction-snapshots')
				.setValue(this.plugin.settings.snapshotsFolderPath)
				.onChange(async (value) => {
					this.plugin.settings.snapshotsFolderPath = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Commodity Prices')
			.setDesc('Configure commodity prices in JSON format. Example: {"QCOM": {"value": 150.50, "currency": "$"}}')
			.addTextArea(text => text
				.setPlaceholder('{"QCOM": {"value": 150.50, "currency": "$"}}')
				.setValue(JSON.stringify(this.plugin.settings.commodityPrices, null, 2))
				.onChange(async (value) => {
					try {
						const parsed = JSON.parse(value);
						this.plugin.settings.commodityPrices = parsed;
						await this.plugin.saveSettings();
					} catch (e) {
						// Invalid JSON, don't save
					}
				}));
	}
}

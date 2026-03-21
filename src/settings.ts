import { App, PluginSettingTab, Setting } from "obsidian";
import PersonalFinancePlugin from "./main";

// eslint-disable obsidianmd/ui/sentence-case -- These are file paths and explicit descriptors that must strictly preserve their exact casing
const ROOT_FINANCE_PATH = 'Finance';
const FINANCE_TRANSACTIONS_PATH = 'Finance/Transactions';
const FINANCE_SNAPSHOTS_PATH = 'Finance/Snapshots';
const TEMPLATE_FILE_PATH = 'Finance/Templates/Transaction.md';
const USAGE_GUIDE_PATH = 'Finance/Personal-finances-usage-guide.md';
const FINANCE_BASE_PATH = 'Finance/Finances.base';

const DESC_TEMPLATE = 'Path to the markdown file used as a template for new transactions';
const DESC_BASE = 'Path to the Finance.base file to open from the ribbon';
// eslint-enable obsidianmd/ui/sentence-case

export interface CommodityPrice {
	value: number;
	currency: '₹' | '$';
}

export interface FinancePluginSettings {
	currencySymbol: '₹' | '$';
	commodityPrices: Record<string, CommodityPrice>;
	usdToInr: number;
	tableRowsToShow: number;
	rootFolderPath: string;
	transactionsFolderPath: string;
	snapshotsFolderPath: string;
	templateFilePath: string;
	usageGuideFilePath: string;
	dashboardDataPath: string;
	financeBasePath: string;
	blockchainEnabled: boolean;
}

export const DEFAULT_SETTINGS: FinancePluginSettings = {
	currencySymbol: '₹',
	commodityPrices: {},
	usdToInr: 83.0,
	tableRowsToShow: 10,
	rootFolderPath: 'Finance',
	transactionsFolderPath: 'Finance/Transactions',
	snapshotsFolderPath: 'Finance/Snapshots',
	templateFilePath: 'Finance/Templates/Transaction.md',
	usageGuideFilePath: 'Finance/Personal-finances-usage-guide.md',
	dashboardDataPath: 'Finance/dashboard-data.json',
	financeBasePath: 'Finance/Finances.base',
	blockchainEnabled: true,
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

		new Setting(containerEl).setHeading().setName('Personal finance settings');

		// General & Currency Section
		new Setting(containerEl).setHeading().setName('General & currency');

		new Setting(containerEl)
			.setName('Currency symbol')
			.setDesc('Select the currency symbol to use throughout the plugin')
			.addDropdown(dropdown => dropdown
				.addOption('₹', '₹ (rupee)')
				.addOption('$', '$ (dollar)')
				.setValue(this.plugin.settings.currencySymbol)
				.onChange(async (value: '₹' | '$') => {
					this.plugin.settings.currencySymbol = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Usd to inr conversion rate')
			.setDesc('Current exchange rate for converting usd to inr')
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
			.setName('Commodity prices')
			.setDesc('Configure commodity prices in JSON format. Example: {"QCOM": {"value": 150.50, "currency": "$"}}')
			.addTextArea(text => {
				text
					.setPlaceholder('{"QCOM": {"value": 150.50, "currency": "$"}}')
					.setValue(JSON.stringify(this.plugin.settings.commodityPrices, null, 2))
					.onChange(async (value) => {
						try {
							const parsed = JSON.parse(value) as Record<string, CommodityPrice>;
							this.plugin.settings.commodityPrices = parsed;
							await this.plugin.saveSettings();
						} catch {
							// Invalid JSON, don't save
						}
					});
				text.inputEl.rows = 10;
				text.inputEl.addClass('finance-textarea-full');
			});

		new Setting(containerEl)
			.setName('Table rows to display')
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

		// File & Folder Structure Section
		new Setting(containerEl).setHeading().setName('File & folder structure');

		new Setting(containerEl)
			.setName('Root finance folder')
			.setDesc('Root folder for all finance related files')
			.addText(text => text
				.setPlaceholder(ROOT_FINANCE_PATH)
				.setValue(this.plugin.settings.rootFolderPath)
				.onChange(async (value) => {
					this.plugin.settings.rootFolderPath = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Transactions folder path')
			.setDesc('Folder where new transaction files will be created')
			.addText(text => text
				.setPlaceholder(FINANCE_TRANSACTIONS_PATH)
				.setValue(this.plugin.settings.transactionsFolderPath)
				.onChange(async (value) => {
					this.plugin.settings.transactionsFolderPath = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Snapshots folder path')
			.setDesc('Folder where net worth snapshots will be saved')
			.addText(text => text
				.setPlaceholder(FINANCE_SNAPSHOTS_PATH)
				.setValue(this.plugin.settings.snapshotsFolderPath)
				.onChange(async (value) => {
					this.plugin.settings.snapshotsFolderPath = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Transaction template path')
			.setDesc(DESC_TEMPLATE)
			.addText(text => text
				.setPlaceholder(TEMPLATE_FILE_PATH)
				.setValue(this.plugin.settings.templateFilePath)
				.onChange(async (value) => {
					this.plugin.settings.templateFilePath = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Usage guide path')
			.setDesc('Path where the usage guide will be created and linked')
			.addText(text => text
				.setPlaceholder(USAGE_GUIDE_PATH)
				.setValue(this.plugin.settings.usageGuideFilePath)
				.onChange(async (value) => {
					this.plugin.settings.usageGuideFilePath = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Finance base file path')
			.setDesc(DESC_BASE)
			.addText(text => text
				.setPlaceholder(FINANCE_BASE_PATH)
				.setValue(this.plugin.settings.financeBasePath)
				.onChange(async (value) => {
					this.plugin.settings.financeBasePath = value;
					await this.plugin.saveSettings();
				}));
		// Transaction Integrity Section
		new Setting(containerEl).setHeading().setName('Transaction integrity');

		new Setting(containerEl)
			.setName('Blockchain-linked verification')
			.setDesc('When enabled, verify transaction integrity walks the full chain (each tx links to the previous one). When disabled, each transaction is verified independently — only its own hash is checked.')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.blockchainEnabled)
				.onChange(async (value) => {
					this.plugin.settings.blockchainEnabled = value;
					await this.plugin.saveSettings();
				}));
	}
}

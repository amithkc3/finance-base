import { App, Plugin, BasesView, parsePropertyId } from 'obsidian';
import { DEFAULT_SETTINGS, FinancePluginSettings, FinanceSettingTab } from "./settings";
import { createPieChart, formatAccountName, formatCurrency } from "./utils/charts";

export const FinanceDashboardViewType = 'finance-dashboard';

export default class PersonalFinancePlugin extends Plugin {
	settings: FinancePluginSettings;

	async onload() {
		await this.loadSettings();

		// @ts-ignore
		this.registerBasesView(FinanceDashboardViewType, {
			name: 'Finance Dashboard',
			icon: 'lucide-wallet',
			factory: (controller: any, containerEl: HTMLElement) => {
				return new FinanceDashboardView(controller, containerEl) as any
			},
			options: () => ([]),
		});

		this.addSettingTab(new FinanceSettingTab(this.app, this));
	}

	onunload() {
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData() as Partial<FinancePluginSettings>);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

interface AccountCategory {
	assets: Map<string, number>;
	liabilities: Map<string, number>;
	income: Map<string, number>;
	expenses: Map<string, number>;
}

// @ts-ignore
export class FinanceDashboardView extends BasesView {
	readonly type = FinanceDashboardViewType;
	private containerEl: HTMLElement;
	// @ts-ignore
	public app: App;
	public config: any;
	public data: any;
	private controller: any;

	constructor(controller: any, parentEl: HTMLElement) {
		super(controller);
		this.controller = controller;
		this.containerEl = parentEl.createDiv('bases-finance-dashboard');
	}

	private categorizeAccounts(): AccountCategory {

		const categories: AccountCategory = {
			assets: new Map(),
			liabilities: new Map(),
			income: new Map(),
			expenses: new Map()
		};

		const propertiesToProcess = this.allProperties || this.config.getOrder();
		if (!propertiesToProcess) return categories;

		for (const prop of propertiesToProcess) {
			// @ts-ignore
			const { type, name } = parsePropertyId(prop);
			if (type !== 'note') continue;
			// Use optimized getSummaryValue API
			// @ts-ignore
			const summaryValue = this.data.getSummaryValue(this.controller, this.data.data, prop, 'Sum');
			// @ts-ignore
			if (!summaryValue || !summaryValue.data || typeof summaryValue.data !== 'number') continue;

			// @ts-ignore
			const sum = summaryValue.data;

			// Categorize by prefix
			const lowerName = name.toLowerCase();
			if (lowerName.startsWith('asset')) {
				categories.assets.set(name, sum);
			} else if (lowerName.startsWith('liabilit')) {
				categories.liabilities.set(name, sum);
			} else if (lowerName.startsWith('income')) {
				categories.income.set(name, sum);
			} else if (lowerName.startsWith('expense')) {
				categories.expenses.set(name, sum);
			}
		}

		return categories;
	}

	public onDataUpdated(): void {
		this.containerEl.empty();
		this.containerEl.addClass('finance-dashboard-container');

		this.addStyles();

		const categories = this.categorizeAccounts();

		// Calculate totals
		const totalAssets = Array.from(categories.assets.values()).reduce((a, b) => a + b, 0);
		const totalLiabilities = Array.from(categories.liabilities.values()).reduce((a, b) => a + b, 0);
		const totalIncome = Array.from(categories.income.values()).reduce((a, b) => a + b, 0);
		const totalExpenses = Array.from(categories.expenses.values()).reduce((a, b) => a + b, 0);
		const netWorth = totalAssets + totalLiabilities; // liabilities are negative

		// Create dashboard components
		this.createNetWorthCard(netWorth, totalAssets, totalLiabilities);
		this.createAccountBreakdown(categories);
		this.createCharts(categories);
	}

	private createNetWorthCard(netWorth: number, assets: number, liabilities: number): void {
		const card = this.containerEl.createDiv('dashboard-card net-worth-card');

		card.createEl('h2', { text: 'Net Worth' });

		const amount = card.createDiv('net-worth-amount');
		amount.textContent = formatCurrency(netWorth);
		amount.className = netWorth >= 0 ? 'positive' : 'negative';

		const breakdown = card.createDiv('net-worth-breakdown');

		const assetsRow = breakdown.createDiv('breakdown-row');
		assetsRow.createSpan({ text: 'Assets', cls: 'breakdown-label' });
		assetsRow.createSpan({ text: formatCurrency(assets), cls: 'breakdown-value positive' });

		const liabilitiesRow = breakdown.createDiv('breakdown-row');
		liabilitiesRow.createSpan({ text: 'Liabilities', cls: 'breakdown-label' });
		liabilitiesRow.createSpan({ text: formatCurrency(liabilities), cls: 'breakdown-value negative' });
	}

	private createAccountBreakdown(categories: AccountCategory): void {
		const container = this.containerEl.createDiv('account-breakdown-container');

		// Assets column
		if (categories.assets.size > 0) {
			const assetsCol = container.createDiv('account-column');
			assetsCol.createEl('h3', { text: 'Assets' });

			Array.from(categories.assets.entries())
				.sort((a, b) => b[1] - a[1])
				.forEach(([name, value]) => {
					const row = assetsCol.createDiv('account-row');
					row.createSpan({ text: formatAccountName(name), cls: 'account-name' });
					row.createSpan({ text: formatCurrency(value), cls: 'account-value positive' });
				});
		}

		// Liabilities column
		if (categories.liabilities.size > 0) {
			const liabilitiesCol = container.createDiv('account-column');
			liabilitiesCol.createEl('h3', { text: 'Liabilities' });

			Array.from(categories.liabilities.entries())
				.sort((a, b) => a[1] - b[1])
				.forEach(([name, value]) => {
					const row = liabilitiesCol.createDiv('account-row');
					row.createSpan({ text: formatAccountName(name), cls: 'account-name' });
					row.createSpan({ text: formatCurrency(value), cls: 'account-value negative' });
				});
		}

		// Income column
		if (categories.income.size > 0) {
			const incomeCol = container.createDiv('account-column');
			incomeCol.createEl('h3', { text: 'Income' });

			Array.from(categories.income.entries())
				.sort((a, b) => a[1] - b[1])
				.forEach(([name, value]) => {
					const row = incomeCol.createDiv('account-row');
					row.createSpan({ text: formatAccountName(name), cls: 'account-name' });
					row.createSpan({ text: formatCurrency(value), cls: 'account-value' });
				});
		}

		// Expenses column
		if (categories.expenses.size > 0) {
			const expensesCol = container.createDiv('account-column');
			expensesCol.createEl('h3', { text: 'Expenses' });

			Array.from(categories.expenses.entries())
				.sort((a, b) => b[1] - a[1])
				.forEach(([name, value]) => {
					const row = expensesCol.createDiv('account-row');
					row.createSpan({ text: formatAccountName(name), cls: 'account-name' });
					row.createSpan({ text: formatCurrency(value), cls: 'account-value' });
				});
		}
	}

	private createCharts(categories: AccountCategory): void {
		const chartsContainer = this.containerEl.createDiv('charts-container');

		// Asset Distribution Chart
		if (categories.assets.size > 0) {
			const assetChartDiv = chartsContainer.createDiv('chart-wrapper');
			assetChartDiv.createEl('h3', { text: 'Asset Distribution' });
			const canvas = assetChartDiv.createEl('canvas');
			createPieChart(canvas, categories.assets, 'assets');
		}

		// Expense Distribution Chart
		if (categories.expenses.size > 0) {
			const expenseChartDiv = chartsContainer.createDiv('chart-wrapper');
			expenseChartDiv.createEl('h3', { text: 'Expense Distribution' });
			const canvas = expenseChartDiv.createEl('canvas');
			createPieChart(canvas, categories.expenses, 'expenses');
		}
	}

	private addStyles(): void {
		const styleEl = document.getElementById('finance-dashboard-styles');
		if (styleEl) return;

		const style = document.createElement('style');
		style.id = 'finance-dashboard-styles';
		style.textContent = `
			.finance-dashboard-container {
				padding: 20px;
				font-family: var(--font-interface);
			}

			.dashboard-card {
				background: var(--background-secondary);
				border-radius: 12px;
				padding: 24px;
				margin-bottom: 20px;
				box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
				border: 1px solid var(--background-modifier-border);
			}

			.net-worth-card h2 {
				margin: 0 0 16px 0;
				font-size: 18px;
				color: var(--text-muted);
				text-transform: uppercase;
				letter-spacing: 1px;
			}

			.net-worth-amount {
				font-size: 48px;
				font-weight: 700;
				margin-bottom: 20px;
				font-family: var(--font-monospace);
			}

			.net-worth-amount.positive {
				color: #10b981;
			}

			.net-worth-amount.negative {
				color: #ef4444;
			}

			.net-worth-breakdown {
				border-top: 1px solid var(--background-modifier-border);
				padding-top: 16px;
			}

			.breakdown-row {
				display: flex;
				justify-content: space-between;
				align-items: center;
				padding: 8px 0;
			}

			.breakdown-label {
				font-size: 16px;
				color: var(--text-normal);
			}

			.breakdown-value {
				font-size: 20px;
				font-weight: 600;
				font-family: var(--font-monospace);
			}

			.breakdown-value.positive {
				color: #10b981;
			}

			.breakdown-value.negative {
				color: #ef4444;
			}

			.account-breakdown-container {
				display: grid;
				grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
				gap: 20px;
				margin-bottom: 20px;
			}

			.account-column {
				background: var(--background-secondary);
				border-radius: 12px;
				padding: 20px;
				border: 1px solid var(--background-modifier-border);
			}

			.account-column h3 {
				margin: 0 0 16px 0;
				font-size: 16px;
				color: var(--text-muted);
				text-transform: uppercase;
				letter-spacing: 1px;
				border-bottom: 2px solid var(--background-modifier-border);
				padding-bottom: 8px;
			}

			.account-row {
				display: flex;
				justify-content: space-between;
				align-items: center;
				padding: 10px 0;
				border-bottom: 1px solid var(--background-modifier-border-hover);
			}

			.account-row:last-child {
				border-bottom: none;
			}

			.account-name {
				font-size: 14px;
				color: var(--text-normal);
			}

			.account-value {
				font-size: 16px;
				font-weight: 600;
				font-family: var(--font-monospace);
			}

			.account-value.positive {
				color: #10b981;
			}

			.account-value.negative {
				color: #ef4444;
			}

			.charts-container {
				display: grid;
				grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
				gap: 20px;
			}

			.chart-wrapper {
				background: var(--background-secondary);
				border-radius: 12px;
				padding: 20px;
				border: 1px solid var(--background-modifier-border);
			}

			.chart-wrapper h3 {
				margin: 0 0 16px 0;
				font-size: 16px;
				color: var(--text-muted);
				text-transform: uppercase;
				letter-spacing: 1px;
				text-align: center;
			}

			.chart-wrapper canvas {
				max-height: 300px;
			}
		`;
		document.head.appendChild(style);
	}
}

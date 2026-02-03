import { App, Editor, MarkdownView, Modal, Notice, Plugin, Keymap, BasesView, parsePropertyId } from 'obsidian';
import { DEFAULT_SETTINGS, MyPluginSettings, SampleSettingTab } from "./settings";

export const ExampleViewType = 'example-view';

export default class MyPlugin extends Plugin {
	settings: MyPluginSettings;

	async onload() {
		await this.loadSettings();

		// @ts-ignore
		this.registerBasesView(ExampleViewType, {
			name: 'Finance Dashboard',
			icon: 'lucide-wallet',
			factory: (controller: any, containerEl: HTMLElement) => {
				return new MyBasesView(controller, containerEl) as any
			},
			options: () => ([]),
		});

		this.addRibbonIcon('lucide-wallet', 'Sample', (evt: MouseEvent) => {
			new Notice('This is a notice!');
		});

		const statusBarItemEl = this.addStatusBarItem();
		statusBarItemEl.setText('Status bar text');

		this.addCommand({
			id: 'open-modal-simple',
			name: 'Open modal (simple)',
			callback: () => {
				new SampleModal(this.app).open();
			}
		});

		// this.addCommand({
		// 	id: 'replace-selected',
		// 	name: 'Replace selected content',
		// 	editorCallback: (editor: Editor, view: MarkdownView) => {
		// 		editor.replaceSelection('Sample editor command');
		// 	}
		// });

		// this.addCommand({
		// 	id: 'open-modal-complex',
		// 	name: 'Open modal (complex)',
		// 	checkCallback: (checking: boolean) => {
		// 		const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
		// 		if (markdownView) {
		// 			if (!checking) {
		// 				new SampleModal(this.app).open();
		// 			}
		// 			return true;
		// 		}
		// 		return false;
		// 	}
		// });

		this.addSettingTab(new SampleSettingTab(this.app, this));
		// this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000));
	}

	onunload() {
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData() as Partial<MyPluginSettings>);
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
export class MyBasesView extends BasesView {
	readonly type = ExampleViewType;
	private containerEl: HTMLElement;
	// @ts-ignore
	public app: App;
	public config: any;
	public data: any;
	private controller: any;
	private chartJsLoaded: boolean = false;

	constructor(controller: any, parentEl: HTMLElement) {
		super(controller);
		this.controller = controller;
		this.containerEl = parentEl.createDiv('bases-finance-dashboard');
		this.loadChartJs();
		console.log(this);
		sleep(3);

		// console.log(this.data.getSummaryValue(this.controller, this.data.data, 'note.assets_hdfcbank', 'Sum'))
	}

	private async loadChartJs(): Promise<void> {
		if (this.chartJsLoaded) return;

		return new Promise((resolve) => {
			// @ts-ignore
			if (window.Chart) {
				this.chartJsLoaded = true;
				resolve();
				return;
			}

			const script = document.createElement('script');
			script.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js';
			script.onload = () => {
				this.chartJsLoaded = true;
				resolve();
			};
			document.head.appendChild(script);
		});
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

		const entriesToCheck = this.data.data || [];

		for (const prop of propertiesToProcess) {
			// @ts-ignore
			const { type, name } = parsePropertyId(prop);
			if (type !== 'note') continue;

			let sum = this.data.getSummaryValue(this.queryController, this.data.data, name, 'Sum').data;
			console.log(type, name, sum);
			// let count = 0;

			// for (const entry of entriesToCheck) {
			// 	// @ts-ignore
			// 	const valueObj = entry.getValue(prop);
			// 	// @ts-ignore
			// 	if (valueObj && typeof valueObj.data === 'number') {
			// 		// @ts-ignore
			// 		sum += valueObj.data;
			// 		count++;
			// 	}
			// }

			// if (count === 0) continue;

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

		// Add styles
		this.addStyles();

		const categories = this.categorizeAccounts();

		// Calculate totals
		const totalAssets = Array.from(categories.assets.values()).reduce((a, b) => a + b, 0);
		const totalLiabilities = Array.from(categories.liabilities.values()).reduce((a, b) => a + b, 0);
		const totalIncome = Array.from(categories.income.values()).reduce((a, b) => a + b, 0);
		const totalExpenses = Array.from(categories.expenses.values()).reduce((a, b) => a + b, 0);
		const netWorth = totalAssets + totalLiabilities; // liabilities are negative

		// Create dashboard
		this.createNetWorthCard(netWorth, totalAssets, totalLiabilities);
		this.createAccountBreakdown(categories);
		this.createCharts(categories);
		console.log(this.data.getSummaryValue(this.queryController, this.data.data, 'note.assets_sbibank', 'Sum'))
	}

	private createNetWorthCard(netWorth: number, assets: number, liabilities: number): void {
		const card = this.containerEl.createDiv('dashboard-card net-worth-card');

		const title = card.createEl('h2', { text: 'Net Worth' });
		const amount = card.createDiv('net-worth-amount');
		amount.textContent = this.formatCurrency(netWorth);
		amount.className = netWorth >= 0 ? 'positive' : 'negative';

		const breakdown = card.createDiv('net-worth-breakdown');

		const assetsRow = breakdown.createDiv('breakdown-row');
		assetsRow.createSpan({ text: 'Assets', cls: 'breakdown-label' });
		assetsRow.createSpan({ text: this.formatCurrency(assets), cls: 'breakdown-value positive' });

		const liabilitiesRow = breakdown.createDiv('breakdown-row');
		liabilitiesRow.createSpan({ text: 'Liabilities', cls: 'breakdown-label' });
		liabilitiesRow.createSpan({ text: this.formatCurrency(liabilities), cls: 'breakdown-value negative' });
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
					row.createSpan({ text: this.formatAccountName(name), cls: 'account-name' });
					row.createSpan({ text: this.formatCurrency(value), cls: 'account-value positive' });
				});
		}

		// Liabilities column
		if (categories.liabilities.size > 0) {
			const liabilitiesCol = container.createDiv('account-column');
			liabilitiesCol.createEl('h3', { text: 'Liabilities' });

			Array.from(categories.liabilities.entries())
				.sort((a, b) => a[1] - b[1]) // Sort by most negative first
				.forEach(([name, value]) => {
					const row = liabilitiesCol.createDiv('account-row');
					row.createSpan({ text: this.formatAccountName(name), cls: 'account-name' });
					row.createSpan({ text: this.formatCurrency(value), cls: 'account-value negative' });
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
					row.createSpan({ text: this.formatAccountName(name), cls: 'account-name' });
					row.createSpan({ text: this.formatCurrency(value), cls: 'account-value' });
				});
		}
	}

	private async createCharts(categories: AccountCategory): Promise<void> {
		if (!this.chartJsLoaded) {
			await this.loadChartJs();
		}

		const chartsContainer = this.containerEl.createDiv('charts-container');

		// Asset Distribution Chart
		if (categories.assets.size > 0) {
			const assetChartDiv = chartsContainer.createDiv('chart-wrapper');
			assetChartDiv.createEl('h3', { text: 'Asset Distribution' });
			const canvas = assetChartDiv.createEl('canvas');
			this.createPieChart(canvas, categories.assets, 'assets');
		}

		// Expense Distribution Chart
		if (categories.expenses.size > 0) {
			const expenseChartDiv = chartsContainer.createDiv('chart-wrapper');
			expenseChartDiv.createEl('h3', { text: 'Expense Distribution' });
			const canvas = expenseChartDiv.createEl('canvas');
			this.createPieChart(canvas, categories.expenses, 'expenses');
		}
	}

	private createPieChart(canvas: HTMLCanvasElement, data: Map<string, number>, type: string): void {
		// @ts-ignore
		if (!window.Chart) return;

		const labels = Array.from(data.keys()).map(name => this.formatAccountName(name));
		const values = Array.from(data.values()).map(v => Math.abs(v));

		const colors = this.generateColors(data.size);

		// @ts-ignore
		new window.Chart(canvas, {
			type: 'pie',
			data: {
				labels: labels,
				datasets: [{
					data: values,
					backgroundColor: colors,
					borderWidth: 2,
					borderColor: '#1e1e1e'
				}]
			},
			options: {
				responsive: true,
				maintainAspectRatio: true,
				plugins: {
					legend: {
						position: 'bottom',
						labels: {
							color: 'var(--text-normal)',
							padding: 10,
							font: {
								size: 12
							}
						}
					},
					tooltip: {
						callbacks: {
							label: (context: any) => {
								const label = context.label || '';
								const value = this.formatCurrency(context.parsed);
								return `${label}: ${value}`;
							}
						}
					}
				}
			}
		});
	}

	private generateColors(count: number): string[] {
		const colors = [
			'#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
			'#FF9F40', '#FF6384', '#C9CBCF', '#4BC0C0', '#FF6384'
		];
		return colors.slice(0, count);
	}

	private formatAccountName(name: string): string {
		// Remove prefixes and format
		return name
			.replace(/^(assets?|liabilities?|income|expenses?)_?/i, '')
			.replace(/[._]/g, ' ')
			.split(' ')
			.map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
			.join(' ');
	}

	private formatCurrency(amount: number): string {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD',
			minimumFractionDigits: 2
		}).format(amount);
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

class SampleModal extends Modal {
	constructor(app: App) {
		super(app);
	}
}

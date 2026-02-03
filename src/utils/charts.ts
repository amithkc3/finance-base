import { Chart, ChartConfiguration } from 'chart.js/auto';

export function createPieChart(
    canvas: HTMLCanvasElement,
    data: Map<string, number>,
    type: 'assets' | 'expenses' | 'liabilities' | 'income'
): Chart {
    const labels = Array.from(data.keys()).map(name => formatAccountName(name));
    const values = Array.from(data.values()).map(v => Math.abs(v));
    const colors = generateColors(data.size);

    const config: ChartConfiguration = {
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
                            const value = formatCurrency(context.parsed);
                            return `${label}: ${value}`;
                        }
                    }
                }
            }
        }
    };

    return new Chart(canvas, config);
}

export function generateColors(count: number): string[] {
    const colors = [
        '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
        '#FF9F40', '#FF6384', '#C9CBCF', '#4BC0C0', '#FF6384'
    ];
    return colors.slice(0, count);
}

export function formatAccountName(name: string): string {
    return name
        .replace(/^(assets?|liabilities?|income|expenses?)_?/i, '')
        .replace(/[._]/g, ' ')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
}

export function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2
    }).format(amount);
}

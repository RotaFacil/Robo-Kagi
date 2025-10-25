import React from 'react';

interface TableRowProps {
    cells: (string | number)[];
    isHeader?: boolean;
}

const PnlCell = ({ value }: { value: number }) => {
    const color = value > 0 ? 'text-green-400' : value < 0 ? 'text-red-400' : 'text-zinc-300';
    const sign = value > 0 ? '+' : '';
    // Assuming the value is already a currency value, format it.
    // In the original component it was just toFixed(2)
    const formattedValue = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
    return <span className={`${color} font-mono`}>{sign}{formattedValue}</span>;
};

const TableRow: React.FC<TableRowProps> = ({ cells, isHeader = false }) => {
    const cellClass = isHeader ? "p-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider" : "p-3 whitespace-nowrap text-sm";
    
    return (
        <tr className={isHeader ? "bg-zinc-800/50" : "border-b border-zinc-800 last:border-0 hover:bg-zinc-800 transition-colors"}>
            {cells.map((cell, index) => (
                <td key={index} className={`${cellClass} ${index > 0 ? 'text-right' : ''}`}>
                    {index === 1 && typeof cell === 'number' ? <PnlCell value={cell} /> : cell}
                </td>
            ))}
        </tr>
    );
};


interface PerformanceTableProps {
    headers: string[];
    data: (string | number)[][];
    emptyMessage: string;
}

const PerformanceTable: React.FC<PerformanceTableProps> = ({ headers, data, emptyMessage }) => {
    return (
        <div className="max-h-96 overflow-y-auto">
            <table className="min-w-full divide-y divide-zinc-800">
                <thead><TableRow cells={headers} isHeader /></thead>
                <tbody className="divide-y divide-zinc-800">
                    {data.map((row, index) => (
                        <TableRow key={index} cells={row} />
                    ))}
                </tbody>
            </table>
            {data.length === 0 && <p className="text-center text-zinc-500 py-8">{emptyMessage}</p>}
        </div>
    );
};

export default React.memo(PerformanceTable);
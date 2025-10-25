import React from 'react';

interface StatCardProps {
    title: string;
    value: string | number;
    description?: string;
    valueColor?: string;
    icon?: React.ReactNode;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, description, valueColor, icon }) => {
    return (
        <div className="bg-zinc-900 rounded-lg p-4 flex flex-col justify-between h-full">
            <div>
                <div className="flex justify-between items-start">
                    <h3 className="text-sm text-zinc-400 font-medium">{title}</h3>
                    {icon && <div className={`text-zinc-500 ${valueColor}`}>{icon}</div>}
                </div>
                <p className={`text-3xl font-bold mt-1 ${valueColor || 'text-zinc-100'}`}>{value}</p>
            </div>
            {description && <p className="text-xs text-zinc-500 mt-2">{description}</p>}
        </div>
    );
};

export default React.memo(StatCard);
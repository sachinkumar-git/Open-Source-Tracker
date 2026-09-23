import React from 'react';

const ContributionHeatmap = ({ activityLogs }) => {
    const ROWS = 7;
    const COLS = 12;
    const DAYS_LABELS = ['Mon', '', 'Wed', '', 'Fri', '', 'Sun'];

    // Build activity map from logs
    const activityMap = {};
    (activityLogs || []).forEach(log => {
        const dateStr = new Date(log.date).toDateString();
        activityMap[dateStr] = (activityMap[dateStr] || 0) + 1;
    });

    const getIntensity = (count) => {
        if (!count || count === 0) return 0;
        if (count <= 1) return 1;
        if (count <= 3) return 2;
        if (count <= 5) return 3;
        return 4;
    };

    const intensityColors = [
        'bg-[#161b22]',
        'bg-emerald-900/60',
        'bg-emerald-700/80',
        'bg-emerald-500',
        'bg-emerald-400',
    ];

    // Build grid starting from Monday of current week, going back 12 weeks
    const today = new Date();
    const currentDay = today.getDay();
    const diffToMon = currentDay === 0 ? 6 : currentDay - 1;
    const startOfCurrentWeek = new Date(today);
    startOfCurrentWeek.setDate(today.getDate() - diffToMon);
    startOfCurrentWeek.setHours(0, 0, 0, 0);

    const grid = [];
    for (let row = 0; row < ROWS; row++) {
        const rowData = [];
        for (let col = 0; col < COLS; col++) {
            const cellDate = new Date(startOfCurrentWeek);
            cellDate.setDate(startOfCurrentWeek.getDate() - (COLS - 1 - col) * 7 + row);

            const dateStr = cellDate.toDateString();
            const count = activityMap[dateStr] || 0;
            const isFuture = cellDate > today;

            rowData.push({
                date: dateStr,
                count: isFuture ? null : count,
                intensity: isFuture ? -1 : getIntensity(count)
            });
        }
        grid.push(rowData);
    }

    return (
        <div className="flex flex-col">
            <div className="flex gap-3">
                {/* Day labels */}
                <div className="flex flex-col gap-[4px] pt-6">
                    {DAYS_LABELS.map((d, i) => (
                        <span key={i} className="text-[9px] text-slate-500 font-medium h-[14px] flex items-center">{d}</span>
                    ))}
                </div>
                {/* Grid */}
                <div>
                    <div className="flex flex-col gap-[4px]">
                        {grid.map((row, rowIdx) => (
                            <div key={rowIdx} className="flex gap-[4px]">
                                {row.map((cell, colIdx) => (
                                    <div
                                        key={colIdx}
                                        className={`w-[14px] h-[14px] rounded-[2px] transition-colors ${
                                            cell.intensity === -1 ? 'bg-transparent' : intensityColors[cell.intensity]
                                        } ${cell.intensity > 0 ? 'hover:ring-1 hover:ring-white/30' : 'hover:bg-slate-800'}`}
                                        title={cell.intensity === -1 ? '' : `${cell.count || 0} events on ${cell.date}`}
                                    />
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            <div className="flex justify-between mt-3 px-1">
                <span className="text-[10px] text-slate-600">Last 12 Weeks</span>
                <div className="flex items-center gap-1">
                    <span className="text-[10px] text-slate-600 mr-1">Less</span>
                    {intensityColors.map((color, i) => (
                        <div key={i} className={`w-2.5 h-2.5 rounded-[1px] ${color}`} />
                    ))}
                    <span className="text-[10px] text-slate-600 ml-1">More</span>
                </div>
            </div>
        </div>
    );
};

export default ContributionHeatmap;

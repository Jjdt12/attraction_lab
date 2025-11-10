import React, { useState, useEffect } from 'react';
import { TrendingUp, Pause, Play } from 'lucide-react';

export interface TrendData {
  timestamp: number;
  value: number;
}

interface TrendChartProps {
  title: string;
  data: TrendData[];
  unit?: string;
  color?: string;
  minValue?: number;
  maxValue?: number;
}

export function TrendChart({
  title,
  data,
  unit = '',
  color = '#3b82f6',
  minValue = 0,
  maxValue = 100
}: TrendChartProps) {
  const [isPaused, setIsPaused] = useState(false);
  const [displayData, setDisplayData] = useState<TrendData[]>(data);

  useEffect(() => {
    if (!isPaused) {
      setDisplayData(data);
    }
  }, [data, isPaused]);

  const width = 600;
  const height = 200;
  const padding = 40;

  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  const latestValue = displayData.length > 0 ? displayData[displayData.length - 1].value : 0;

  const points = displayData.map((point, index) => {
    const x = padding + (index / Math.max(1, displayData.length - 1)) * chartWidth;
    const y = padding + chartHeight - ((point.value - minValue) / (maxValue - minValue)) * chartHeight;
    return `${x},${y}`;
  }).join(' ');

  const gridLines = [];
  for (let i = 0; i <= 4; i++) {
    const y = padding + (i / 4) * chartHeight;
    const value = maxValue - (i / 4) * (maxValue - minValue);
    gridLines.push(
      <g key={i}>
        <line
          x1={padding}
          y1={y}
          x2={width - padding}
          y2={y}
          stroke="#374151"
          strokeWidth="1"
          strokeDasharray="4 4"
        />
        <text
          x={padding - 10}
          y={y + 4}
          textAnchor="end"
          fill="#9ca3af"
          fontSize="10"
        >
          {value.toFixed(0)}
        </text>
      </g>
    );
  }

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-gray-400" />
          <h3 className="text-white font-semibold">{title}</h3>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-2xl font-bold text-white">
            {latestValue.toFixed(1)} {unit}
          </span>
          <button
            onClick={() => setIsPaused(!isPaused)}
            className="p-2 bg-gray-700 hover:bg-gray-600 rounded"
          >
            {isPaused ? (
              <Play className="h-4 w-4 text-white" />
            ) : (
              <Pause className="h-4 w-4 text-white" />
            )}
          </button>
        </div>
      </div>

      <svg width={width} height={height} className="w-full">
        <rect
          x={padding}
          y={padding}
          width={chartWidth}
          height={chartHeight}
          fill="#1f2937"
          stroke="#374151"
          strokeWidth="1"
        />

        {gridLines}

        {displayData.length > 1 && (
          <polyline
            points={points}
            fill="none"
            stroke={color}
            strokeWidth="2"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        )}

        {displayData.map((point, index) => {
          const x = padding + (index / Math.max(1, displayData.length - 1)) * chartWidth;
          const y = padding + chartHeight - ((point.value - minValue) / (maxValue - minValue)) * chartHeight;
          return (
            <circle
              key={index}
              cx={x}
              cy={y}
              r="2"
              fill={color}
            />
          );
        })}

        <text
          x={width / 2}
          y={height - 10}
          textAnchor="middle"
          fill="#9ca3af"
          fontSize="12"
        >
          Time
        </text>

        <text
          x={padding - 30}
          y={padding - 10}
          textAnchor="start"
          fill="#9ca3af"
          fontSize="12"
        >
          {unit}
        </text>
      </svg>

      {isPaused && (
        <div className="mt-2 text-xs text-yellow-400 text-center">
          Chart paused
        </div>
      )}
    </div>
  );
}

export function useTrendData(maxPoints = 60) {
  const [data, setData] = useState<TrendData[]>([]);

  const addDataPoint = (value: number) => {
    setData(prev => {
      const newData = [...prev, { timestamp: Date.now(), value }];
      return newData.slice(-maxPoints);
    });
  };

  const clearData = () => {
    setData([]);
  };

  return { data, addDataPoint, clearData };
}

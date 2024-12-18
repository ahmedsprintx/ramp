'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Bar, Line, Pie, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import zoomPlugin from 'chartjs-plugin-zoom';
import { Expand, FileImage, FileSpreadsheet } from 'lucide-react';
import { useAppState } from '@/lib/utils/app-state';
import GraphModal from './graph-modal';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  zoomPlugin
);

type ChartType = 'bar' | 'line' | 'pie' | 'doughnut';

interface DynamicGraphProps {
  type: ChartType;
  config: any;
  title: string;
}

export default function DynamicGraph({
  config,
  title,
  type,
}: DynamicGraphProps) {
  const { isGenerating } = useAppState();
  const [isLocalGenerating, setIsLocalGenerating] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const chartRef = useRef(null);
  const modalChartRef = useRef(null);

  useEffect(() => {
    if (!isGenerating) {
      setIsLocalGenerating(false);
    }
  }, [isGenerating]);

  const ChartComponent =
    type === 'bar'
      ? Bar
      : type === 'line'
      ? Line
      : type === 'pie'
      ? Pie
      : Doughnut;

  const handleDownload = () => {
    if (chartRef.current) {
      const chartInstance = chartRef.current;
      //@ts-ignore
      const url = chartInstance.toBase64Image();
      const link = document.createElement('a');
      link.href = url;
      link.download = `${title}.png`;
      link.click();
    }
  };

  const handleResetZoom = () => {
    if (modalChartRef.current) {
      //@ts-ignore
      modalChartRef.current.resetZoom();
    } else if (chartRef.current) {
      //@ts-ignore
      chartRef.current.resetZoom();
    }
  };

  const zoomConfig = {
    ...config,
    options: {
      ...config?.options,
      plugins: {
        ...config?.options?.plugins,
        zoom: {
          zoom: {
            wheel: { enabled: true, speed: 0.05 },
            pinch: { enabled: true, speed: 0.05 },
            mode: 'y',
          },
          pan: {
            enabled: true,
            mode: 'xy',
          },
          limits: {
            y: { min: 'original', max: 'original' },
          },
        },
      },
      // Adjust the size for pie and doughnut charts
      ...(type === 'pie' || type === 'doughnut'
        ? {
            responsive: true,
            maintainAspectRatio: false,
          }
        : {}),
    },
  };

  const handleDownloadCSV = () => {
    const { labels, datasets } = config.data;
    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent +=
      'Channel,' +
      datasets.map((dataset: any) => dataset.label).join(',') +
      '\n';
    const rowCount = datasets[0].data.length;
    for (let i = 0; i < rowCount; i++) {
      const row = datasets.map((dataset: any) => dataset.data[i]);
      csvContent += labels[i] + ',' + row.join(',') + '\n';
    }
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${title}.csv`);
    document.body.appendChild(link);
    link.click();
  };

  return (
    <div className="m-6 rounded-lg bg-white">
      <div className="relative flex w-full items-center justify-between py-2">
        <div className="flex-1 pl-3 text-left">
          <h2 className="text-lg font-medium text-black">{title}</h2>
        </div>
        <div className="absolute right-4 flex items-center">
          <button onClick={() => setIsModalOpen(true)} className="mr-2">
            <Expand className="h-[16px] w-[16px] text-black" />
          </button>
          <button
            onClick={handleResetZoom}
            className="mr-2 text-sm text-textPrimaryLight"
          >
            Reset
          </button>
          <div className="flex gap-2">
            <button title="png" onClick={handleDownload}>
              <FileImage className="h-[16px] w-[16px] text-black" />
            </button>
            <button title="csv" onClick={handleDownloadCSV}>
              <FileSpreadsheet className="h-[16px] w-[16px] text-black" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex w-full items-center justify-center">
        {isLocalGenerating ? (
          <SkeletonChart />
        ) : (
          <div
            className={`p-[10px] overflow-scroll ${
              type === 'pie' || type === 'doughnut'
                ? 'h-[300px] w-[300px]'
                : 'w-full'
            }`}
          >
            <ChartComponent
              ref={chartRef}
              data={zoomConfig.data}
              options={zoomConfig.options}
            />
          </div>
        )}
      </div>

      <GraphModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <ChartComponent
          ref={modalChartRef}
          data={zoomConfig.data}
          options={zoomConfig.options}
        />
      </GraphModal>
    </div>
  );
}

function SkeletonChart() {
  return (
    <div className="!h-[50vh] !w-[60vw] flex items-center justify-center">
      <div className="h-full w-full animate-pulse rounded-md bg-gray-200"></div>
    </div>
  );
}

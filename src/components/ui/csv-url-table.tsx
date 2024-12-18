"use client";
import { useAppState } from "@/lib/utils/app-state";
import React, { useEffect, useState, useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper,
} from "@tanstack/react-table";
import { ChevronDown, ChevronUp, FileSpreadsheet, Search } from "lucide-react";
import { useOrganizationContext } from "@/lib/context/organisation.context";

interface TableProps {
  jsonUrl: string;
}

const BigDataTable: React.FC<TableProps> = ({ jsonUrl }) => {
  const [resultData, setResultData] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const { setIsGenerating } = useAppState();
  const columnHelper = createColumnHelper<any>();

  const { orgSettingData } = useOrganizationContext();
  const [sorting, setSorting] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchJson = async (url: string) => {
      setLoading(true);
      try {
        const response = await fetch(url);
        if (!response.ok) {
          console.error(`HTTP error! status: ${response.status}`);
        }
        const jsonData = await response.json();
        console.log("json data: ", jsonData);
        setResultData(jsonData);
      } finally {
        setLoading(false);
      }
    };

    fetchJson(jsonUrl);
  }, [jsonUrl]);

  const columns = useMemo(() => {
    if (resultData.length === 0) return [];
    return Object.keys(resultData[0]).map((key) =>
      columnHelper.accessor(key, {
        cell: (info) => info.getValue(),
        header: () => key,
        sortingFn: "alphanumeric",
      })
    );
  }, [resultData, columnHelper]);

  const filteredData = useMemo(() => {
    if (!searchQuery) return resultData;
    return resultData?.filter((row) =>
      Object.values(row).some((value) =>
        value?.toString().toLowerCase().includes(searchQuery.toLowerCase())
      )
    );
  }, [resultData, searchQuery]);

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    // @ts-ignore
    onSortingChange: setSorting,
    state: {
      sorting,
    },
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  const generatePageNumbers = () => {
    const totalPages = table.getPageCount();
    const currentPage = table.getState().pagination.pageIndex + 1;
    const pageNumbers: (number | string)[] = [];

    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      if (currentPage > 3) pageNumbers.push(1, "...");
      for (
        let i = Math.max(currentPage - 2, 1);
        i <= Math.min(currentPage + 2, totalPages);
        i++
      ) {
        pageNumbers.push(i);
      }
      if (currentPage < totalPages - 2) pageNumbers.push("...", totalPages);
    }
    return pageNumbers;
  };

  const downloadCSV = () => {
    const csvData: string[] = [];
    const headers = Object.keys(resultData[0]);
    csvData.push(`"${headers.join('","')}"`);

    resultData.forEach((row) => {
      const rowData: string[] = headers.map(
        (header) => row[header]?.toString().replace(/"/g, '""') || ""
      );
      csvData.push(`"${rowData.join('","')}"`);
    });

    const csvString = csvData.join("\n");
    const blob = new Blob([csvString], { type: "text/csv" });

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "table_data.csv";

    link.click();
    window.URL.revokeObjectURL(url);
  };

  setIsGenerating(false);

  if (loading) {
    return (
      <div className='flex items-center justify-center h-full py-5'>
        <div className='w-[16px] h-[16px] border-t-4 border-red-500 border-solid rounded-full animate-spin'></div>
        {/* Loading spinner */}
      </div>
    );
  }

  if (!resultData || resultData.length === 0) {
    return <p className='text-center'>No data available</p>;
  }

  return (
    <>
      <div className='mb-4 flex justify-between'>
        <div className='relative w-[50%]'>
          <input
            type='text'
            className='w-full p-2 pl-12 mt-2 border border-gray-300 rounded-full'
            placeholder='Search...'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Search className='absolute left-[1rem] top-[1rem] w-[18px] text-black dark:text-gray-500 ' />{" "}
          {/* Search icon */}
        </div>
        <button
          title='Download CSV'
          onClick={downloadCSV}
          className='ml-2 text-white rounded px-4 py-2'
        >
          <FileSpreadsheet className='text-black dark:text-white h-[16px] w-[16px]' />
        </button>
      </div>
      {/* Table */}
      <div className='max-h-full overflow-y-auto overflow-x-scroll scrollbar-hide'>
        <table className='min-w-full border border-gray-500 text-left text-black dark:text-white'>
          <thead className=' top-0  '>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr
                key={headerGroup.id}
                className='border-b border-gray-500 text-center'
              >
                {headerGroup.headers.map((header) => (
                  <th key={header.id} className='py-3 px-4'>
                    {header.isPlaceholder ? null : (
                      <div
                        className={`flex items-center justify-center ${
                          header.column.getCanSort()
                            ? "cursor-pointer select-none"
                            : ""
                        }`}
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                        {{
                          asc: <ChevronUp className='ml-2 h-4 w-4' />,
                          desc: <ChevronDown className='ml-2 h-4 w-4' />,
                        }[header.column.getIsSorted() as string] ?? null}
                      </div>
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className='border-b border-gray-500 text-center'>
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className='py-3 px-4'>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
            {table.getRowModel().rows.length === 0 && (
              <tr className='relative'>
                <td colSpan={columns.length} className='p-[6.75rem]'>
                  <div className='absolute inset-0 flex justify-center items-center mt-6'>
                    No Data Found
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className='flex justify-between items-center mt-3 mb-8'>
        <div>
          <p className='text-[14px]'>
            Displaying {table.getRowModel().rows.length} of{" "}
            {filteredData.length}
          </p>
        </div>
        <div className='flex items-center space-x-2 text-sm'>
          <button
            className='px-3 py-1 border rounded-md hover:bg-gray-100  over:text-black disabled:opacity-50 disabled:cursor-not-allowed'
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            &lt;
          </button>
          {/* Dynamic Page Numbers */}
          {generatePageNumbers().map((pageNumber, index) => (
            <button
              key={index}
              className={`px-3 py-1 rounded-md transition text-white hover:text-[#e5e5e5] ${""}`}
              style={{
                backgroundColor:
                  pageNumber === table.getState().pagination.pageIndex + 1
                    ? orgSettingData?.orgColor || "#ED3735"
                    : "",
              }}
              onClick={() => {
                if (typeof pageNumber === "number") {
                  table.setPageIndex(pageNumber - 1);
                }
              }}
              disabled={
                pageNumber === "..." ||
                pageNumber === table.getState().pagination.pageIndex + 1
              }
            >
              {pageNumber}
            </button>
          ))}
          <button
            className='px-3 py-1 border rounded-md hover:bg-gray-100 hover:text-black disabled:opacity-50 disabled:cursor-not-allowed'
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            &gt;
          </button>
        </div>
      </div>
    </>
  );
};

export default BigDataTable;

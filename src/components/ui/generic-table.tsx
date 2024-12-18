import React from "react";
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  flexRender,
  ColumnDef,
} from "@tanstack/react-table";
import { Spinner } from "../ui/spinner";
import { useOrganizationContext } from "@/lib/context/organisation.context";

interface GenericTableProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  isLoading?: boolean;
}

const GenericTable = <T,>({
  columns,
  data,
  isLoading = false,
}: GenericTableProps<T>) => {
  const { orgSettingData } = useOrganizationContext();
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 8,
      },
    },
  });

  const totalPages = table.getPageCount();
  const currentPage = table.getState().pagination.pageIndex + 1;

  const generatePageNumbers = () => {
    const delta = 1;
    const range = [];
    // @ts-ignore
    const rangeWithDots = [];
    // @ts-ignore
    let l;

    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 ||
        i === totalPages ||
        (i >= currentPage - delta && i <= currentPage + delta)
      ) {
        range.push(i);
      }
    }

    range.forEach((i) => {
      // @ts-ignore
      if (l) {
        if (i - l === 2) {
          rangeWithDots.push(l + 1);
        } else if (i - l !== 1) {
          rangeWithDots.push("...");
        }
      }
      rangeWithDots.push(i);
      l = i;
    });

    // @ts-ignore
    return rangeWithDots;
  };

  return (
    <>
      <div className='overflow-x-scroll scrollbar-hide'>
        <table className='min-w-full text-left text-black dark:text-white'>
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr
                key={headerGroup.id}
                className='border-b border-gray-500 text-center'
              >
                {headerGroup.headers.map((header) => (
                  <th key={header.id} className='py-3 px-4'>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
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
                <td colSpan={columns.length} className='p-4'>
                  <div className='absolute inset-0 flex justify-center items-center mt-2'>
                    {isLoading ? <Spinner /> : <p> No data Found</p>}
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className='flex justify-between items-center mt-3'>
        <div>
          <p>
            Displaying results {table.getRowModel().rows.length} of{" "}
            {data.length}
          </p>
        </div>
        <div className='flex gap-2 items-center'>
          <button
            className='hover:text-[#6329D6] px-2 py-1 cursor-pointer'
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            &lt;
          </button>
          {generatePageNumbers().map((pageNumber, index) => (
            <button
              key={index}
              className={`px-2 py-1 rounded ${
                pageNumber === currentPage
                  ? "text-white"
                  : "hover:text-[#6329D6]"
              }`}
              style={{
                backgroundColor: orgSettingData?.orgColor
                  ? orgSettingData?.orgColor
                  : "#6329D6",
              }}
              onClick={() => {
                if (typeof pageNumber === "number") {
                  table.setPageIndex(pageNumber - 1);
                }
              }}
              disabled={pageNumber === "..."}
            >
              {pageNumber}
            </button>
          ))}
          <button
            className='hover:text-[#6329D6] px-2 py-1 cursor-pointer'
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

export default GenericTable;

import React, { ReactNode, useMemo, useState } from "react";
import { FileSpreadsheet, Search } from "lucide-react";
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  flexRender,
  getSortedRowModel,
} from "@tanstack/react-table";
import { useOrganizationContext } from "@/lib/context/organisation.context";

interface DynamicTableProps {
  children: ReactNode;
}

const DynamicTable: React.FC<DynamicTableProps> = ({ children }) => {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const { orgSettingData } = useOrganizationContext();
  const [sorting, setSorting] = useState([]);
  // Prepare columns based on the children prop
  const columns = useMemo(() => {
    const columnDefs: any[] = [];

    React.Children.forEach(children, (child) => {
      if (React.isValidElement(child) && child.type === "thead") {
        React.Children.forEach(child.props.children, (theadRow) => {
          if (React.isValidElement(theadRow)) {
            /* @ts-ignore */
            React.Children.forEach(theadRow?.props.children, (th) => {
              if (React.isValidElement(th)) {
                columnDefs.push({
                  /* @ts-ignore */
                  id: th.props?.children?.toString(),
                  /* @ts-ignore */
                  accessorKey: th?.props?.children?.toString(), // Changed from accessor to accessorKey
                  /* @ts-ignore */
                  header: th?.props?.children,
                  cell: (info: any) => info.getValue(),
                });
              }
            });
          }
        });
      }
    });

    return columnDefs;
  }, [children]);

  // Modified data extraction
  const data = useMemo(() => {
    const rowData: any[] = [];

    React.Children.forEach(children, (child) => {
      if (React.isValidElement(child) && child.type === "tbody") {
        React.Children.forEach(child.props.children, (tr) => {
          if (React.isValidElement(tr)) {
            const rowObj: any = {};
            /* @ts-ignore */
            React.Children.forEach(tr.props.children, (td, index) => {
              if (React.isValidElement(td) && columns[index]) {
                const key = columns[index].accessorKey;
                /* @ts-ignore */
                rowObj[key] = td.props.children;
              }
            });
            if (Object.keys(rowObj).length > 0) {
              rowData.push(rowObj);
            }
          }
        });
      }
    });

    return rowData;
  }, [children, columns]);

  // Filter the data based on searchQuery
  const filteredData = useMemo(() => {
    if (!searchQuery) return data;
    return data.filter((row) =>
      Object.values(row).some((value) =>
        value?.toString().toLowerCase().includes(searchQuery.toLowerCase())
      )
    );
  }, [data, searchQuery]);

  // Create a table instance
  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
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

  // Download CSV functionality
  const downloadCSV = () => {
    const csvData: string[] = [];
    const headers = columns.map((col) => col.header);
    csvData.push(headers.join(","));

    filteredData.forEach((row) => {
      const rowData: string[] = columns.map((col) => row[col.accessorKey]);
      csvData.push(rowData.join(","));
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

      <div className='max-h-full overflow-y-auto overflow-x-scroll scrollbar-hide'>
        <table className='min-w-full border border-gray-500 text-left text-black dark:text-white'>
          <thead className='top-0'>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr
                key={headerGroup.id}
                className='border-b border-gray-500 text-center'
              >
                {headerGroup.headers.map((header) => (
                  <th key={header.id} className='py-3 px-4'>
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row, rowIndex) => (
              <tr
                key={row.id}
                className={`${
                  rowIndex % 2 === 0
                    ? "dark:bg-[#ffffff1A] bg-[#e8e9eb]"
                    : "bg-transparent"
                }`}
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className='py-3 px-4 text-center'>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
            {table.getRowModel().rows.length === 0 && (
              <tr>
                <td colSpan={columns.length} className='text-center py-3'>
                  No Data Found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

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

export default DynamicTable;

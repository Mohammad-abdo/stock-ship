import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Filter,
  X,
  Download,
} from "lucide-react";

export function DataTable({
  columns,
  data,
  searchable = true,
  searchPlaceholder = "Search...",
  pageSize = 10,
  filters = [],
  filterValues = {},
  onFilterChange,
  enablePagination = true,
  exportable = false,
  onExport,
}) {
  const [sorting, setSorting] = useState([]);
  const [columnFilters, setColumnFilters] = useState([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: pageSize,
  });

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: "includesString",
    onPaginationChange: setPagination,
    state: {
      sorting,
      columnFilters,
      globalFilter,
      pagination,
    },
  });

  const activeFiltersCount = useMemo(() => {
    return Object.values(filterValues).filter(v => v && v !== '').length;
  }, [filterValues]);

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between bg-card p-4 rounded-lg border"
      >
        <div className="flex flex-1 gap-3 items-center w-full sm:w-auto">
          {searchable && (
            <motion.div 
              className="relative flex-1 max-w-sm"
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder={searchPlaceholder}
                value={globalFilter ?? ""}
                onChange={(e) => setGlobalFilter(e.target.value)}
                className="pl-10"
              />
            </motion.div>
          )}

          {filters && filters.length > 0 && (
            <motion.div
              initial={false}
              animate={{ scale: 1 }}
              whileHover={{ scale: 1.05 }}
            >
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="relative"
              >
                <Filter className="w-4 h-4 mr-2" />
                Filters
                {activeFiltersCount > 0 && (
                  <span className="ml-2 bg-primary text-primary-foreground rounded-full px-2 py-0.5 text-xs">
                    {activeFiltersCount}
                  </span>
                )}
              </Button>
            </motion.div>
          )}

          {exportable && onExport && (
            <Button
              variant="outline"
              onClick={onExport}
              className="gap-2"
            >
              <Download className="w-4 h-4" />
              Export
            </Button>
          )}
        </div>

        <AnimatePresence>
          {showFilters && filters && filters.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="w-full sm:w-auto flex gap-2 flex-wrap mt-4 sm:mt-0"
            >
              {filters.map((filter, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="relative"
                >
                  <Select
                    value={filterValues[filter.key] || ""}
                    onChange={(e) => onFilterChange?.(filter.key, e.target.value)}
                    className="w-[150px]"
                  >
                    <option value="">All {filter.label}</option>
                    {filter.options.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Select>
                  {filterValues[filter.key] && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute -right-2 -top-2 h-5 w-5 rounded-full p-0"
                      onClick={() => onFilterChange?.(filter.key, "")}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  )}
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Table */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="rounded-md border bg-card overflow-hidden"
      >
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="bg-muted/50">
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id} className="font-semibold">
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              <AnimatePresence>
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row, index) => (
                    <motion.tr
                      key={row.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ delay: index * 0.02 }}
                      className="border-b hover:bg-muted/50 transition-colors"
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </TableCell>
                      ))}
                    </motion.tr>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="h-24 text-center"
                    >
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-muted-foreground"
                      >
                        No results found.
                      </motion.div>
                    </TableCell>
                  </TableRow>
                )}
              </AnimatePresence>
            </TableBody>
          </Table>
        </div>
      </motion.div>

      {/* Pagination */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center justify-between px-2 py-4 bg-card rounded-lg border"
      >
        <div className="flex-1 text-sm text-muted-foreground">
          Showing {table.getRowModel().rows.length} of {table.getFilteredRowModel().rows.length} results
        </div>
        <div className="flex items-center space-x-6 lg:space-x-8">
          <div className="flex items-center space-x-2">
            {/* <p className="text-sm font-medium">Rows per page</p> */}
            <Select
              value={table.getState().pagination.pageSize}
              onChange={(e) => {
                table.setPageSize(Number(e.target.value));
              }}
            >
              {[10, 20, 30, 40, 50].map((pageSize) => (
                <option key={pageSize} value={pageSize}>
                  {pageSize}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex w-[100px] items-center justify-center text-sm font-medium">
            Page {table.getState().pagination.pageIndex + 1} of{" "}
            {table.getPageCount()}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              className="hidden h-8 w-8 p-0 lg:flex"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="sr-only">Go to first page</span>
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="sr-only">Go to previous page</span>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <span className="sr-only">Go to next page</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="hidden h-8 w-8 p-0 lg:flex"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
            >
              <span className="sr-only">Go to last page</span>
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

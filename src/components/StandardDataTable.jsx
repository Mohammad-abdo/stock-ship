import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';

/**
 * StandardDataTable - A modern, clean, professional data table component
 * 
 * Design principles:
 * - Neutral color palette (white, soft gray, charcoal text)
 * - Minimal borders and separators
 * - Compact, readable typography
 * - Subtle interactions
 * - Fully responsive
 */
const StandardDataTable = ({
  columns = [],
  data = [],
  loading = false,
  emptyMessage = 'No data available',
  searchable = false,
  searchValue = '',
  onSearchChange = () => {},
  searchPlaceholder = 'Search...',
  pagination = null,
  onPageChange = () => {},
  rowActions = null,
  onRowClick = null,
  selectedRows = [],
  onRowSelect = null,
  stickyHeader = true,
  compact = false,
}) => {
  const { t } = useLanguage();

  // Column definitions with alignment
  const getColumnAlignment = (column) => {
    if (column.align === 'right') return 'text-right';
    if (column.align === 'center') return 'text-center';
    return 'text-left';
  };

  // Row height class
  const rowHeightClass = compact ? 'h-10' : 'h-12';

  return (
    <div className="w-full">
      {/* Search Bar */}
      {searchable && (
        <div className="mb-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-gray-300 focus:border-gray-300"
            />
          </div>
        </div>
      )}

      {/* Table Container */}
      <div className="border border-gray-200 rounded-md bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className={stickyHeader ? 'sticky top-0 z-10 bg-gray-50' : 'bg-gray-50'}>
              <TableRow className="border-b border-gray-200 hover:bg-transparent bg-gray-50">
                {onRowSelect && (
                  <TableHead className={`${rowHeightClass} px-4 w-12`}>
                    <input
                      type="checkbox"
                      checked={selectedRows.length === data.length && data.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          onRowSelect(data.map((row) => row.id));
                        } else {
                          onRowSelect([]);
                        }
                      }}
                      className="w-4 h-4 text-gray-600 border-gray-300 rounded focus:ring-gray-400"
                    />
                  </TableHead>
                )}
                {columns.map((column, index) => (
                  <TableHead
                    key={column.key || index}
                    className={`${rowHeightClass} px-4 text-xs font-semibold text-gray-700 uppercase tracking-wider ${getColumnAlignment(column)}`}
                    style={{ minWidth: column.minWidth || 'auto' }}
                  >
                    {column.label || column.header}
                  </TableHead>
                ))}
                {rowActions && (
                  <TableHead className={`${rowHeightClass} px-4 text-xs font-semibold text-gray-700 uppercase tracking-wider text-right w-24`}>
                    {t('mediation.common.actions') || 'Actions'}
                  </TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell
                    colSpan={columns.length + (onRowSelect ? 1 : 0) + (rowActions ? 1 : 0)}
                    className="h-32 text-center"
                  >
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-gray-400"></div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : data.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={columns.length + (onRowSelect ? 1 : 0) + (rowActions ? 1 : 0)}
                    className="h-32 text-center"
                  >
                    <p className="text-sm text-gray-500">{emptyMessage}</p>
                  </TableCell>
                </TableRow>
              ) : (
                data.map((row, rowIndex) => {
                  const isSelected = selectedRows.includes(row.id);
                  const isEven = rowIndex % 2 === 0;
                  
                  return (
                    <TableRow
                      key={row.id || rowIndex}
                      className={`
                        border-b border-gray-100
                        ${isEven ? 'bg-white' : 'bg-gray-50/30'}
                        ${isSelected ? 'bg-gray-100' : ''}
                        ${onRowClick ? 'cursor-pointer' : ''}
                        transition-colors duration-150
                        hover:bg-gray-100
                      `}
                      onClick={() => onRowClick && onRowClick(row)}
                    >
                      {onRowSelect && (
                        <TableCell className={`${rowHeightClass} px-4`} onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              e.stopPropagation();
                              if (e.target.checked) {
                                onRowSelect([...selectedRows, row.id]);
                              } else {
                                onRowSelect(selectedRows.filter((id) => id !== row.id));
                              }
                            }}
                            className="w-4 h-4 text-gray-600 border-gray-300 rounded focus:ring-gray-400"
                          />
                        </TableCell>
                      )}
                      {columns.map((column, colIndex) => (
                        <TableCell
                          key={column.key || colIndex}
                          className={`${rowHeightClass} px-4 text-sm text-gray-900 ${getColumnAlignment(column)}`}
                        >
                          {column.render
                            ? column.render(row[column.key], row, rowIndex)
                            : row[column.key] ?? '—'}
                        </TableCell>
                      ))}
                      {rowActions && (
                        <TableCell
                          className={`${rowHeightClass} px-4 text-right`}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {rowActions(row, rowIndex)}
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-4 px-1">
          <div className="text-sm text-gray-600">
            {t('mediation.common.showing') || 'Showing'}{' '}
            {((pagination.page - 1) * pagination.limit) + 1}{' '}
            {t('mediation.common.to') || 'to'}{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)}{' '}
            {t('mediation.common.of') || 'of'}{' '}
            {pagination.total}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onPageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 py-1.5 text-sm text-gray-700">
              {t('mediation.common.page') || 'Page'} {pagination.page} {t('mediation.common.of') || 'of'} {pagination.pages}
            </span>
            <button
              onClick={() => onPageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.pages}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default StandardDataTable;


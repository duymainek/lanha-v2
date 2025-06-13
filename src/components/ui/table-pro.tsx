import * as React from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { IconChevronLeft, IconChevronRight, IconChevronsLeft, IconChevronsRight } from "@tabler/icons-react"

interface Column<T> {
  label: string
  accessor?: keyof T
  render?: (row: T, rowIndex: number) => React.ReactNode
  className?: string
  width?: string | number
}

interface TableProProps<T extends object> {
  columns: Column<T>[]
  data: T[]
  rowKey: (row: T) => string | number
  actions?: (row: T) => React.ReactNode
  onRemoveSelected?: (selectedRows: T[]) => void
  onSendSelected?: (selectedRows: T[]) => void
  pagination?: boolean
  pageSizeOptions?: number[]
  defaultPageSize?: number
  selectable?: boolean
  onRowSelectChange?: (selectedIds: (string | number)[]) => void
  onRowClick?: (row: T) => void
}

export function TablePro<T extends object>({
  columns,
  data,
  rowKey,
  actions,
  onRemoveSelected,
  onSendSelected,
  pagination = true,
  pageSizeOptions = [5, 10, 20, 50],
  defaultPageSize = 10,
  selectable = true,
  onRowSelectChange,
  onRowClick,
}: TableProProps<T>) {
  const [selectedIds, setSelectedIds] = React.useState<(string | number)[]>([])
  const [allChecked, setAllChecked] = React.useState(false)
  const [page, setPage] = React.useState({ pageIndex: 0, pageSize: defaultPageSize })

  // Pagination logic
  const pageCount = pagination ? Math.ceil(data.length / page.pageSize) : 1
  const pagedData = React.useMemo(() => {
    if (!pagination) return data
    const start = page.pageIndex * page.pageSize
    return data.slice(start, start + page.pageSize)
  }, [data, page, pagination])

  // Select logic
  const handleCheckAll = (checked: boolean) => {
    setAllChecked(checked)
    const idsOnPage = pagedData.map(rowKey)
    setSelectedIds((prev) => {
      if (checked) {
        return Array.from(new Set([...prev, ...idsOnPage]))
      } else {
        return prev.filter((id) => !idsOnPage.includes(id))
      }
    })
  }
  const handleCheckRow = (id: string | number, checked: boolean) => {
    setSelectedIds((prev) => {
      if (checked) return [...prev, id]
      return prev.filter((itemId) => itemId !== id)
    })
  }
  React.useEffect(() => {
    if (onRowSelectChange) onRowSelectChange(selectedIds)
    setAllChecked(pagedData.length > 0 && pagedData.every((row) => selectedIds.includes(rowKey(row))))
    // eslint-disable-next-line
  }, [pagedData, selectedIds])

  // Remove selected
  const handleRemoveSelected = () => {
    if (onRemoveSelected) {
      const selectedRows = data.filter((row) => selectedIds.includes(rowKey(row)))
      onRemoveSelected(selectedRows)
      setSelectedIds([])
      setAllChecked(false)
    }
  }

  // Send selected
  const handleSendSelected = () => {
    if (onSendSelected) {
      const selectedRows = data.filter((row) => selectedIds.includes(rowKey(row)))
      onSendSelected(selectedRows)
      setSelectedIds([])
      setAllChecked(false)
    }
  }

  // Pagination handlers
  const setPageIndex = (idx: number) => setPage((p) => ({ ...p, pageIndex: idx }))
  const setPageSize = (size: number) => setPage({ pageIndex: 0, pageSize: size })

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader className="bg-muted sticky top-0 z-10">
            <TableRow>
              {selectable && (
                <TableHead className="w-8">
                  <Checkbox 
                    checked={allChecked} 
                    onCheckedChange={handleCheckAll} 
                    aria-label="Select all" 
                  />
                </TableHead>
              )}
              {columns.map((col, idx) => (
                <TableHead 
                  key={col.accessor?.toString() ?? idx} 
                  className={col.className} 
                  style={col.width ? { width: col.width } : {}}
                >
                  {col.label}
                </TableHead>
              ))}
              {actions && <TableHead className="w-8" />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {pagedData.length ? (
              pagedData.map((row, rowIndex) => (
                <TableRow
                  key={rowKey(row)}
                  onClick={e => {
                    if (
                      (e.target as HTMLElement).closest('button, [role=checkbox], .action-cell')
                    ) return
                    onRowClick && onRowClick(row)
                  }}
                  className={onRowClick ? 'cursor-pointer' : ''}
                >
                  {selectable && (
                    <TableCell>
                      <Checkbox 
                        checked={selectedIds.includes(rowKey(row))} 
                        onCheckedChange={(checked) => handleCheckRow(rowKey(row), !!checked)} 
                        aria-label="Select row" 
                      />
                    </TableCell>
                  )}
                  {columns.map((col, colIdx) => (
                    <TableCell key={col.accessor?.toString() ?? colIdx}>
                      {col.render
                        ? col.render(row, rowIndex)
                        : col.accessor
                        ? String(row[col.accessor] ?? "")
                        : null}
                    </TableCell>
                  ))}
                  {actions ? <TableCell className="action-cell">{actions(row)}</TableCell> : null}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell 
                  colSpan={columns.length + (selectable ? 1 : 0) + (actions ? 1 : 0)} 
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-2">
          {selectable && (
            <span className="text-muted-foreground hidden text-sm lg:inline-block">
              {selectedIds.length} of {data.length} row(s) selected.
            </span>
          )}
          {selectable && selectedIds.length > 0 && onRemoveSelected && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRemoveSelected}
            >
              Remove
            </Button>
          )}
          {selectable && selectedIds.length > 0 && selectedIds.length <= 2 && onSendSelected && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleSendSelected}
            >
              Send
            </Button>
          )}
        </div>

        {pagination && (
          <div className="flex w-full items-center gap-8 lg:w-fit">
            <div className="hidden items-center gap-2 lg:flex">
              <Label htmlFor="rows-per-page" className="text-sm font-medium">
                Rows per page
              </Label>
              <Select
                value={`${page.pageSize}`}
                onValueChange={(value) => setPageSize(Number(value))}
              >
                <SelectTrigger size="sm" className="w-20" id="rows-per-page">
                  <SelectValue placeholder={page.pageSize} />
                </SelectTrigger>
                <SelectContent side="top">
                  {pageSizeOptions.map((pageSize) => (
                    <SelectItem key={pageSize} value={`${pageSize}`}>
                      {pageSize}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex w-fit items-center justify-center text-sm font-medium">
              Page {page.pageIndex + 1} of {pageCount}
            </div>

            <div className="ml-auto flex items-center gap-2 lg:ml-0">
              <Button
                variant="outline"
                className="hidden h-8 w-8 p-0 lg:flex"
                onClick={() => setPageIndex(0)}
                disabled={page.pageIndex === 0}
              >
                <span className="sr-only">Go to first page</span>
                <IconChevronsLeft />
              </Button>
              <Button
                variant="outline"
                className="size-8"
                size="icon"
                onClick={() => setPageIndex(Math.max(0, page.pageIndex - 1))}
                disabled={page.pageIndex === 0}
              >
                <span className="sr-only">Go to previous page</span>
                <IconChevronLeft />
              </Button>
              <Button
                variant="outline"
                className="size-8"
                size="icon"
                onClick={() => setPageIndex(Math.min(pageCount - 1, page.pageIndex + 1))}
                disabled={page.pageIndex >= pageCount - 1}
              >
                <span className="sr-only">Go to next page</span>
                <IconChevronRight />
              </Button>
              <Button
                variant="outline"
                className="hidden size-8 lg:flex"
                size="icon"
                onClick={() => setPageIndex(pageCount - 1)}
                disabled={page.pageIndex >= pageCount - 1}
              >
                <span className="sr-only">Go to last page</span>
                <IconChevronsRight />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
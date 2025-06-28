import React, { useState, useEffect } from 'react'
import FileUpload from './helpers/FileUpload'
import SignaturePad from './helpers/SignaturePad'
import './mes-universal-table.css'
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'

/** Schema and data types */
export interface HeaderNode {
  label: string
  columns?: string[]
  children?: HeaderNode[]
}

export interface Column {
  field_id: string
  field_name: string
  field_type: string
  unit?: string
  precision?: number
  required?: boolean
  read_only?: boolean
  default_value?: any
  validation?: { min?: number; max?: number }
  options?: { label: string; value: string }[]
  formula?: string
  endpoint?: string
  bind_field?: string
  multiline?: boolean
  max_length?: number
  rows?: number
  capture_camera?: boolean
  file_types?: string[]
  max_size_mb?: number
  signed_by_role?: string[]
  visibility_condition?: string
}

export interface TableSchema {
  table_config: {
    header_structure?: HeaderNode[]
    columns: Column[]
    preload_rows?: any[]
    row_controls?: {
      mode?: 'fixed' | 'growing'
      min_rows?: number
      max_rows?: number
      allow_add_remove?: boolean
      initial_rows?: number
    }
    pagination?: { enabled?: boolean; rows_per_page?: number }
    column_layout?: {
      column_count?: number
      column_width_mode?: 'auto' | 'fixed'
      sticky_headers?: boolean
      resizable_columns?: boolean
    }
    style?: {
      table_border?: boolean
      striped_rows?: boolean
      alternate_row_color?: string
      header_color?: string
      header_font_color?: string
    }
  }
}

export interface MESUniversalTableProps {
  schema: TableSchema
  data: any[]
  onDataChange: (rows: any[]) => void
  lookupOptions?: Record<string, { label: string; value: string }[]>
  userRole?: string
}

/**
 * Main universal table component driven entirely by a schema.
 */
export default function MESUniversalTable({
  schema,
  data,
  onDataChange,
  lookupOptions,
  userRole,
}: MESUniversalTableProps) {
  const columns = schema.table_config.columns
  const style = schema.table_config.style || {}

  const [rows, setRows] = useState<any[]>([])
  const [page, setPage] = useState(0)

  // initialize rows with preload if data empty
  useEffect(() => {
    if (data && data.length) {
      setRows(data)
    } else if (schema.table_config.preload_rows) {
      setRows(schema.table_config.preload_rows)
    } else {
      const count = schema.table_config.row_controls?.initial_rows || 1
      setRows(Array.from({ length: count }, () => ({ })))
    }
  }, [data, schema.table_config])

  useEffect(() => {
    onDataChange(rows)
  }, [rows, onDataChange])

  const handleChange = (rowIndex: number, field: string, value: any) => {
    setRows(r => {
      const newRows = [...r]
      newRows[rowIndex] = { ...newRows[rowIndex], [field]: value }
      return newRows
    })
  }

  const evaluateFormula = (formula: string, row: any) => {
    try {
      const fn = new Function('row', `with(row){ return ${formula} }`)
      return fn(row)
    } catch (e) {
      return ''
    }
  }

  const checkVisibility = (col: Column, row: any) => {
    if (!col.visibility_condition) return true
    try {
      // eslint-disable-next-line no-new-func
      const fn = new Function('row', `with(row){ return ${col.visibility_condition} }`)
      return fn(row)
    } catch {
      return true
    }
  }

  const renderCell = (col: Column, row: any, rowIndex: number) => {
    if (!checkVisibility(col, row)) return null
    const commonProps = {
      className: 'border px-2 py-1',
    }
    const disabled = col.read_only || (col.signed_by_role && !col.signed_by_role.includes(userRole || ''))

    switch (col.field_type) {
      case 'text':
        return (
          <td {...commonProps}>
            <textarea
              className="border rounded w-full text-sm p-1"
              value={row[col.field_id] || ''}
              onChange={e => handleChange(rowIndex, col.field_id, e.target.value)}
              disabled={disabled}
              rows={col.rows || 1}
              maxLength={col.max_length}
            />
          </td>
        )
      case 'number':
        return (
          <td {...commonProps}>
            <input
              type="number"
              className="border rounded w-full text-sm p-1"
              value={row[col.field_id] || ''}
              onChange={e => handleChange(rowIndex, col.field_id, e.target.value)}
              disabled={disabled}
              step={col.precision ? Math.pow(10, -col.precision) : 'any'}
              min={col.validation?.min}
              max={col.validation?.max}
            /> {col.unit && <span className="ml-1">{col.unit}</span>}
          </td>
        )
      case 'boolean':
        return (
          <td {...commonProps} className="text-center">
            <input
              type="checkbox"
              checked={!!row[col.field_id]}
              onChange={e => handleChange(rowIndex, col.field_id, e.target.checked)}
              disabled={disabled}
            />
          </td>
        )
      case 'enum':
      case 'lookup':
        const options =
          col.field_type === 'lookup'
            ? lookupOptions?.[col.field_id] || []
            : col.options || []
        return (
          <td {...commonProps}>
            <select
              className="border rounded w-full text-sm p-1"
              value={row[col.field_id] || ''}
              onChange={e => handleChange(rowIndex, col.field_id, e.target.value)}
              disabled={disabled}
            >
              <option value=""></option>
              {options.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </td>
        )
      case 'formula':
        return <td {...commonProps}>{evaluateFormula(col.formula || '""', row)}</td>
      case 'image':
      case 'file':
        return (
          <td {...commonProps}>
            <FileUpload
              accept={col.file_types?.join(',')}
              maxSizeMB={col.max_size_mb}
              value={row[col.field_id] as File}
              onChange={file => handleChange(rowIndex, col.field_id, file)}
            />
          </td>
        )
      case 'signature':
        return (
          <td {...commonProps}>
            <SignaturePad
              disabled={disabled}
              value={row[col.field_id] as string}
              onChange={data => handleChange(rowIndex, col.field_id, data)}
            />
          </td>
        )
      default:
        return <td {...commonProps}></td>
    }
  }

  const addRow = () => {
    setRows(r => [...r, {}])
  }

  const removeRow = (index: number) => {
    setRows(r => r.filter((_, i) => i !== index))
  }

  // build column definitions for TanStack table
  const columnDefs = React.useMemo<ColumnDef<any, any>[]>(() => {
    return columns.map(col => ({
      id: col.field_id,
      header: col.field_name,
      accessorFn: (row: any) => row[col.field_id],
      cell: info => renderCell(col, info.row.original, info.row.index),
    }))
  }, [columns, rows])

  const totalPages = schema.table_config.pagination?.enabled
    ? Math.ceil(rows.length / (schema.table_config.pagination.rows_per_page || 5))
    : 1

  const paginatedRows = schema.table_config.pagination?.enabled
    ? rows.slice(
        page * (schema.table_config.pagination.rows_per_page || 5),
        (page + 1) * (schema.table_config.pagination.rows_per_page || 5)
      )
    : rows

  const table = useReactTable({
    data: paginatedRows,
    columns: columnDefs,
    getCoreRowModel: getCoreRowModel(),
  })

  const headerRows: HeaderNode[][] = []

  const buildHeader = (nodes: HeaderNode[], depth = 0) => {
    if (!headerRows[depth]) headerRows[depth] = []
    nodes.forEach(n => {
      headerRows[depth].push(n)
      if (n.children) buildHeader(n.children, depth + 1)
    })
  }

  if (schema.table_config.header_structure) {
    buildHeader(schema.table_config.header_structure)
  } else {
    headerRows[0] = columns.map(c => ({ label: c.field_name, columns: [c.field_id] }))
  }

  return (
    <div className="p-2">
      <table
        className={
          'min-w-full text-sm bg-white shadow-md rounded overflow-hidden ' +
          (style.table_border ? 'border border-gray-300 ' : '') +
          (style.striped_rows ? ' divide-y divide-gray-200 ' : '')
        }
        style={{ borderColor: style.table_border ? style.header_color : undefined }}
      >
        <thead className={schema.table_config.column_layout?.sticky_headers ? 'sticky top-0 z-10' : ''}>
          {headerRows.map((row, i) => (
            <tr key={i} className="bg-gray-100">
              {row.map((cell, idx) => {
                const colSpan = cell.columns ? cell.columns.length : 1
                const rowSpan = cell.children ? 1 : headerRows.length - i
                return (
                  <th
                    key={idx}
                    colSpan={colSpan}
                    rowSpan={rowSpan}
                    className="border px-2 py-1 font-bold text-center"
                    style={{ backgroundColor: style.header_color, color: style.header_font_color }}
                  >
                    {cell.label}
                  </th>
                )
              })}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map(row => (
            <tr
              key={row.id}
              className={style.striped_rows && row.index % 2 === 1 ? '' : ''}
              style={
                style.striped_rows && row.index % 2 === 1 && style.alternate_row_color
                  ? { backgroundColor: style.alternate_row_color }
                  : undefined
              }
            >
              {row.getVisibleCells().map(cell => (
                flexRender(cell.column.columnDef.cell, cell.getContext())
              ))}
              {schema.table_config.row_controls?.allow_add_remove && (
                <td className="border px-2 py-1">
                  <button onClick={() => removeRow(row.index)} className="text-red-500 text-xs">Delete</button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      {schema.table_config.row_controls?.allow_add_remove && (
        <button onClick={addRow} className="mt-2 px-2 py-1 border rounded text-sm">Add Row</button>
      )}
      {totalPages > 1 && (
        <div className="mt-2 flex gap-2">
          <button disabled={page === 0} onClick={() => setPage(p => p - 1)} className="border px-2 py-1 text-sm">Prev</button>
          <span className="text-sm">Page {page + 1} of {totalPages}</span>
          <button disabled={page === totalPages - 1} onClick={() => setPage(p => p + 1)} className="border px-2 py-1 text-sm">Next</button>
        </div>
      )}
    </div>
  )
}

'use client'
import React, { useState, useEffect } from 'react'
import FileUpload from './helpers/FileUpload'
import SignaturePad from './helpers/SignaturePad'
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
      side?: 'left' | 'right'
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
  const [cols, setCols] = useState<Column[]>(schema.table_config.columns)
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
      const defaults = () => {
        const obj: any = {}
        cols.forEach(c => {
          if (c.default_value !== undefined) obj[c.field_id] = c.default_value
        })
        return obj
      }
      setRows(Array.from({ length: count }, defaults))
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
    cols.forEach(col => {
      if (col.endpoint && col.bind_field === field) {
        fetch(`${col.endpoint}?value=${encodeURIComponent(String(value))}`)
          .then(res => res.json())
          .then(data => {
            setRows(curr => {
              const upd = [...curr]
              if (upd[rowIndex]) {
                upd[rowIndex] = { ...upd[rowIndex], [col.field_id]: data.value ?? data }
              }
              return upd
            })
          })
          .catch(() => {})
      }
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
        const invalid =
          (col.validation?.min !== undefined && Number(row[col.field_id]) < col.validation.min) ||
          (col.validation?.max !== undefined && Number(row[col.field_id]) > col.validation.max)
        return (
          <td {...commonProps} className={invalid ? 'border-red-500' : ''}>
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
    setRows(r => {
      const newRow: any = {}
      cols.forEach(c => {
        if (c.default_value !== undefined) {
          newRow[c.field_id] = c.default_value
        }
      })
      const newRows = [...r, newRow]
      if (schema.table_config.pagination?.enabled) {
        const rowsPerPage = schema.table_config.pagination.rows_per_page || 5
        setPage(Math.floor((newRows.length - 1) / rowsPerPage))
      }
      return newRows
    })
  }

  const removeRow = (index: number) => {
    setRows(r => {
      const newRows = r.filter((_, i) => i !== index)
      if (schema.table_config.pagination?.enabled) {
        const rowsPerPage = schema.table_config.pagination.rows_per_page || 5
        const lastPage = Math.max(0, Math.ceil(newRows.length / rowsPerPage) - 1)
        setPage(p => Math.min(p, lastPage))
      }
      return newRows
    })
  }

  const addColumn = () => {
    const name = prompt('Column name?') || `Column ${cols.length + 1}`
    const id = name.toLowerCase().replace(/\s+/g, '_')
    const newCol: Column = { field_id: id, field_name: name, field_type: 'text' }
    setCols(c => [...c, newCol])
    setRows(r => r.map(row => ({ ...row, [id]: '' })))
  }

  const removeColumnByFieldId = (fieldIdToRemove: string) => {
    setCols(currentCols => currentCols.filter(c => c.field_id !== fieldIdToRemove));
    setRows(currentRows => currentRows.map(row => {
      const { [fieldIdToRemove]: _, ...rest } = row;
      return rest;
    }));
  };

  const mergeRows = () => {
    if (rows.length < 2) return
    setRows(r => {
      const a = r[r.length - 2]
      const b = r[r.length - 1]
      const merged = { ...a, ...b }
      const newRows = [...r.slice(0, r.length - 2), merged]
      if (schema.table_config.pagination?.enabled) {
        const rowsPerPage = schema.table_config.pagination.rows_per_page || 5
        const lastPage = Math.max(0, Math.ceil(newRows.length / rowsPerPage) - 1)
        setPage(p => Math.min(p, lastPage))
      }
      return newRows
    })
  }

  const splitRow = () => {
    if (!rows.length) return
    setRows(r => {
      const row = r[r.length - 1]
      const clone = { ...row }
      return [...r, clone]
    })
  }

  const mergeColumns = () => {
    if (cols.length < 2) return
    setCols(c => {
      const a = c[c.length - 2]
      const b = c[c.length - 1]
      const merged: Column = { ...a, field_name: `${a.field_name}/${b.field_name}` }
      const newCols = [...c.slice(0, c.length - 2), merged]
      setRows(r => r.map(row => {
        return {
          ...row,
          [a.field_id]: `${row[a.field_id] || ''} ${row[b.field_id] || ''}`.trim(),
        }
      }))
      return newCols
    })
  }

  const splitColumn = () => {
    if (!cols.length) return
    const col = cols[cols.length - 1]
    const newCol: Column = { ...col, field_id: col.field_id + '_copy', field_name: col.field_name + ' Copy' }
    setCols(c => [...c, newCol])
    setRows(r => r.map(row => ({ ...row, [newCol.field_id]: row[col.field_id] })))
  }

  // build column definitions for TanStack table
  const columnDefs = React.useMemo<ColumnDef<any, any>[]>(() => {
    return cols.map(col => ({
      id: col.field_id,
      header: col.field_name,
      accessorFn: (row: any) => row[col.field_id],
      cell: info => renderCell(col, info.row.original, info.row.index),
    }))
  }, [cols, rows])

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
    headerRows[0] = cols.map(c => ({ label: c.field_name, columns: [c.field_id] }))
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
              {schema.table_config.row_controls?.allow_add_remove && i === headerRows.length - 1 && schema.table_config.row_controls?.side === 'left' && (
                <th className="border px-2 py-1"></th>
              )}
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
                    {
                      // Add remove button for leaf header cells in the last row of the header
                      i === headerRows.length - 1 &&
                      !cell.children &&
                      cell.columns && cell.columns.length === 1 && // Ensure it maps to a single column
                      (
                        <button
                          type="button"
                          onClick={() => removeColumnByFieldId(cell.columns[0])}
                          className="ml-1 text-xs text-red-500 hover:text-red-700 transition focus:outline-none"
                          title={`Remove ${cell.label} column`}
                        >
                          x
                        </button>
                      )
                    }
                  </th>
                )
              })}
              {schema.table_config.row_controls?.allow_add_remove && i === headerRows.length - 1 && schema.table_config.row_controls?.side !== 'left' && (
                <th className="border px-2 py-1"></th>
              )}
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
              {schema.table_config.row_controls?.allow_add_remove && schema.table_config.row_controls?.side === 'left' && (
                <td className="border px-2 py-1">
                  <button type="button" onClick={() => removeRow(row.index)} className="text-red-500 hover:text-red-700 transition text-xs">Delete</button>
                </td>
              )}
              {row.getVisibleCells().map(cell => (
                flexRender(cell.column.columnDef.cell, cell.getContext())
              ))}
              {schema.table_config.row_controls?.allow_add_remove && schema.table_config.row_controls?.side !== 'left' && (
                <td className="border px-2 py-1">
                  <button type="button" onClick={() => removeRow(row.index)} className="text-red-500 hover:text-red-700 transition text-xs">Delete</button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      {schema.table_config.row_controls?.allow_add_remove && (
        <div className="mt-2 flex gap-2">
          <button type="button" onClick={addRow} className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition text-sm">Add Row</button>
          <button type="button" onClick={mergeRows} className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 transition text-sm">Merge Rows</button>
          <button type="button" onClick={splitRow} className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 transition text-sm">Split Row</button>
        </div>
      )}
      <div className="mt-2 flex gap-2">
        <button type="button" onClick={addColumn} className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition text-sm">Add Column</button>
        <button type="button" onClick={mergeColumns} className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 transition text-sm">Merge Columns</button>
        <button type="button" onClick={splitColumn} className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 transition text-sm">Split Column</button>
      </div>
      {totalPages > 1 && (
        <div className="mt-2 flex gap-2">
          <button type="button" disabled={page === 0} onClick={() => setPage(p => p - 1)} className="border px-3 py-1 text-sm rounded disabled:opacity-50">Prev</button>
          <span className="text-sm">Page {page + 1} of {totalPages}</span>
          <button type="button" disabled={page === totalPages - 1} onClick={() => setPage(p => p + 1)} className="border px-3 py-1 text-sm rounded disabled:opacity-50">Next</button>
        </div>
      )}
    </div>
  )
}

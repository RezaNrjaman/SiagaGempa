import QueryState from '@/components/ui/QueryState'

function alignClass(align) {
  if (align === 'right') return 'text-right'
  if (align === 'center') return 'text-center'
  return 'text-left'
}

function TableSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      {[0, 1, 2, 3, 4].map((row) => (
        <div key={row} className="skeleton h-9 w-full rounded-control" />
      ))}
    </div>
  )
}

/* Header sticky, scroll horizontal di mobile, latar solid (bukan kaca) pada baris (PRD 10.3, 10.5). */
export default function DataTable({
  columns,
  rows,
  rowKey = (row) => row.id,
  onRowClick,
  selectedId,
  query,
  isEmpty,
  empty,
  maxHeight,
}) {
  return (
    <QueryState
      query={query}
      isEmpty={isEmpty}
      empty={empty}
      skeleton={<TableSkeleton />}
    >
      <div className="overflow-x-auto" style={maxHeight ? { maxHeight, overflowY: 'auto' } : undefined}>
        <table className="w-full border-collapse text-sm">
          <thead className="sticky top-0 z-10 bg-white/85 backdrop-blur-sm">
            <tr className="border-b border-grid">
              {columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  className={`whitespace-nowrap px-3 py-2.5 text-[11px] font-medium uppercase tracking-[0.08em] text-text-2 ${alignClass(column.align)}`}
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const id = rowKey(row)
              const selected = selectedId != null && id === selectedId
              return (
                <tr
                  key={id}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={`border-t border-grid transition-colors ${
                    onRowClick ? 'cursor-pointer hover:bg-brand-500/[0.06]' : ''
                  } ${selected ? 'bg-brand-500/10' : ''}`}
                >
                  {columns.map((column, index) => (
                    <td
                      key={column.key}
                      className={`whitespace-nowrap px-3 py-2.5 text-text-1 ${alignClass(column.align)} ${
                        index === 0 && selected ? 'border-l-2 border-l-brand-500' : ''
                      }`}
                    >
                      {column.render ? column.render(row) : row[column.key]}
                    </td>
                  ))}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </QueryState>
  )
}

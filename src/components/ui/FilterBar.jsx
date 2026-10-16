import { Check } from 'lucide-react'
import GlassPanel from '@/components/ui/GlassPanel'

function Chip({ label, selected, onClick }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`inline-flex items-center gap-1 rounded-control border px-2.5 py-1 text-xs font-medium transition-colors ${
        selected
          ? 'border-brand-500 bg-brand-700 text-text-1'
          : 'border-white/20 text-text-2 hover:bg-white/10'
      }`}
    >
      {selected ? <Check size={12} strokeWidth={2} aria-hidden="true" /> : null}
      {label}
    </button>
  )
}

function Field({ field, value, onChange }) {
  if (field.type === 'chips') {
    const selectedValues = Array.isArray(value) ? value : []
    const toggle = (option) => {
      const next = selectedValues.includes(option)
        ? selectedValues.filter((item) => item !== option)
        : [...selectedValues, option]
      onChange(next)
    }
    return (
      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-text-2">{field.label}</span>
        <div className="flex flex-wrap gap-1.5">
          {field.options.map((option) => (
            <Chip
              key={option}
              label={option}
              selected={selectedValues.includes(option)}
              onClick={() => toggle(option)}
            />
          ))}
        </div>
      </div>
    )
  }

  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-text-2">{field.label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-control border border-white/20 bg-brand-900 px-3 py-1.5 text-sm text-text-1"
      >
        {field.options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  )
}

/* Dikendalikan dari URL oleh halaman pemanggil (PRD 10.5). */
export default function FilterBar({ fields, value, onChange }) {
  return (
    <GlassPanel className="p-3 md:p-4">
      <div className="flex flex-wrap items-start gap-x-6 gap-y-3">
        {fields.map((field) => (
          <Field
            key={field.key}
            field={field}
            value={value[field.key]}
            onChange={(next) => onChange({ [field.key]: next })}
          />
        ))}
      </div>
    </GlassPanel>
  )
}

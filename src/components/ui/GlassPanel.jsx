/*
 * Satu-satunya elemen pembawa kelas .glass. `hoverable` menambah angkat halus
 * saat kursor (kartu kerja); panel pasif seperti FilterBar tidak bergerak.
 */
export default function GlassPanel({
  as: Tag = 'section',
  className = '',
  elevated = false,
  hoverable = false,
  children,
  ...rest
}) {
  return (
    <Tag
      className={`glass rounded-panel ${elevated ? 'shadow-card' : ''} ${hoverable ? 'glass-lift' : ''} ${className}`}
      {...rest}
    >
      {children}
    </Tag>
  )
}

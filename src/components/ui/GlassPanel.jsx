/* Satu-satunya elemen pembawa kelas .glass (PRD 10.5). */
export default function GlassPanel({
  as: Tag = 'section',
  className = '',
  elevated = false,
  children,
  ...rest
}) {
  return (
    <Tag
      className={`glass rounded-panel ${elevated ? 'shadow-card' : ''} ${className}`}
      {...rest}
    >
      {children}
    </Tag>
  )
}

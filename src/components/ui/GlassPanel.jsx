/* Satu-satunya elemen pembawa kelas .glass (PRD 10.5). */
export default function GlassPanel({ as: Tag = 'section', className = '', children, ...rest }) {
  return (
    <Tag className={`glass rounded-panel ${className}`} {...rest}>
      {children}
    </Tag>
  )
}

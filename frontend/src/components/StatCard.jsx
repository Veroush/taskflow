export default function StatCard({ title, value, icon: Icon, color }) {
  return (
    <div
      className="bg-white border rounded-md p-5"
      style={{ borderColor: '#e5e7eb' }}
    >
      <div className="flex items-start justify-between mb-3">
        <span style={{ fontSize: '13px', color: '#9ca3af' }}>{title}</span>
        <div
          className="w-8 h-8 rounded flex items-center justify-center shrink-0"
          style={{ backgroundColor: `${color}22` }}
        >
          <Icon size={18} style={{ color }} />
        </div>
      </div>
      <span className="font-bold" style={{ fontSize: '28px', color: '#111827' }}>
        {value}
      </span>
    </div>
  )
}
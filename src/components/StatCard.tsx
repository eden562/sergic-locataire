interface StatCardProps {
  label: string
  value: string | number
  icon: string
  color?: 'blue' | 'orange' | 'green' | 'red'
  trend?: { value: number; positive: boolean }
}

const colorMap = {
  blue: {
    bg: 'bg-blue-50',
    icon: 'bg-sergic-blue text-white',
    text: 'text-sergic-blue',
  },
  orange: {
    bg: 'bg-orange-50',
    icon: 'bg-sergic-orange text-white',
    text: 'text-sergic-orange',
  },
  green: {
    bg: 'bg-green-50',
    icon: 'bg-green-600 text-white',
    text: 'text-green-600',
  },
  red: {
    bg: 'bg-red-50',
    icon: 'bg-red-600 text-white',
    text: 'text-red-600',
  },
}

export function StatCard({ label, value, icon, color = 'blue', trend }: StatCardProps) {
  const c = colorMap[color]
  return (
    <div className={`card flex items-center gap-4`}>
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${c.icon} flex-shrink-0`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-500 truncate">{label}</p>
        <p className={`text-2xl font-bold ${c.text}`}>{value}</p>
        {trend && (
          <p
            className={`text-xs mt-0.5 ${
              trend.positive ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {trend.positive ? '↑' : '↓'} {Math.abs(trend.value)}% ce mois
          </p>
        )}
      </div>
    </div>
  )
}

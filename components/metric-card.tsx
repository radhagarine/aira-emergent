interface MetricCardProps {
  value: string
  label: string
}

export function MetricCard({ value, label }: MetricCardProps) {
  return (
    <div className="bg-white rounded-lg p-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
      <div className="text-[#8B0000] text-3xl font-bold mb-2">{value}</div>
      <div className="text-gray-600 text-sm">{label}</div>
    </div>
  )
}


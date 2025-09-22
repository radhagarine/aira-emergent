import { Card } from "@/components/ui/card"
import { ArrowUp, ArrowDown } from 'lucide-react'

interface StatCardProps {
  title: string
  value: string
  change: {
    value: string
    trend: 'up' | 'down'
  }
}

function StatCard({ title, value, change }: StatCardProps) {
  const isPositive = change.trend === 'up'

  return (
    <Card className="p-6">
      <h3 className="text-sm text-gray-500 font-medium">{title}</h3>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-2xl font-semibold text-gray-900">{value}</span>
        <span className={`inline-flex items-center gap-0.5 text-sm px-2 py-0.5 rounded ${
          isPositive ? 'text-green-700 bg-green-50' : 'text-red-700 bg-red-50'
        }`}>
          {isPositive ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
          {change.value}
        </span>
      </div>
    </Card>
  )
}

export function Stats() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
      <StatCard
        title="Total Employees"
        value="72,420"
        change={{ value: "+10.2%", trend: "up" }}
      />
      <StatCard
        title="Total New Joiners"
        value="1,420"
        change={{ value: "+2.2%", trend: "up" }}
      />
      <StatCard
        title="Total Quit"
        value="560"
        change={{ value: "-1.2%", trend: "down" }}
      />
      <StatCard
        title="Total Employees Salary"
        value="$47.5 M"
        change={{ value: "-2.4%", trend: "down" }}
      />
      <StatCard
        title="Employees Satisfaction"
        value="54.3%"
        change={{ value: "+2.4%", trend: "up" }}
      />
      <StatCard
        title="Total Women Powers"
        value="36.7%"
        change={{ value: "+3.6%", trend: "up" }}
      />
    </div>
  )
}


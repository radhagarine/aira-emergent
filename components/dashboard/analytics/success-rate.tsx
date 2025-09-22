'use client'

import { Pie, PieChart, ResponsiveContainer, Cell, Tooltip } from "recharts"

const data = [
  { name: "Successful", value: 39, color: "#22c55e" },
  { name: "Failed", value: 35, color: "#ef4444" },
  { name: "Pending", value: 26, color: "#f59e0b" }
]

export function SuccessRate() {
  const total = data.reduce((sum, item) => sum + item.value, 0)

  return (
    <div className="space-y-4">
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={90}
            startAngle={90}
            endAngle={450}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => [`${value}%`, 'Success Rate']} />
        </PieChart>
      </ResponsiveContainer>

      <div className="text-center">
        <div className="text-3xl font-bold text-green-600 mb-2">Successful 39%</div>
        <div className="space-y-2">
          {data.map((item) => (
            <div key={item.name} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-gray-600">{item.name}</span>
              </div>
              <span className="font-medium">{item.value}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}


'use client'

import { Pie, PieChart, ResponsiveContainer, Cell, Legend, Tooltip } from "recharts"

const data = [
  { name: "Acme Corporation", value: 3, color: "#22c55e" },
  { name: "Globex Industries", value: 2, color: "#3b82f6" },
  { name: "Wayne Enterprises", value: 2, color: "#ef4444" },
  { name: "Stark Industries", value: 4, color: "#f59e0b" },
  { name: "Initech", value: 1, color: "#8b5cf6" }
]

const COLORS = ['#22c55e', '#3b82f6', '#ef4444', '#f59e0b', '#8b5cf6']

export function BusinessLocations() {
  return (
    <div className="space-y-4">
      <ResponsiveContainer width="100%" height={250}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={80}
            innerRadius={40}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>

      <div className="space-y-2">
        {data.map((item, index) => (
          <div key={item.name} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-gray-600">{item.name}</span>
            </div>
            <span className="font-medium">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
'use client'

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"

const data = [
  { name: "Jan", total: 4200 },
  { name: "Feb", total: 5800 },
  { name: "Mar", total: 2900 },
  { name: "Apr", total: 5400 },
  { name: "May", total: 2800 },
  { name: "Jun", total: 2700 },
  { name: "Jul", total: 4100 },
  { name: "Aug", total: 5600 },
  { name: "Sep", total: 4800 },
  { name: "Oct", total: 3200 },
  { name: "Nov", total: 3100 },
  { name: "Dec", total: 2900 }
]

export function CallMetrics() {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <XAxis
          dataKey="name"
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `${value}`}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#f8f9fa',
            border: '1px solid #e9ecef',
            borderRadius: '8px'
          }}
          formatter={(value) => [`${value} calls`, 'Total Calls']}
        />
        <Bar
          dataKey="total"
          fill="#8b0000"
          radius={[4, 4, 0, 0]}
          fillOpacity={0.8}
        />
      </BarChart>
    </ResponsiveContainer>
  )
}


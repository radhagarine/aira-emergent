'use client'

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"

const data = [
  { hour: "8 AM", calls: 45 },
  { hour: "9 AM", calls: 120 },
  { hour: "10 AM", calls: 175 },
  { hour: "11 AM", calls: 190 },
  { hour: "12 PM", calls: 110 },
  { hour: "1 PM", calls: 85 },
  { hour: "2 PM", calls: 130 },
  { hour: "3 PM", calls: 165 },
  { hour: "4 PM", calls: 180 },
  { hour: "5 PM", calls: 120 },
  { hour: "6 PM", calls: 60 }
]

export function HourlyActivity() {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <XAxis
          dataKey="hour"
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
        />
        <Bar
          dataKey="calls"
          fill="#8b5cf6"
          radius={[4, 4, 0, 0]}
          fillOpacity={0.8}
        />
      </BarChart>
    </ResponsiveContainer>
  )
}
'use client'

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from "recharts"

const data = [
  {
    name: "Mon",
    total: Math.floor(Math.random() * 100) + 20,
  },
  {
    name: "Tue",
    total: Math.floor(Math.random() * 100) + 20,
  },
  {
    name: "Wed",
    total: Math.floor(Math.random() * 100) + 20,
  },
  {
    name: "Thu",
    total: Math.floor(Math.random() * 100) + 20,
  },
  {
    name: "Fri",
    total: Math.floor(Math.random() * 100) + 20,
  },
  {
    name: "Sat",
    total: Math.floor(Math.random() * 100) + 20,
  },
  {
    name: "Sun",
    total: Math.floor(Math.random() * 100) + 20,
  },
]

export function FollowupAnalysis() {
  return (
    <ResponsiveContainer width="100%" height={350}>
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
        <Bar dataKey="total" fill="#adfa1d" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}


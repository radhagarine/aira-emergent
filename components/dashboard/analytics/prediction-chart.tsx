'use client'

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from "recharts"

const data = [
  { name: "Jan", average: 400, today: 240 },
  { name: "Feb", average: 300, today: 139 },
  { name: "Mar", average: 200, today: 980 },
  { name: "Apr", average: 278, today: 390 },
  { name: "May", average: 189, today: 480 },
  { name: "Jun", average: 239, today: 380 },
  { name: "Jul", average: 349, today: 430 },
]

export function PredictionChart() {
  return (
    <ResponsiveContainer width="100%" height={350}>
      <LineChart data={data}>
        <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
        <YAxis
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `$${value}`}
        />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="today" stroke="#8884d8" strokeWidth={2} name="Today" />
        <Line type="monotone" dataKey="average" stroke="#82ca9d" strokeWidth={2} name="Average" />
      </LineChart>
    </ResponsiveContainer>
  )
}


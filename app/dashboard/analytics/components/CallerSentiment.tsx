'use client'

import { Line, LineChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, Area, AreaChart } from "recharts"

const data = [
  { date: "Jan 15", positive: 68, neutral: 25, negative: 7 },
  { date: "Jan 16", positive: 72, neutral: 21, negative: 7 },
  { date: "Jan 17", positive: 65, neutral: 28, negative: 7 },
  { date: "Jan 18", positive: 75, neutral: 18, negative: 7 },
  { date: "Jan 19", positive: 82, neutral: 12, negative: 6 },
  { date: "Jan 20", positive: 78, neutral: 16, negative: 6 },
  { date: "Jan 21", positive: 80, neutral: 15, negative: 5 },
]

export function CallerSentiment() {
  return (
    <div className="space-y-4">
      {/* Overall Sentiment Display */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center p-4 bg-green-50 rounded-lg">
          <div className="text-2xl font-bold text-green-600">78%</div>
          <div className="text-sm text-green-700">Positive</div>
        </div>
        <div className="text-center p-4 bg-yellow-50 rounded-lg">
          <div className="text-2xl font-bold text-yellow-600">16%</div>
          <div className="text-sm text-yellow-700">Neutral</div>
        </div>
        <div className="text-center p-4 bg-red-50 rounded-lg">
          <div className="text-2xl font-bold text-red-600">6%</div>
          <div className="text-sm text-red-700">Negative</div>
        </div>
      </div>

      {/* Sentiment Trend Chart */}
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data}>
          <XAxis
            dataKey="date"
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
            domain={[0, 100]}
            tickFormatter={(value) => `${value}%`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#f8f9fa',
              border: '1px solid #e9ecef',
              borderRadius: '8px'
            }}
            formatter={(value, name) => [`${value}%`, name]}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="positive"
            stroke="#22c55e"
            strokeWidth={2}
            name="Positive"
            dot={{ fill: '#22c55e', r: 4 }}
          />
          <Line
            type="monotone"
            dataKey="neutral"
            stroke="#f59e0b"
            strokeWidth={2}
            name="Neutral"
            dot={{ fill: '#f59e0b', r: 4 }}
          />
          <Line
            type="monotone"
            dataKey="negative"
            stroke="#ef4444"
            strokeWidth={2}
            name="Negative"
            dot={{ fill: '#ef4444', r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
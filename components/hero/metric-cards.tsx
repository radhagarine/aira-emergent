import { MetricCard } from "@/components/ui/metric-card"

const metrics = [
  { value: "98%", label: "Customer Satisfaction" },
  { value: "<3s", label: "Response Time" },
  { value: "40%", label: "Cost Reduction" },
]

export function MetricCards() {
  return (
    <div className="space-y-4">
      {metrics.map((metric) => (
        <MetricCard
          key={metric.label}
          value={metric.value}
          label={metric.label}
        />
      ))}
    </div>
  )
}


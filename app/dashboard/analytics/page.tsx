'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DateRangeCalendar } from "@/components/ui/date-range-calendar"
import { CallMetrics } from "@/components/dashboard/analytics/call-metrics"
import { SuccessRate } from "@/components/dashboard/analytics/success-rate"
import { PredictionChart } from "@/components/dashboard/analytics/prediction-chart"
import { HourlyActivity } from "./components/HourlyActivity"
import { BusinessLocations } from "./components/BusinessLocations"
import { CallerSentiment } from "./components/CallerSentiment"
import {
  Brain,
  TrendingUp,
  Phone,
  Users,
  Download,
  Filter,
  BarChart3,
  ArrowUpIcon,
  ArrowDownIcon,
  FileText,
  Mic,
  CheckCircle
} from 'lucide-react'

interface DateRange {
  from?: Date
  to?: Date
}

export default function AnalyticsPage() {
  const [selectedBusiness, setSelectedBusiness] = useState("all")
  const [isGeneratingReport, setIsGeneratingReport] = useState(false)
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(2023, 0, 20),
    to: new Date(2023, 1, 9),
  })


  // Mock data for KPI cards
  const kpiData = {
    totalCalls: { value: "1,274", change: "+20.1%", trend: "up" },
    successRate: { value: "89.3%", change: "+4.5%", trend: "up" },
    followUps: { value: "432", change: "+12.3%", trend: "up" },
    aiConfidence: { value: "94.7%", change: "-1.2%", trend: "down" }
  }

  const businesses = [
    { value: "all", label: "All Businesses" },
    { value: "restaurant", label: "Main Restaurant" },
    { value: "retail", label: "Retail Store" },
    { value: "service", label: "Service Center" }
  ]

  const handleGenerateReport = () => {
    setIsGeneratingReport(true)
    setTimeout(() => setIsGeneratingReport(false), 2000)
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Enhanced Header - Mobile Responsive */}
      <div className="bg-gradient-to-r from-red-800 to-red-900 text-white p-4 sm:p-6 rounded-lg">
        <h1 className="text-xl sm:text-2xl font-bold mb-2">AiRA Analytics Dashboard</h1>
        <p className="text-red-100 text-sm sm:text-base">Comprehensive AI-powered insights for your reception assistant</p>
      </div>

      {/* Controls Row - Mobile Responsive */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
          <Select value={selectedBusiness} onValueChange={setSelectedBusiness}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Select business" />
            </SelectTrigger>
            <SelectContent>
              {businesses.map((business) => (
                <SelectItem key={business.value} value={business.value}>
                  {business.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <DateRangeCalendar
            value={dateRange}
            onChange={setDateRange}
            className="flex-shrink-0"
          />
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-2">
          <Button variant="outline" className="flex items-center justify-center gap-2 text-sm">
            <Filter className="h-4 w-4" />
            <span className="hidden sm:inline">Advanced </span>Filters
          </Button>
          <Button variant="outline" className="flex items-center justify-center gap-2 text-sm">
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Export </span>Data
          </Button>
          <Button
            className="bg-red-800 hover:bg-red-900 text-white flex items-center justify-center gap-2 text-sm"
            onClick={handleGenerateReport}
            disabled={isGeneratingReport}
          >
            <BarChart3 className="h-4 w-4" />
            {isGeneratingReport ? "Generating..." : <><span className="hidden sm:inline">Generate AI </span>Report</>}
          </Button>
        </div>
      </div>

      {/* Enhanced KPI Cards - Mobile Responsive */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Calls</CardTitle>
            <div className="p-2 bg-red-50 rounded-lg">
              <Phone className="h-4 w-4 text-red-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpiData.totalCalls.value}</div>
            <div className="flex items-center text-xs">
              <ArrowUpIcon className="h-3 w-3 text-green-500 mr-1" />
              <span className="text-green-600">{kpiData.totalCalls.change}</span>
              <span className="text-gray-500 ml-1">from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Success Rate</CardTitle>
            <div className="p-2 bg-green-50 rounded-lg">
              <CheckCircle className="h-4 w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpiData.successRate.value}</div>
            <div className="flex items-center text-xs">
              <ArrowUpIcon className="h-3 w-3 text-green-500 mr-1" />
              <span className="text-green-600">{kpiData.successRate.change}</span>
              <span className="text-gray-500 ml-1">from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Follow-ups</CardTitle>
            <div className="p-2 bg-blue-50 rounded-lg">
              <Users className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpiData.followUps.value}</div>
            <div className="flex items-center text-xs">
              <ArrowUpIcon className="h-3 w-3 text-green-500 mr-1" />
              <span className="text-green-600">{kpiData.followUps.change}</span>
              <span className="text-gray-500 ml-1">from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">AI Confidence</CardTitle>
            <div className="p-2 bg-purple-50 rounded-lg">
              <Brain className="h-4 w-4 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpiData.aiConfidence.value}</div>
            <div className="flex items-center text-xs">
              <ArrowDownIcon className="h-3 w-3 text-red-500 mr-1" />
              <span className="text-red-600">{kpiData.aiConfidence.change}</span>
              <span className="text-gray-500 ml-1">based on historical data</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="calls" className="flex items-center gap-2">
            <Phone className="h-4 w-4" />
            Calls
          </TabsTrigger>
          <TabsTrigger value="success" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Success
          </TabsTrigger>
          <TabsTrigger value="recordings" className="flex items-center gap-2">
            <Mic className="h-4 w-4" />
            Recordings
          </TabsTrigger>
          <TabsTrigger value="transcripts" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Transcripts
          </TabsTrigger>
          <TabsTrigger value="predictions" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            Predictions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Call Volume Trends */}
            <Card className="border-l-4 border-l-red-500">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-red-600" />
                  <CardTitle>Call Volume Trends</CardTitle>
                </div>
                <p className="text-sm text-gray-600">Monthly call distribution over time</p>
              </CardHeader>
              <CardContent>
                <CallMetrics />
              </CardContent>
            </Card>

            {/* Success Distribution */}
            <Card className="border-l-4 border-l-green-500">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <CardTitle>Success Distribution</CardTitle>
                </div>
                <p className="text-sm text-gray-600">Breakdown of call outcomes</p>
              </CardHeader>
              <CardContent>
                <SuccessRate />
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {/* Business Locations */}
            <Card className="border-l-4 border-l-blue-500">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-600" />
                  <CardTitle>Business Locations</CardTitle>
                </div>
                <p className="text-sm text-gray-600">Distribution of locations by business</p>
              </CardHeader>
              <CardContent>
                <BusinessLocations />
              </CardContent>
            </Card>

            {/* Hourly Activity */}
            <Card className="border-l-4 border-l-purple-500">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-purple-600" />
                  <CardTitle>Hourly Activity</CardTitle>
                </div>
                <p className="text-sm text-gray-600">Call volume by hour of day</p>
              </CardHeader>
              <CardContent>
                <HourlyActivity />
              </CardContent>
            </Card>
          </div>

          {/* Caller Sentiment */}
          <Card className="border-l-4 border-l-green-500">
            <CardHeader>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                <CardTitle>Caller Sentiment</CardTitle>
              </div>
              <p className="text-sm text-gray-600">Sentiment analysis from call transcripts</p>
            </CardHeader>
            <CardContent>
              <CallerSentiment />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="calls" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Detailed Call Analytics</CardTitle>
              <p className="text-sm text-gray-600">In-depth analysis of call patterns and performance</p>
            </CardHeader>
            <CardContent>
              <CallMetrics />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="success" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Success Metrics Deep Dive</CardTitle>
              <p className="text-sm text-gray-600">Comprehensive success rate analysis and trends</p>
            </CardHeader>
            <CardContent>
              <SuccessRate />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recordings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Call Recordings Analysis</CardTitle>
              <p className="text-sm text-gray-600">Quality assessment and performance insights from recordings</p>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-gray-500">
                <Mic className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold mb-2">Recording Analysis Coming Soon</h3>
                <p>Advanced AI-powered analysis of call recordings will be available here.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transcripts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Call Transcripts & Keywords</CardTitle>
              <p className="text-sm text-gray-600">Text analysis and keyword extraction from call transcriptions</p>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold mb-2">Transcript Analysis Coming Soon</h3>
                <p>Automated transcription and keyword analysis will be available here.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="predictions" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>AI Business Forecast</CardTitle>
                <p className="text-sm text-gray-600 mt-1">Predictive analytics and future projections</p>
              </div>
              <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                AI Powered
              </Badge>
            </CardHeader>
            <CardContent>
              <PredictionChart />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}


// lib/types/analytics/analytics.types.ts

export interface CallMetrics {
  totalCalls: number;
  answeredCalls: number;
  missedCalls: number;
  averageCallDuration: number; // in seconds
  peakHours: Array<{ hour: number; count: number }>;
  callsByDay: Array<{ date: string; count: number }>;
}

export interface PerformanceMetrics {
  successRate: number;
  conversionRate: number;
  customerSatisfaction: number;
  averageResponseTime: number; // in seconds
  resolutionRate: number;
  followUpRate: number;
}

export interface RevenueMetrics {
  totalRevenue: number;
  revenueGrowth: number; // percentage
  averageOrderValue: number;
  revenueBySource: Array<{ source: string; amount: number }>;
  monthlyRevenue: Array<{ month: string; amount: number }>;
}

export interface BusinessAnalytics {
  businessId: string;
  businessName: string;
  period: {
    startDate: string;
    endDate: string;
  };
  callMetrics: CallMetrics;
  performanceMetrics: PerformanceMetrics;
  revenueMetrics?: RevenueMetrics;
  lastUpdated: string;
}

export interface CallAnalysis {
  id: string;
  businessId: string;
  phoneNumber: string;
  callDate: string;
  duration: number; // in seconds
  callType: 'inbound' | 'outbound';
  status: 'answered' | 'missed' | 'voicemail' | 'busy';
  sentiment: 'positive' | 'neutral' | 'negative';
  sentimentScore: number; // 0-1
  keywords: string[];
  summary?: string;
  outcome: 'appointment_booked' | 'information_provided' | 'follow_up_required' | 'no_action';
}

export interface SentimentAnalysis {
  businessId: string;
  period: {
    startDate: string;
    endDate: string;
  };
  overallSentiment: {
    positive: number;
    neutral: number;
    negative: number;
  };
  sentimentTrends: Array<{
    date: string;
    positive: number;
    neutral: number;
    negative: number;
  }>;
  topKeywords: Array<{
    keyword: string;
    frequency: number;
    sentiment: 'positive' | 'neutral' | 'negative';
  }>;
}

export interface ComparisonMetrics {
  businessId: string;
  currentPeriod: BusinessAnalytics;
  previousPeriod: BusinessAnalytics;
  industryBenchmark?: {
    successRate: number;
    averageCallDuration: number;
    conversionRate: number;
  };
}

export interface PredictionData {
  businessId: string;
  predictions: {
    nextMonth: {
      expectedCalls: number;
      expectedRevenue: number;
      confidence: number; // 0-1
    };
    nextQuarter: {
      expectedCalls: number;
      expectedRevenue: number;
      confidence: number;
    };
  };
  recommendations: Array<{
    type: 'optimization' | 'opportunity' | 'warning';
    title: string;
    description: string;
    impact: 'high' | 'medium' | 'low';
  }>;
}

export interface AnalyticsFilters {
  businessId?: string;
  startDate: string;
  endDate: string;
  phoneNumbers?: string[];
  callTypes?: Array<'inbound' | 'outbound'>;
  includeWeekends?: boolean;
}

export interface ExportOptions {
  format: 'pdf' | 'excel' | 'csv';
  sections: Array<'summary' | 'calls' | 'performance' | 'sentiment' | 'predictions'>;
  includeCharts: boolean;
  businessIds: string[];
  dateRange: {
    startDate: string;
    endDate: string;
  };
}

export interface DashboardMetrics {
  userId: string;
  totalBusinesses: number;
  totalPhoneNumbers: number;
  todayCalls: number;
  thisWeekCalls: number;
  thisMonthCalls: number;
  overallSuccessRate: number;
  topPerformingBusiness: {
    businessId: string;
    businessName: string;
    successRate: number;
  };
  alerts: Array<{
    type: 'warning' | 'info' | 'success';
    message: string;
    businessId?: string;
    timestamp: string;
  }>;
}
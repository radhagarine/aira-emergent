import React, { useState, useEffect } from 'react';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle
} from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger
} from "@/components/ui/tabs";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts';
import {
    CalendarIcon,
    Filter,
    TrendingUp,
    Loader2
} from 'lucide-react';
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { DateRange } from "react-day-picker";

// Import services and types
import { useAuth } from '@/components/providers/auth-provider';
import {
    advancedPerformanceService,
    DetailedPerformanceMetrics,
    PerformanceQueryOptions
} from '@/lib/services/performance/advanced-performance.service';
import { BusinessType } from '@/lib/types/database/business.types';
import { ServiceError } from '@/lib/types/shared/error.types';
import { BusinessTypeFilter } from '@/app/dashboard/overview/components/BusinessTypeFilter';
import { toast } from 'sonner';

// Type for chart data
interface PerformanceChartData {
    name: string;
    calls: number;
    bookedRate: number;
    successRate: number;
}

export default function PerformanceDashboard() {
    const { user } = useAuth();

    // State for filters and data
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: new Date(new Date().getFullYear(), 0, 1),
        to: new Date()
    });
    const [businessTypes, setBusinessTypes] = useState<BusinessType[]>([]);
    const [performanceMetrics, setPerformanceMetrics] = useState<DetailedPerformanceMetrics[]>([]);
    const [chartView, setChartView] = useState<'calls' | 'rates'>('calls');

    // Fetch performance metrics
    const fetchPerformanceMetrics = async () => {
        if (!user?.id) return;

        try {
            setLoading(true);

            // Prepare query options
            const queryOptions: PerformanceQueryOptions = {
                startDate: dateRange?.from,
                endDate: dateRange?.to,
                businessTypes: businessTypes.length ? businessTypes : undefined,
                groupBy: 'month'
            };

            // Fetch aggregated performance metrics
            const metrics = await advancedPerformanceService.getAggregatedBusinessesPerformance(
                user.id,
                queryOptions
            );

            setPerformanceMetrics(metrics);
        } catch (error) {
            console.error('Error fetching performance metrics:', error);

            if (error instanceof ServiceError) {
                toast.error(error.message);
            } else {
                toast.error('Failed to load performance metrics');
            }
        } finally {
            setLoading(false);
        }
    };

    // Fetch metrics on component mount and when filters change
    useEffect(() => {
        fetchPerformanceMetrics();
    }, [user?.id, dateRange, businessTypes]);

    // Prepare chart data
    const prepareChartData = (): PerformanceChartData[] => {
        return performanceMetrics.map(metric => ({
            name: metric.businessName,
            calls: metric.totalCalls,
            bookedRate: metric.bookedPercentage,
            successRate: metric.successPercentage
        }));
    };

    // Render loading state
    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
            </div>
        );
    }

    // Prepare chart data
    const chartData = prepareChartData();

    return (
        <div className="space-y-6">

            {/* Performance Visualization Tabs */}
            <Tabs defaultValue="chart" className="space-y-4">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="chart">Performance Chart</TabsTrigger>
                    <TabsTrigger value="details">Detailed Metrics</TabsTrigger>
                </TabsList>

                {/* Chart View */}
                <TabsContent value="chart">
                    <Card>
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <CardTitle>Performance Visualization</CardTitle>
                                <Select
                                    value={chartView}
                                    onValueChange={(value: 'calls' | 'rates') => setChartView(value)}
                                >
                                    <SelectTrigger className="w-[180px]">
                                        <SelectValue placeholder="Chart View" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="calls">Total Calls</SelectItem>
                                        <SelectItem value="rates">Performance Rates</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={400}>
                                {chartView === 'calls' ? (
                                    <BarChart data={chartData}>
                                        <XAxis dataKey="name" />
                                        <YAxis />
                                        <Tooltip />
                                        <Legend />
                                        <Bar dataKey="calls" fill="#8884d8" name="Total Calls" />
                                    </BarChart>
                                ) : (
                                    <BarChart data={chartData}>
                                        <XAxis dataKey="name" />
                                        <YAxis />
                                        <Tooltip />
                                        <Legend />
                                        <Bar dataKey="bookedRate" fill="#82ca9d" name="Booked Rate" />
                                        <Bar dataKey="successRate" fill="#8884d8" name="Success Rate" />
                                    </BarChart>
                                )}
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Detailed Metrics View */}
                <TabsContent value="details">
                    <Card>
                        <CardHeader>
                            <CardTitle>Business Performance Details</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {performanceMetrics.map((metric) => (
                                    <Card key={metric.businessId} className="bg-gray-50">
                                        <CardHeader>
                                            <CardTitle className="text-base">
                                                {metric.businessName}
                                                <span className="text-xs text-gray-500 ml-2">
                                                    ({metric.businessType})
                                                </span>
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-2">
                                            <div className="flex justify-between">
                                                <span>Total Calls</span>
                                                <span className="font-semibold">{metric.totalCalls}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Booked Rate</span>
                                                <span className="font-semibold text-green-600">
                                                    {metric.bookedPercentage}%
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Success Rate</span>
                                                <span className="font-semibold text-blue-600">
                                                    {metric.successPercentage}%
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Avg. Response Time</span>
                                                <span className="font-semibold">
                                                    {metric.averageResponseTime.toFixed(1)} mins
                                                </span>
                                            </div>
                                            <div className="mt-2 text-xs text-gray-500">
                                                <p>Peak Hours: {metric.peakHours.join(', ')}</p>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
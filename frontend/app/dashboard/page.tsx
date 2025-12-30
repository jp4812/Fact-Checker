// app/dashboard/page.tsx

"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts"
import { Loader2, TrendingUp, BarChart3, PieChartIcon } from "lucide-react"

interface TrendsData {
  category_counts: { [key: string]: number }
  verdict_counts: { [key: string]: number }
  reports_over_time: Array<{ date: string; count: number }>
}

// Use CSS variables directly (no hsl(...) wrapper)
const PIE_CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

export default function DashboardPage() {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
  const [data, setData] = useState<TrendsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchTrends = async () => {
      try {
        // in page.tsx
        const response = await fetch(`${API_BASE_URL}/api/trends`)
        if (!response.ok) {
          throw new Error("Failed to fetch trends data from the server.")
        }
        const trends = await response.json()

        // Backend currently returns a flat array of log entries.
        // If we receive an array, aggregate it into the shape the dashboard expects.
        if (Array.isArray(trends)) {
          const category_counts: { [key: string]: number } = {}
          const verdict_counts: { [key: string]: number } = {}

          // initialize last 30 days map
          const reportsMap: { [date: string]: number } = {}
          const now = new Date()
          const start = new Date(now)
          start.setDate(now.getDate() - 29)
          for (let d = 0; d < 30; d++) {
            const dt = new Date(start)
            dt.setDate(start.getDate() + d)
            reportsMap[dt.toISOString().slice(0, 10)] = 0
          }

          for (const item of trends) {
            const cat = item.category || "Uncategorized"
            category_counts[cat] = (category_counts[cat] || 0) + 1

            const ver = item.verdict || "Unverifiable"
            verdict_counts[ver] = (verdict_counts[ver] || 0) + 1

            if (item.timestamp) {
              const d = item.timestamp.slice(0, 10)
              if (d in reportsMap) reportsMap[d] += 1
            }
          }

          const reports_over_time = Object.entries(reportsMap).map(([date, count]) => ({ date, count }))
          setData({ category_counts, verdict_counts, reports_over_time })
        } else {
          setData(trends)
        }
      } catch (err: any) {
        setError(err.message)
      } finally {
        setIsLoading(false)
      }
    }
    fetchTrends()
  }, [])

  const categoryData = data ? Object.entries(data.category_counts).map(([name, value]) => ({ name, value })) : []
  const verdictData = data ? Object.entries(data.verdict_counts).map(([name, value]) => ({ name, value })) : []

  // small helper for consistent tick style
  const tickStyle = { fill: "var(--foreground)", fontSize: 12 }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold flex items-center justify-center gap-3">
            <TrendingUp className="size-9" />
            Misinformation Trends
          </h1>
          <p className="text-lg text-muted-foreground mt-2">
            An overview of claims analyzed by the platform.
          </p>
        </header>

        {isLoading && (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        )}
        {error && <p className="text-center text-red-500"><strong>Error:</strong> {error}</p>}
        
        {data && !isLoading && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in-0 duration-500">
            {/* Categories Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><BarChart3 className="size-5" />Top Misinformation Categories</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={categoryData} layout="vertical" margin={{ left: 10, right: 10 }}>
                    <XAxis type="number" hide />
                    <YAxis 
                      type="category" 
                      dataKey="name" 
                      width={120} 
                      tickLine={false} 
                      axisLine={false}
                      tick={tickStyle}
                    />
                    <Tooltip 
                      cursor={{ fill: 'var(--muted)' }} 
                      contentStyle={{ 
                        backgroundColor: 'var(--card)', 
                        border: '1px solid var(--border)',
                        color: 'var(--foreground)',
                      }}
                      itemStyle={{ color: 'var(--foreground)' }}
                    />
                    <Bar 
                      dataKey="value" 
                      fill="var(--primary)" 
                      radius={[0, 8, 8, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Verdict Pie Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><PieChartIcon className="size-5" />Verdict Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie 
                      data={verdictData} 
                      dataKey="value" 
                      nameKey="name" 
                      cx="50%" 
                      cy="50%" 
                      outerRadius={100} 
                      labelLine={false}
                      label={{ fill: 'var(--foreground)', fontSize: 12 }}
                    >
                       {verdictData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_CHART_COLORS[index % PIE_CHART_COLORS.length]} stroke="var(--background)" />
                      ))}
                    </Pie>
                    <Tooltip 
                       contentStyle={{ 
                        backgroundColor: 'var(--card)', 
                        border: '1px solid var(--border)',
                        color: 'var(--foreground)'
                      }}
                      itemStyle={{ color: 'var(--foreground)' }}
                    />
                    <Legend 
                      iconSize={12} 
                      wrapperStyle={{ color: 'var(--foreground)', fontSize: 12 }} 
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Reports Over Time */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><BarChart3 className="size-5" />Reports Over Last 30 Days</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data.reports_over_time}>
                    <XAxis 
                      dataKey="date"
                      tick={tickStyle}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis 
                      tick={tickStyle}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip 
                      cursor={{ fill: 'var(--muted)' }} 
                      contentStyle={{ 
                        backgroundColor: 'var(--card)', 
                        border: '1px solid var(--border)',
                        color: 'var(--foreground)'
                      }}
                      itemStyle={{ color: 'var(--foreground)' }}
                    />
                    <Bar 
                      dataKey="count" 
                      fill="var(--primary)" 
                      radius={[6, 6, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
      <Footer />
    </div>
  )
}

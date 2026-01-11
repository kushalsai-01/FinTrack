import { useEffect, useState } from 'react'
import api from '../services/api'
import { useAuthStore } from '../store/authStore'
import { TrendingUp, TrendingDown, DollarSign, Target } from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

export default function Dashboard() {
  const user = useAuthStore((state) => state.user)
  const [healthScore, setHealthScore] = useState(null)
  const [monthlySummary, setMonthlySummary] = useState(null)
  const [forecast, setForecast] = useState(null)
  const [loading, setLoading] = useState(true)

  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)

      // Load health score
      try {
        const healthRes = await api.get('/health/latest')
        if (healthRes.data.data) {
          setHealthScore(healthRes.data.data)
        }
      } catch (error) {
        console.error('Health score error:', error)
      }

      // Load monthly summary
      try {
        const summaryRes = await api.get('/analytics/monthly', {
          params: { year: currentYear, month: currentMonth },
        })
        setMonthlySummary(summaryRes.data.data)
      } catch (error) {
        console.error('Summary error:', error)
      }

      // Load forecast
      try {
        const forecastRes = await api.get('/forecast/latest', {
          params: { forecastType: '30day' },
        })
        if (forecastRes.data.data) {
          setForecast(forecastRes.data.data)
        }
      } catch (error) {
        console.error('Forecast error:', error)
      }
    } catch (error) {
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const computeHealthScore = async () => {
    try {
      await api.post('/health/compute')
      toast.success('Health score computed!')
      loadDashboardData()
    } catch (error) {
      toast.error('Failed to compute health score')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading dashboard...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {user?.firstName}!
        </h1>
        <p className="text-gray-600 mt-1">
          Here's your financial overview for {format(now, 'MMMM yyyy')}
        </p>
      </div>

      {/* Health Score Card */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Financial Health Score</h2>
          {!healthScore && (
            <button onClick={computeHealthScore} className="btn-primary text-sm">
              Compute Score
            </button>
          )}
        </div>
        {healthScore ? (
          <div>
            <div className="flex items-center space-x-4">
              <div className="text-5xl font-bold text-primary-600">
                {healthScore.overallScore.toFixed(0)}
              </div>
              <div className="flex-1">
                <div className="w-full bg-gray-200 rounded-full h-4 mb-2">
                  <div
                    className="bg-primary-600 h-4 rounded-full transition-all"
                    style={{ width: `${healthScore.overallScore}%` }}
                  />
                </div>
                <p className="text-sm text-gray-600">{healthScore.explanation}</p>
              </div>
            </div>
            {healthScore.recommendations && healthScore.recommendations.length > 0 && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm font-medium text-gray-700 mb-2">Recommendations:</p>
                <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                  {healthScore.recommendations.map((rec, idx) => (
                    <li key={idx}>{rec}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <p className="text-gray-500">No health score available. Click "Compute Score" to generate one.</p>
        )}
      </div>

      {/* Monthly Summary Cards */}
      {monthlySummary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Income</p>
                <p className="text-2xl font-bold text-green-600 mt-1">
                  ${monthlySummary.totalIncome.toFixed(2)}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500" />
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Expenses</p>
                <p className="text-2xl font-bold text-red-600 mt-1">
                  ${monthlySummary.totalExpenses.toFixed(2)}
                </p>
              </div>
              <TrendingDown className="w-8 h-8 text-red-500" />
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Savings</p>
                <p
                  className={`text-2xl font-bold mt-1 ${
                    monthlySummary.savings >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  ${monthlySummary.savings.toFixed(2)}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-primary-500" />
            </div>
          </div>
        </div>
      )}

      {/* Forecast Card */}
      {forecast && (
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">30-Day Forecast</h2>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Risk Level</span>
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  forecast.riskIndicator === 'low'
                    ? 'bg-green-100 text-green-800'
                    : forecast.riskIndicator === 'medium'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {forecast.riskIndicator.toUpperCase()}
              </span>
            </div>
            <p className="text-sm text-gray-600">
              Forecast includes {forecast.predictions?.length || 0} days of predictions
            </p>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <a
            href="/transactions"
            className="p-4 border-2 border-dashed border-gray-300 rounded-lg text-center hover:border-primary-500 transition-colors"
          >
            <p className="text-sm font-medium text-gray-700">Add Transaction</p>
          </a>
          <a
            href="/categories"
            className="p-4 border-2 border-dashed border-gray-300 rounded-lg text-center hover:border-primary-500 transition-colors"
          >
            <p className="text-sm font-medium text-gray-700">Manage Categories</p>
          </a>
          <a
            href="/analytics"
            className="p-4 border-2 border-dashed border-gray-300 rounded-lg text-center hover:border-primary-500 transition-colors"
          >
            <p className="text-sm font-medium text-gray-700">View Analytics</p>
          </a>
          <a
            href="/goals"
            className="p-4 border-2 border-dashed border-gray-300 rounded-lg text-center hover:border-primary-500 transition-colors"
          >
            <p className="text-sm font-medium text-gray-700">Set Goals</p>
          </a>
        </div>
      </div>
    </div>
  )
}

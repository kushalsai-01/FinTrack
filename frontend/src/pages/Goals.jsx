import { useState, useEffect } from 'react'
import api from '../services/api'
import { Plus, Target, Sparkles } from 'lucide-react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

export default function Goals() {
  const [goals, setGoals] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'savings_target',
    targetValue: '',
    period: 'monthly',
    startDate: format(new Date(), 'yyyy-MM-dd'),
    endDate: format(new Date(new Date().setMonth(new Date().getMonth() + 1)), 'yyyy-MM-dd'),
  })

  useEffect(() => {
    loadGoals()
  }, [])

  const loadGoals = async () => {
    try {
      setLoading(true)
      const response = await api.get('/goals')
      setGoals(response.data.data || [])
    } catch (error) {
      toast.error('Failed to load goals')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await api.post('/goals', {
        ...formData,
        targetValue: parseFloat(formData.targetValue),
      })
      toast.success('Goal created!')
      setShowModal(false)
      resetForm()
      loadGoals()
    } catch (error) {
      toast.error(error.response?.data?.error?.message || 'Failed to create goal')
    }
  }

  const generateAIRecommendations = async () => {
    try {
      const response = await api.post('/goals/generate-recommendations')
      toast.success(`Generated ${response.data.data.goals?.length || 0} AI recommendations!`)
      loadGoals()
    } catch (error) {
      toast.error('Failed to generate recommendations')
    }
  }

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      type: 'savings_target',
      targetValue: '',
      period: 'monthly',
      startDate: format(new Date(), 'yyyy-MM-dd'),
      endDate: format(new Date(new Date().setMonth(new Date().getMonth() + 1)), 'yyyy-MM-dd'),
    })
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'failed':
        return 'bg-red-100 text-red-800'
      case 'paused':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-blue-100 text-blue-800'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Goals</h1>
        <div className="flex space-x-4">
          <button
            onClick={generateAIRecommendations}
            className="btn-secondary flex items-center"
          >
            <Sparkles className="w-5 h-5 mr-2" />
            AI Recommendations
          </button>
          <button onClick={() => { resetForm(); setShowModal(true); }} className="btn-primary flex items-center">
            <Plus className="w-5 h-5 mr-2" />
            Add Goal
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading goals...</div>
      ) : goals.length === 0 ? (
        <div className="card text-center py-12">
          <Target className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500 mb-4">No goals set yet</p>
          <button onClick={() => setShowModal(true)} className="btn-primary">
            Create Your First Goal
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {goals.map((goal) => (
            <div key={goal._id} className="card">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">{goal.title}</h3>
                  {goal.description && (
                    <p className="text-sm text-gray-600 mb-2">{goal.description}</p>
                  )}
                  {goal.source === 'ai_recommended' && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 mb-2">
                      <Sparkles className="w-3 h-3 mr-1" />
                      AI Recommended
                    </span>
                  )}
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(goal.status)}`}>
                  {goal.status}
                </span>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Progress</span>
                  <span className="font-medium">{goal.progress.toFixed(0)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-primary-600 h-2 rounded-full transition-all"
                    style={{ width: `${Math.min(goal.progress, 100)}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">
                    ${goal.currentValue.toFixed(2)} / ${goal.targetValue.toFixed(2)}
                  </span>
                </div>
                <div className="pt-2 border-t text-xs text-gray-500">
                  Ends: {format(new Date(goal.endDate), 'MMM dd, yyyy')}
                </div>
                {goal.aiReasoning && (
                  <div className="pt-2 border-t">
                    <p className="text-xs text-gray-600 font-medium mb-1">AI Reasoning:</p>
                    <p className="text-xs text-gray-500">{goal.aiReasoning}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Create Goal</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="input-field"
                    rows="3"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="input-field"
                    required
                  >
                    <option value="savings_target">Savings Target</option>
                    <option value="spending_cap">Spending Cap</option>
                    <option value="category_limit">Category Limit</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Target Value</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.targetValue}
                    onChange={(e) => setFormData({ ...formData, targetValue: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Period</label>
                  <select
                    value={formData.period}
                    onChange={(e) => setFormData({ ...formData, period: e.target.value })}
                    className="input-field"
                    required
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                    <input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      className="input-field"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                    <input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      className="input-field"
                      required
                    />
                  </div>
                </div>
                <div className="flex space-x-4 pt-4">
                  <button type="submit" className="btn-primary flex-1">
                    Create Goal
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowModal(false); resetForm(); }}
                    className="btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

import { useState, useEffect } from 'react'
import api from '../services/api'
import { Plus, Edit, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'

export default function Categories() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    type: 'expense',
    monthlyBudget: '',
    icon: '💰',
    color: '#6366f1',
  })

  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = async () => {
    try {
      setLoading(true)
      const response = await api.get('/categories')
      setCategories(response.data.data || [])
    } catch (error) {
      toast.error('Failed to load categories')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingCategory) {
        await api.put(`/categories/${editingCategory._id}`, {
          ...formData,
          monthlyBudget: formData.monthlyBudget ? parseFloat(formData.monthlyBudget) : null,
        })
        toast.success('Category updated!')
      } else {
        await api.post('/categories', {
          ...formData,
          monthlyBudget: formData.monthlyBudget ? parseFloat(formData.monthlyBudget) : null,
        })
        toast.success('Category created!')
      }
      setShowModal(false)
      setEditingCategory(null)
      resetForm()
      loadCategories()
    } catch (error) {
      toast.error(error.response?.data?.error?.message || 'Failed to save category')
    }
  }

  const handleDelete = async (id, isDefault) => {
    if (isDefault) {
      toast.error('Cannot delete default categories')
      return
    }
    if (!window.confirm('Are you sure you want to delete this category?')) return

    try {
      await api.delete(`/categories/${id}`)
      toast.success('Category deleted!')
      loadCategories()
    } catch (error) {
      toast.error('Failed to delete category')
    }
  }

  const handleEdit = (category) => {
    setEditingCategory(category)
    setFormData({
      name: category.name,
      type: category.type,
      monthlyBudget: category.monthlyBudget || '',
      icon: category.icon || '💰',
      color: category.color || '#6366f1',
    })
    setShowModal(true)
  }

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'expense',
      monthlyBudget: '',
      icon: '💰',
      color: '#6366f1',
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Categories</h1>
        <button onClick={() => { resetForm(); setEditingCategory(null); setShowModal(true); }} className="btn-primary flex items-center">
          <Plus className="w-5 h-5 mr-2" />
          Add Category
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading categories...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((category) => (
            <div key={category._id} className="card">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{category.icon}</span>
                  <div>
                    <h3 className="font-semibold text-gray-900">{category.name}</h3>
                    <p className="text-sm text-gray-500">{category.type}</p>
                  </div>
                </div>
                {!category.isDefault && (
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEdit(category)}
                      className="p-1 text-gray-600 hover:text-primary-600"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(category._id, category.isDefault)}
                      className="p-1 text-gray-600 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
              {category.monthlyBudget && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm text-gray-600">Monthly Budget</p>
                  <p className="text-lg font-semibold text-gray-900">
                    ${category.monthlyBudget.toFixed(2)}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                {editingCategory ? 'Edit Category' : 'Add Category'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input-field"
                    required
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
                    <option value="income">Income</option>
                    <option value="expense">Expense</option>
                    <option value="both">Both</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Budget (Optional)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.monthlyBudget}
                    onChange={(e) => setFormData({ ...formData, monthlyBudget: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div className="flex space-x-4 pt-4">
                  <button type="submit" className="btn-primary flex-1">
                    {editingCategory ? 'Update' : 'Create'} Category
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowModal(false); setEditingCategory(null); resetForm(); }}
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

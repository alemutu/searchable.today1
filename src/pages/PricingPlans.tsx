import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Edit, Trash2, Check, X, DollarSign } from 'lucide-react';

interface Feature {
  feature: string;
  included: boolean;
}

interface PricingPlan {
  id: string;
  name: string;
  key: string;
  description: string;
  price: number;
  billing_cycle: string;
  features: Feature[];
  is_active: boolean;
  max_users: number;
  max_storage_gb: number;
}

const PricingPlans: React.FC = () => {
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingPlan, setEditingPlan] = useState<string | null>(null);
  const [newPlan, setNewPlan] = useState<Partial<PricingPlan>>({});
  const [showAddPlan, setShowAddPlan] = useState(false);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('pricing_plans')
        .select('*')
        .order('price');

      if (error) throw error;
      setPlans(data || []);
    } catch (error) {
      console.error('Error fetching pricing plans:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddPlan = async () => {
    try {
      const { data, error } = await supabase
        .from('pricing_plans')
        .insert([newPlan])
        .select()
        .single();

      if (error) throw error;

      setPlans([...plans, data]);
      setShowAddPlan(false);
      setNewPlan({});
    } catch (error) {
      console.error('Error adding pricing plan:', error);
    }
  };

  const handleUpdatePlan = async (plan: PricingPlan) => {
    try {
      const { error } = await supabase
        .from('pricing_plans')
        .update(plan)
        .eq('id', plan.id);

      if (error) throw error;

      setPlans(plans.map(p => p.id === plan.id ? plan : p));
      setEditingPlan(null);
    } catch (error) {
      console.error('Error updating pricing plan:', error);
    }
  };

  const handleDeletePlan = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this pricing plan?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('pricing_plans')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setPlans(plans.filter(p => p.id !== id));
    } catch (error) {
      console.error('Error deleting pricing plan:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Pricing Plans</h1>
        <button
          onClick={() => setShowAddPlan(true)}
          className="btn btn-primary inline-flex items-center"
        >
          <Plus className="h-5 w-5 mr-2" />
          Add Plan
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {plans.map((plan) => (
          <div key={plan.id} className="card p-6">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-medium text-gray-900">{plan.name}</h3>
                <p className="mt-1 text-sm text-gray-500">{plan.description}</p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setEditingPlan(plan.id)}
                  className="text-primary-600 hover:text-primary-900"
                >
                  <Edit className="h-5 w-5" />
                </button>
                <button
                  onClick={() => handleDeletePlan(plan.id)}
                  className="text-error-600 hover:text-error-900"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="mt-4">
              <div className="flex items-baseline">
                <span className="text-4xl font-extrabold text-gray-900">${plan.price}</span>
                <span className="ml-1 text-xl font-semibold text-gray-500">/{plan.billing_cycle}</span>
              </div>
            </div>

            <div className="mt-6">
              <h4 className="text-sm font-medium text-gray-900">Features</h4>
              <ul className="mt-2 space-y-2">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <Check className="h-5 w-5 text-success-500 mr-2" />
                    <span className="text-sm text-gray-500">{feature.feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-6 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Max Users</span>
                <span className="font-medium text-gray-900">{plan.max_users}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Storage</span>
                <span className="font-medium text-gray-900">{plan.max_storage_gb}GB</span>
              </div>
            </div>

            <div className="mt-6">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                plan.is_active ? 'bg-success-100 text-success-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {plan.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        ))}
      </div>

      {showAddPlan && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Add New Plan</h2>
            
            <div className="space-y-4">
              <div>
                <label className="form-label">Plan Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={newPlan.name || ''}
                  onChange={e => setNewPlan({ ...newPlan, name: e.target.value })}
                />
              </div>

              <div>
                <label className="form-label">Key</label>
                <input
                  type="text"
                  className="form-input"
                  value={newPlan.key || ''}
                  onChange={e => setNewPlan({ ...newPlan, key: e.target.value })}
                />
              </div>

              <div>
                <label className="form-label">Description</label>
                <textarea
                  className="form-input"
                  value={newPlan.description || ''}
                  onChange={e => setNewPlan({ ...newPlan, description: e.target.value })}
                />
              </div>

              <div>
                <label className="form-label">Price</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <DollarSign className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="number"
                    className="form-input pl-10"
                    value={newPlan.price || ''}
                    onChange={e => setNewPlan({ ...newPlan, price: parseFloat(e.target.value) })}
                  />
                </div>
              </div>

              <div>
                <label className="form-label">Billing Cycle</label>
                <select
                  className="form-input"
                  value={newPlan.billing_cycle || ''}
                  onChange={e => setNewPlan({ ...newPlan, billing_cycle: e.target.value })}
                >
                  <option value="">Select cycle</option>
                  <option value="month">Monthly</option>
                  <option value="year">Yearly</option>
                </select>
              </div>

              <div>
                <label className="form-label">Max Users</label>
                <input
                  type="number"
                  className="form-input"
                  value={newPlan.max_users || ''}
                  onChange={e => setNewPlan({ ...newPlan, max_users: parseInt(e.target.value) })}
                />
              </div>

              <div>
                <label className="form-label">Max Storage (GB)</label>
                <input
                  type="number"
                  className="form-input"
                  value={newPlan.max_storage_gb || ''}
                  onChange={e => setNewPlan({ ...newPlan, max_storage_gb: parseInt(e.target.value) })}
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setShowAddPlan(false)}
                className="btn btn-outline"
              >
                Cancel
              </button>
              <button
                onClick={handleAddPlan}
                className="btn btn-primary"
              >
                Add Plan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PricingPlans;
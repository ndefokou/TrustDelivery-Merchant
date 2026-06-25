import React, { useState, useEffect } from 'react';
import { User, Plus, Edit2, Trash2, Phone, MapPin, Loader2, X, Search } from 'lucide-react';

interface Customer {
  id: string;
  name: string;
  phone: string;
  address: string;
  latitude?: number;
  longitude?: number;
  delivery_count: number;
  last_delivery?: string;
}

const STORAGE_KEY = 'trida_customers';

const CustomersPage: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = () => {
    setLoading(true);
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setCustomers(JSON.parse(stored));
      }
    } catch (err) {
      console.error('Failed to load customers:', err);
    } finally {
      setLoading(false);
    }
  };

  const saveCustomers = (data: Customer[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    setCustomers(data);
  };

  const filteredCustomers = customers.filter(c =>
    searchQuery === '' ||
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.phone.includes(searchQuery) ||
    c.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSaveCustomer = async () => {
    if (!formData.name.trim()) {
      setFormError('Please enter a customer name');
      return;
    }
    if (!formData.phone.trim()) {
      setFormError('Please enter a phone number');
      return;
    }
    const phoneRegex = /^6[0-9]{8}$/;
    if (!phoneRegex.test(formData.phone.replace(/\s/g, ''))) {
      setFormError('Invalid phone number format (6XX XXX XXXX)');
      return;
    }
    if (!formData.address.trim()) {
      setFormError('Please enter a delivery address');
      return;
    }

    setSaving(true);
    setFormError(null);

    try {
      if (editingCustomer) {
        const updated = customers.map(c =>
          c.id === editingCustomer.id
            ? { ...c, ...formData }
            : c
        );
        saveCustomers(updated);
      } else {
        const newCustomer: Customer = {
          id: `cust-${Date.now()}`,
          name: formData.name,
          phone: formData.phone,
          address: formData.address,
          delivery_count: 0,
        };
        saveCustomers([...customers, newCustomer]);
      }
      setShowAddModal(false);
      setEditingCustomer(null);
      resetForm();
    } catch (err) {
      setFormError('Failed to save customer');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCustomer = (id: string) => {
    saveCustomers(customers.filter(c => c.id !== id));
  };

  const resetForm = () => {
    setFormData({ name: '', phone: '', address: '' });
    setFormError(null);
  };

  const openAddModal = () => {
    resetForm();
    setEditingCustomer(null);
    setShowAddModal(true);
  };

  const openEditModal = (customer: Customer) => {
    setFormData({
      name: customer.name,
      phone: customer.phone,
      address: customer.address,
    });
    setEditingCustomer(customer);
    setShowAddModal(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Customer Directory</h1>
          <p className="mt-0.5 text-sm text-gray-500">Manage your customers for faster delivery creation</p>
        </div>
        <button
          onClick={openAddModal}
          className="inline-flex items-center px-4 py-2.5 bg-orange-500 text-white rounded-xl hover:bg-orange-600 active:bg-orange-700 transition-all duration-200 font-medium text-sm shadow-sm flex-shrink-0"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Add Customer
        </button>
      </div>

      <div className="mobile-card">
        <div className="relative mb-4">
          <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search customers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="mobile-input !pl-10"
          />
        </div>

        {filteredCustomers.length === 0 ? (
          <div className="text-center py-12">
            <User className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchQuery ? 'No matching customers' : 'No customers yet'}
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              {searchQuery ? 'Try a different search term' : 'Add customers to quickly fill in delivery details'}
            </p>
            {!searchQuery && (
              <button
                onClick={openAddModal}
                className="px-5 py-2.5 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-colors text-sm font-medium"
              >
                Add Your First Customer
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredCustomers.map((customer) => (
              <div key={customer.id} className="py-4 first:pt-0 last:pb-0">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-medium text-orange-600">
                        {customer.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-medium text-gray-900 truncate">{customer.name}</h3>
                      <div className="flex items-center gap-3 mt-1">
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Phone className="w-3 h-3" />
                          <span>+237 {customer.phone}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                        <MapPin className="w-3 h-3" />
                        <span className="truncate">{customer.address}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => openEditModal(customer)}
                      className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteCustomer(customer.id)}
                      className="p-2 rounded-lg hover:bg-red-50 text-gray-500 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                {customer.delivery_count > 0 && (
                  <div className="mt-2 ml-13">
                    <span className="text-xs text-gray-400">
                      {customer.delivery_count} deliver{customer.delivery_count > 1 ? 'ies' : 'y'}
                      {customer.last_delivery && ` · Last: ${new Date(customer.last_delivery).toLocaleDateString()}`}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowAddModal(false)} />
          <div className="relative min-h-screen flex items-center justify-center p-4">
            <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md">
              <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl">
                <h2 className="text-lg font-semibold text-gray-900">
                  {editingCustomer ? 'Edit Customer' : 'Add New Customer'}
                </h2>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    <User className="w-4 h-4 inline mr-1" />
                    Customer Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Jean Pierre"
                    className="mobile-input"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    <Phone className="w-4 h-4 inline mr-1" />
                    Phone Number
                  </label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3.5 bg-gray-100 border border-r-0 border-gray-200 rounded-l-xl text-gray-600 text-sm">
                      +237
                    </span>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value.replace(/\D/g, '') }))}
                      placeholder="6XX XXX XXXX"
                      maxLength={9}
                      className="mobile-input !rounded-l-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    <MapPin className="w-4 h-4 inline mr-1" />
                    Delivery Address
                  </label>
                  <textarea
                    value={formData.address}
                    onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="Full delivery address"
                    rows={3}
                    className="mobile-input resize-none"
                  />
                </div>

                {formError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
                    <p className="text-sm text-red-600">{formError}</p>
                  </div>
                )}
              </div>

              <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4 flex justify-end gap-3 rounded-b-2xl">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveCustomer}
                  disabled={saving}
                  className="px-4 py-2.5 bg-orange-500 text-white rounded-xl hover:bg-orange-600 disabled:opacity-50 transition-colors text-sm font-medium flex items-center gap-2"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingCustomer ? 'Save Changes' : 'Add Customer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomersPage;
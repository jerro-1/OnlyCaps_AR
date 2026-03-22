import React, { useState, useEffect } from 'react';
import supabase from '../utils/supabase';
import { encryptText } from '../utils/encryption';
import Input from './Input';

const EditAccountForm = ({ profileData, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    firstname: '',
    lastname: '',
    email: '',
    shipping_address: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (profileData) {
      setFormData({
        firstname: profileData.firstname || '',
        lastname: profileData.lastname || '',
        email: profileData.email || '',
        shipping_address: profileData.shipping_address || '',
      });
    }
  }, [profileData]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const encryptedAddress = await encryptText(formData.shipping_address);

      const { data, error: updateError } = await supabase
        .from('profiles')
        .update({
          firstname: formData.firstname,
          lastname: formData.lastname,
          shipping_address: encryptedAddress,
        })
        .eq('id', profileData.id)
        .select()
        .single();

      if (updateError) throw updateError;

      const updated = { ...data, shipping_address: formData.shipping_address };
      onSave(updated);
      alert('Account updated successfully!');
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err.message || 'Failed to update account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full mx-4">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Edit Account</h2>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="First Name"
            type="text"
            name="firstname"
            value={formData.firstname}
            onChange={handleInputChange}
            placeholder="Enter your first name"
            className="w-full text-black"
          />

          <Input
            label="Last Name"
            type="text"
            name="lastname"
            value={formData.lastname}
            onChange={handleInputChange}
            placeholder="Enter your last name"
            className="w-full text-black"
          />

          <div className="mb-4">
            <label className="block text-gray-600 text-sm font-semibold mb-2">
              Email Address (not editable)
            </label>
            <input
              type="email"
              value={formData.email}
              disabled
              className="w-full px-4 py-2 border border-gray-300 rounded bg-gray-100 text-gray-600 cursor-not-allowed"
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-600 text-sm font-semibold mb-2">
              Shipping Address
            </label>
            <textarea
              name="shipping_address"
              value={formData.shipping_address}
              onChange={handleInputChange}
              placeholder="Enter your shipping address"
              className="w-full px-4 py-2 border border-gray-300 rounded text-black focus:outline-none focus:border-blue-500"
              rows="4"
            />
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold py-2 px-4 rounded transition duration-200"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 bg-gray-300 hover:bg-gray-400 disabled:bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded transition duration-200"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditAccountForm;

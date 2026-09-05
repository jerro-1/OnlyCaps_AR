import React, { useState, useEffect } from 'react';
import supabase from '../utils/supabase';
import { encryptText } from '../utils/encryption';

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
    setFormData(prev => ({ ...prev, [name]: value }));
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
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err.message || 'Failed to update account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex justify-center items-center z-[80] px-4">
      <div className="bg-[#FAF8F4] rounded-2xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] p-8 max-w-md w-full">
        <h2 className="font-heading text-xl uppercase tracking-wide text-[#14110D] mb-6">Edit account</h2>

        {error && (
          <div className="bg-[#F5E9E7] border border-[#E0B6AF] text-[#943D35] font-body text-sm px-4 py-3 rounded-lg mb-5">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block font-body text-xs text-[#6B6558] mb-2">First name</label>
            <input
              type="text"
              name="firstname"
              value={formData.firstname}
              onChange={handleInputChange}
              placeholder="Enter your first name"
              className="w-full bg-transparent border-0 border-b border-[#D8D2C4] py-2 font-body text-[#14110D] text-sm placeholder:text-[#B8B2A3] focus:outline-none focus:border-[#A9824C] transition-colors"
            />
          </div>

          <div>
            <label className="block font-body text-xs text-[#6B6558] mb-2">Last name</label>
            <input
              type="text"
              name="lastname"
              value={formData.lastname}
              onChange={handleInputChange}
              placeholder="Enter your last name"
              className="w-full bg-transparent border-0 border-b border-[#D8D2C4] py-2 font-body text-[#14110D] text-sm placeholder:text-[#B8B2A3] focus:outline-none focus:border-[#A9824C] transition-colors"
            />
          </div>

          <div>
            <label className="block font-body text-xs text-[#6B6558] mb-2">Email address (not editable)</label>
            <input
              type="email"
              value={formData.email}
              disabled
              className="w-full bg-[#F0ECE1] border border-[#E4DFD3] rounded-lg px-3 py-2 font-body text-[#8A8477] text-sm cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block font-body text-xs text-[#6B6558] mb-2">Shipping address</label>
            <textarea
              name="shipping_address"
              value={formData.shipping_address}
              onChange={handleInputChange}
              placeholder="Street, barangay, city, province, ZIP"
              rows="3"
              className="w-full bg-white border border-[#E4DFD3] rounded-lg px-3 py-2 font-body text-[#14110D] text-sm placeholder:text-[#B8B2A3] focus:outline-none focus:border-[#A9824C] transition-colors resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-[#14110D] text-[#FAF8F4] font-body text-sm font-medium py-2.5 rounded-full hover:bg-[#2A241C] transition-colors disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save changes'}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 bg-transparent border border-[#D8D2C4] text-[#14110D] font-body text-sm font-medium py-2.5 rounded-full hover:bg-[#F0ECE1] transition-colors"
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
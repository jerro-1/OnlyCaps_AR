import React, { useState, useEffect } from 'react';
import supabase from '../utils/supabase';
import { encryptText } from '../utils/encryption';

// The database still keeps shipping_address as one encrypted string -- no
// schema change needed for this. The form just gives it real structure to
// fill out instead of one open textarea: composeAddress joins the fields
// back into that same string on save, parseAddress does its best to split an
// already-saved one back into fields when the form opens.
const EMPTY_ADDRESS = { street: '', apartment: '', city: '', province: '', postalCode: '' };

const composeAddress = ({ street, apartment, city, province, postalCode }) =>
  [street, apartment, city, province, postalCode].map(s => s.trim()).filter(Boolean).join(', ');

function parseAddress(value) {
  if (!value) return EMPTY_ADDRESS;
  const parts = value.split(',').map(s => s.trim()).filter(Boolean);
  // An address saved by this same form always lands here as exactly 5 parts,
  // or 4 if apartment was left blank. Anything else is an address saved
  // before this form existed -- keep it, just unparsed, in "street" rather
  // than silently dropping it.
  if (parts.length === 5) {
    const [street, apartment, city, province, postalCode] = parts;
    return { street, apartment, city, province, postalCode };
  }
  if (parts.length === 4) {
    const [street, city, province, postalCode] = parts;
    return { ...EMPTY_ADDRESS, street, city, province, postalCode };
  }
  return { ...EMPTY_ADDRESS, street: value };
}

const EditAccountForm = ({ profileData, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    firstname: '',
    lastname: '',
    email: '',
    ...EMPTY_ADDRESS,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (profileData) {
      setFormData({
        firstname: profileData.firstname || '',
        lastname: profileData.lastname || '',
        email: profileData.email || '',
        ...parseAddress(profileData.shipping_address),
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

    if (!formData.street.trim() || !formData.city.trim() || !formData.province.trim() || !formData.postalCode.trim()) {
      setError('Please fill in street, city, province and postal code.');
      return;
    }

    setLoading(true);
    try {
      const addressText = composeAddress(formData);
      const encryptedAddress = await encryptText(addressText);

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

      const updated = { ...data, shipping_address: addressText };
      onSave(updated);
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err.message || 'Failed to update account');
    } finally {
      setLoading(false);
    }
  };

  const field = (name, label, extra = {}) => (
    <div>
      <label className="block font-body text-xs text-[#6B6558] mb-2">{label}</label>
      <input
        name={name}
        value={formData[name]}
        onChange={handleInputChange}
        className="w-full bg-transparent border-0 border-b border-[#D8D2C4] py-2 font-body text-[#14110D] text-sm placeholder:text-[#B8B2A3] focus:outline-none focus:border-[#A9824C] transition-colors"
        {...extra}
      />
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/70 flex justify-center items-center z-80 px-4">
      <div className="bg-[#FAF8F4] rounded-2xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] p-6 sm:p-8 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <h2 className="font-heading text-xl uppercase tracking-wide text-[#14110D] mb-6">Edit account</h2>

        {error && (
          <div className="bg-[#F5E9E7] border border-[#E0B6AF] text-[#943D35] font-body text-sm px-4 py-3 rounded-lg mb-5">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            {field('firstname', 'First name', { placeholder: 'Enter your first name' })}
            {field('lastname', 'Last name', { placeholder: 'Enter your last name' })}
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

          <div className="border-t border-dashed border-[#D8D2C4] pt-5">
            <p className="font-body text-xs uppercase tracking-wider text-[#A9824C] font-semibold mb-4">
              Shipping address
            </p>
            <div className="space-y-5">
              {field('street', 'Street, building or landmark', { placeholder: 'e.g. 123 Rizal St.' })}
              {field('apartment', 'Apartment, unit (optional)', { placeholder: 'e.g. Unit 4B' })}
              <div className="grid grid-cols-2 gap-4">
                {field('city', 'City', { placeholder: 'e.g. Antipolo City' })}
                {field('province', 'Province', { placeholder: 'e.g. Rizal' })}
              </div>
              {field('postalCode', 'Postal code', { placeholder: 'e.g. 1870', inputMode: 'numeric' })}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-[#14110D] text-[#FAF8F4] font-body text-sm font-medium py-3 sm:py-2.5 rounded-full hover:bg-[#2A241C] transition-colors disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save changes'}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 bg-transparent border border-[#D8D2C4] text-[#14110D] font-body text-sm font-medium py-3 sm:py-2.5 rounded-full hover:bg-[#F0ECE1] transition-colors"
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

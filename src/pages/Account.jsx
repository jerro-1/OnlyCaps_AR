import React, { useState, useEffect } from 'react';
import supabase from '../utils/supabase';
import { decryptText } from '../utils/encryption';
import Main from '../components/Main';
import EditAccountForm from '../components/EditAccountForm';

const Account = () => {
  const [session, setSession] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
    });

    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session) {
      fetchProfileData();
    } else {
      setLoading(false);
    }
  }, [session]);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (error) throw error;

      if (data && data.shipping_address) {
        try {
          data.shipping_address = await decryptText(data.shipping_address);
        } catch (decryptError) {
          console.warn('Could not decrypt shipping address', decryptError);
        }
      }

      setProfileData(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = (updatedData) => {
    setProfileData(updatedData);
    setIsEditModalOpen(false);
  };

  if (!session) {
    return (
      <Main className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Please Log In</h2>
          <p className="text-gray-600">You need to be logged in to view your account information.</p>
        </div>
      </Main>
    );
  }

  if (loading) {
    return (
      <Main className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading account information...</p>
        </div>
      </Main>
    );
  }

  return (
    <Main className="py-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800">Account Information</h1>
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg transition duration-200"
            >
              Edit Account
            </button>
          </div>

          <div className="space-y-6">
            {/* First Name */}
            <div className="border-b pb-4">
              <label className="text-gray-600 text-sm font-semibold">First Name</label>
              <p className="text-gray-800 text-lg mt-2">{profileData?.firstname || 'N/A'}</p>
            </div>

            {/* Last Name */}
            <div className="border-b pb-4">
              <label className="text-gray-600 text-sm font-semibold">Last Name</label>
              <p className="text-gray-800 text-lg mt-2">{profileData?.lastname || 'N/A'}</p>
            </div>

            {/* Email */}
            <div className="border-b pb-4">
              <label className="text-gray-600 text-sm font-semibold">Email Address</label>
              <p className="text-gray-800 text-lg mt-2">{profileData?.email || 'N/A'}</p>
            </div>

            {/* Shipping Address */}
            <div className="border-b pb-4">
              <label className="text-gray-600 text-sm font-semibold">Shipping Address</label>
              <p className="text-gray-800 text-lg mt-2">
                {profileData?.shipping_address || 'Not set'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {isEditModalOpen && (
        <EditAccountForm
          profileData={profileData}
          onClose={() => setIsEditModalOpen(false)}
          onSave={handleUpdateProfile}
        />
      )}
    </Main>
  );
};

export default Account;
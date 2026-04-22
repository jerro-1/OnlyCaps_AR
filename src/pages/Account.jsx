import React, { useState, useEffect } from 'react';
import supabase from '../utils/supabase';
import { decryptText } from '../utils/encryption';
import Main from '../components/Main';
import EditAccountForm from '../components/EditAccountForm';
import Header from '../components/Header';
import SideBar from '../components/SideBar';
import Footer from '../components/Footer';
import Footer2 from '../components/Footer2';
import Initials from '../components/Initials';
import BgImg from '../components/BgImg';

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
          <p className="text-gray-600">
            You need to be logged in to view your account information.
          </p>
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
    <>

      <Header />

      <div className="py-30 ml-20 mr-20 flex gap-8">
        <SideBar />

        {/* MAIN CONTENT */}
        <div className="w-3/4">
          <div className="max-w-3xl mx-auto">

            {/* Header */}
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-4xl font-bold text-gray-900">
                My Account
              </h1>

              <button
                onClick={() => setIsEditModalOpen(true)}
                className="bg-black hover:bg-gray-800 text-white font-semibold px-6 py-2 rounded-full transition"
              >
                Edit Profile
              </button>
            </div>

            {/* Profile Card */}
            <div className="bg-white rounded-2xl shadow-md p-8 space-y-6">

              {/* Avatar */}
              <div className="flex items-center gap-4 mb-4">
                <div className='avatar bg-black text-white flex items-center justify-center font-bold'>
                  <Initials classname="w-10 h-10" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-800">
                    {profileData?.firstname} {profileData?.lastname}
                  </h2>
                  <p className="text-gray-500 text-sm">
                    {profileData?.email}
                  </p>

                </div>
              </div>

              {/* Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

                <div className="bg-gray-50 p-4 rounded-xl">
                  <p className="text-sm text-gray-500 mb-1">First Name</p>
                  <p className="text-lg font-semibold text-gray-800">
                    {profileData?.firstname || 'N/A'}
                  </p>
                </div>

                <div className="bg-gray-50 p-4 rounded-xl">
                  <p className="text-sm text-gray-500 mb-1">Last Name</p>
                  <p className="text-lg font-semibold text-gray-800">
                    {profileData?.lastname || 'N/A'}
                  </p>
                </div>

                <div className="bg-gray-50 p-4 rounded-xl">
                  <p className="text-sm text-gray-500 mb-1">Gender</p>
                  <p className="text-lg font-semibold text-gray-800">
                    Male
                  </p>
                </div>

                <div className="bg-gray-50 p-4 rounded-xl col-span-1 sm:col-span-2">
                  <p className="text-sm text-gray-500 mb-1">Email Address</p>
                  <p className="text-lg font-semibold text-gray-800">
                    {profileData?.email || 'N/A'}
                  </p>
                </div>

                <div className="bg-gray-50 p-4 rounded-xl col-span-1 sm:col-span-2">
                  <p className="text-sm text-gray-500 mb-1">Date joined</p>
                  <p className="text-lg font-semibold text-gray-800">
                    {profileData?.created_at}
                  </p>
                </div>

                <div className="bg-gray-50 p-4 rounded-xl col-span-1 sm:col-span-2">
                  <p className="text-sm text-gray-500 mb-1">
                    Shipping Address
                  </p>
                  <p className="text-lg font-semibold text-gray-800 break-words">
                    {profileData?.shipping_address || 'Not set'}
                  </p>
                </div>

              </div>
            </div>

          </div>
        </div>
      </div>



      {/* Modal */}
      {isEditModalOpen && (
        <EditAccountForm
          profileData={profileData}
          onClose={() => setIsEditModalOpen(false)}
          onSave={handleUpdateProfile}
        />
      )}
      <Footer2 />
    </>
  );
};

export default Account;
import React from 'react'
import { HiOutlineUser, HiOutlineClipboardList } from "react-icons/hi";
import { NavLink } from 'react-router-dom';
import { Link, useNavigate } from 'react-router-dom';
import { CiLogout } from "react-icons/ci";

const SideBar = () => {
    const navigate = useNavigate();

    const handleLogout = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) {
            alert(error.message);
        } else {
            navigate("/");
        }
    };

    return (


        <div className="w-50 h-80 bg-white rounded-2xl shadow-md p-6">
            <h2 className="text-lg font-normal text-gray-800 mb-4">
                Menu
            </h2>

            <ul className="space-y-4">
                <li className="flex items-center gap-2 text-gray-700 hover:text-black cursor-pointer">
                    <HiOutlineUser /><NavLink to="/account"> Account </NavLink>
                </li>

                <li className="flex items-center gap-2 text-gray-700 hover:text-black cursor-pointer">
                    <HiOutlineClipboardList /><NavLink to="/orders"> Orders </NavLink>
                </li>
                <li className="flex items-center gap-2 text-gray-700 hover:text-black cursor-pointer">
                    <CiLogout /><button onClick={handleLogout} className="test">Logout</button>
                </li>
            </ul>
        </div>


    )
}

export default SideBar
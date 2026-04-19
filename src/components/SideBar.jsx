import React from 'react'
import { HiOutlineUser, HiOutlineClipboardList } from "react-icons/hi";
import { NavLink } from 'react-router-dom';

const SideBar = () => {
    return (

        <div className="w-1/4">
            <div className="bg-white rounded-2xl shadow-md p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">
                    Menu
                </h2>

                <ul className="space-y-4">
                    <li className="flex items-center gap-2 text-gray-700 hover:text-black cursor-pointer">
                        <HiOutlineUser /><NavLink to="/account"> Account </NavLink>
                    </li>

                    <li className="flex items-center gap-2 text-gray-700 hover:text-black cursor-pointer">
                        <HiOutlineClipboardList /><NavLink to="/orders"> Orders </NavLink>
                    </li>
                </ul>
            </div>
        </div>

    )
}

export default SideBar
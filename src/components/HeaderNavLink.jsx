import { NavLink } from "react-router-dom";

const HeaderNavLink = ({ to, linkText }) => {
    return (
        <NavLink
            className={({ isActive }) =>
                `px-3 py-1 rounded-full text-base transition-colors ${
                    isActive
                        ? "bg-[#9CE1F0]/25 text-[#14110D] font-medium"
                        : "text-[#14110D] font-normal hover:bg-[#14110D]/10"
                }`
            }
            to={to}
        >
            {linkText}
        </NavLink>
    );
};

export default HeaderNavLink;

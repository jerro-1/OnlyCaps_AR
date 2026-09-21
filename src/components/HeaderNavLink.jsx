import { NavLink } from "react-router-dom";

const HeaderNavLink = ({ to, linkText }) => {
    return (
        <NavLink
            className={({ isActive }) =>
                `px-3 py-1 rounded-full text-base transition-colors ${
                    isActive
                        ? "bg-[#14110D] text-[#9CE1F0] font-medium"
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

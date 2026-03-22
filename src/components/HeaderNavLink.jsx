import { NavLink } from "react-router-dom";

const HeaderNavLink = ({ to, linkText }) => {
    return (
        <NavLink
            className={({ isActive }) =>
                isActive ? "text-green-700 mr-4 font-bold" : "text-black mr-4 font-bold"
            }
            to={to}
        >
            {linkText}
        </NavLink>
    );
};

export default HeaderNavLink;

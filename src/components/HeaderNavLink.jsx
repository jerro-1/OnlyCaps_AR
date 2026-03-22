import { NavLink } from "react-router-dom";

const HeaderNavLink = ({ to, linkText }) => {
    return (
        <NavLink
            className={({ isActive }) =>
                isActive ? "text-green-700 " : "text-black "
            }
            to={to}
        >
            {linkText}
        </NavLink>
    );
};

export default HeaderNavLink;

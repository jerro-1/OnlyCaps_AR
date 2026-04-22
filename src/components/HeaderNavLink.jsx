import { NavLink } from "react-router-dom";

const HeaderNavLink = ({ to, linkText }) => {
    return (
        <NavLink
            className={({ isActive }) =>
                isActive ? " text-s text-white bg-black font-normal" : "text-black text-s font-normal"
            }
            to={to}
        >
            {linkText}
        </NavLink>
    );
};

export default HeaderNavLink;

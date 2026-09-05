import React from "react";

const Card = ({ children }) => {
    return (
        <div className="w-full max-w-sm bg-[#FAF8F4] rounded-2xl p-9 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.4)]">
            {children}
        </div>
    );
};

export default Card;

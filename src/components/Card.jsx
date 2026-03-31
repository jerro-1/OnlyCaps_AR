import React from "react";

const Card = ({ children }) => {
    return (
        <div className="card w-120 shadow-xl border border-gray-200" style={{ backgroundColor: '#fdfff5' }}>
            <div className="card-body">{children}</div>
        </div>
    );
};

export default Card;

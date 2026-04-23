import React from 'react'

const OrderCard = ({ children }) => {
    return (
        <div className="card w-auto border border-white" style={{ backgroundColor: '#fdfff5' }}>
            <div className="card-body">{children}</div>
        </div>
    )
};

export default OrderCard;
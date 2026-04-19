import React from 'react'

const OrderCart = ({ children }) => {
    return (
        <div className="card w-auto shadow-xl border border-gray-200" style={{ backgroundColor: '#fdfff5' }}>
            <div className="card-body">{children}</div>
        </div>
    )
};

export default OrderCart
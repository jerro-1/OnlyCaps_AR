import React from 'react'

const ShopButn = ({ children }) => {
    return (
        <>
            <div className="grid-btn btn-hover bg-white text-black px-8 py-3 rounded-full font-thin text-sm tracking-wide inline-block">
                {children}
            </div>
        </>
    )
}

export default ShopButn
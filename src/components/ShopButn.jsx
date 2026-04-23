import React from 'react'

const ShopButn = ({ children }) => {
    return (
        <>
            <div className="grid-btn btn-hover w-40 bg-white text-black px-8 py-3 rounded-full font-thin text-sm tracking-wide inline-block relative z-10 flex flex-col items-center justify-center text-center">
                {children}
            </div>
        </>
    )
}

export default ShopButn
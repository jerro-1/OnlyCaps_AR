import React from 'react'

const BgImg = ({ children }) => {
    return (
        <div
            style={{
                backgroundImage: "url('/images/Darkbg.png')",
                backgroundSize: "cover",

                backgroundRepeat: "no-repeat",
                minHeight: "100vh",



            }}
        >{children}</div>
    )
}

export default BgImg
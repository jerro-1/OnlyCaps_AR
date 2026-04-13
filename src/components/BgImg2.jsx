import React from 'react'

const BgImg2 = ({ children }) => {
    return (
        <div
            style={{
                backgroundImage: "url('/images/FITTED CAPS.png')",
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
                minHeight: "100vh",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                overflow: "hidden"
            }}
        >{children}</div>
    )
}

export default BgImg2
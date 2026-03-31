import React from 'react'

const BgImg = ({ children }) => {
    return (
        <div
            style={{
                backgroundImage: "url('/images/ocbg.png')",
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

export default BgImg
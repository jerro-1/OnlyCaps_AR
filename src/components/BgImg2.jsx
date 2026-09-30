import React from 'react'

const BgImg2 = ({ children, image = '/images/FITTED CAPS.webp' }) => {
    return (
        <div
            style={{
                backgroundImage: `url('${image}')`,
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
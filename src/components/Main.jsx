import React from "react";

const Main = ({ children, className }) => {
    return (
        <main className={`flex-1 max-w-7xl mx-auto w-full md:px-2 text-black lg:px-0 pt-5 ${className}`}>
            {children}
        </main>
    );
};

export default Main;

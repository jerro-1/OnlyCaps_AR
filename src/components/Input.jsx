import React from "react";

const Input = ({ label, name, type = "text", className = "", placeholder, onChange }) => {
    return (
        <div className="mb-5">
            <label className="block font-body text-xs text-[#6B6558] mb-2">{label}</label>
            <input
                name={name}
                type={type}
                placeholder={placeholder}
                onChange={onChange}
                className={`w-full bg-transparent border-0 border-b border-[#D8D2C4] py-2 font-body text-[#14110D] text-sm placeholder:text-[#B8B2A3] focus:outline-none focus:border-[#5EC4D6] transition-colors ${className}`}
            />
        </div>
    );
};

export default Input;

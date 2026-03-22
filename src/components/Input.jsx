import React from "react";

const Input = ({ label, name, type, className, placeholder, onChange }) => {
    return (
        <fieldset className="fieldset">
            <legend className="fieldset-legend">{label}</legend>
            <input
                name={name}
                type={type}
                className={`input ${className}`}
                placeholder={placeholder}
                onChange={onChange}
            />
        </fieldset>
    );
};

export default Input;

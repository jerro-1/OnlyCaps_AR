import React from 'react'

const ShopButn = ({ children, onClick, className = '', variant = 'primary' }) => {
  const variants = {
    primary: 'btn btn-primary',
    secondary: 'btn btn-secondary',
    outline: 'btn btn-outline',
    ghost: 'btn btn-ghost',
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={`${variants[variant]} ${className}`}
    >
      {children}
    </button>
  )
}

export default ShopButn
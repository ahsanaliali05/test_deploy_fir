import React from 'react';

const PasswordStrength = ({ password }) => {
  const getStrength = (pwd) => {
    let strength = 0;
    if (pwd.length >= 4) strength += 1;
    if (pwd.length >= 8) strength += 1;
    if (/[A-Z]/.test(pwd)) strength += 1;
    if (/[0-9]/.test(pwd)) strength += 1;
    if (/[^A-Za-z0-9]/.test(pwd)) strength += 1;
    return Math.min(strength, 4);
  };

  const strength = getStrength(password);
  const strengthText = ['Very Weak', 'Weak', 'Medium', 'Strong', 'Very Strong'][strength];
  const colors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500', 'bg-emerald-600'];

  if (!password) return null;

  return (
    <div className="mt-1">
      <div className="flex gap-1 h-1">
        {[...Array(4)].map((_, i) => (
          <div key={i} className={`h-full flex-1 rounded ${i < strength ? colors[strength] : 'bg-gray-200'}`} />
        ))}
      </div>
      <p className="text-xs mt-1 text-gray-600 dark:text-gray-400">{strengthText}</p>
    </div>
  );
};

export default PasswordStrength;
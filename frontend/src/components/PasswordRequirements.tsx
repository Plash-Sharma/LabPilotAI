import React from 'react';
import { Check, X } from 'lucide-react';

export interface PasswordChecks {
  minLength: boolean;
  hasUpper: boolean;
  hasLower: boolean;
  hasNumber: boolean;
  hasSpecial: boolean;
}

export function checkPasswordComplexity(password: string): PasswordChecks {
  return {
    minLength: password.length >= 8,
    hasUpper: /[A-Z]/.test(password),
    hasLower: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[!@#$%^&*(),.?":{}|<>\-_+=\[\]\\\/~`]/.test(password),
  };
}

export function isPasswordValid(password: string): boolean {
  const c = checkPasswordComplexity(password);
  return c.minLength && c.hasUpper && c.hasLower && c.hasNumber && c.hasSpecial;
}

export function getPasswordValidationError(password: string): string | null {
  const c = checkPasswordComplexity(password);
  if (!c.minLength) return 'Password must be at least 8 characters long.';
  if (!c.hasUpper) return 'Password must contain at least one uppercase letter (A-Z).';
  if (!c.hasLower) return 'Password must contain at least one lowercase letter (a-z).';
  if (!c.hasNumber) return 'Password must contain at least one number (0-9).';
  if (!c.hasSpecial) return 'Password must contain at least one special character (!@#$%^&*).';
  return null;
}

interface PasswordRequirementsViewProps {
  password: string;
  showAlways?: boolean;
}

export const PasswordRequirementsView: React.FC<PasswordRequirementsViewProps> = ({
  password,
  showAlways = false,
}) => {
  if (!password && !showAlways) return null;
  const checks = checkPasswordComplexity(password || '');

  const rules = [
    { label: 'Minimum 8 characters', met: checks.minLength },
    { label: 'Uppercase letter (A-Z)', met: checks.hasUpper },
    { label: 'Lowercase letter (a-z)', met: checks.hasLower },
    { label: 'At least one number (0-9)', met: checks.hasNumber },
    { label: 'Special character (!@#$%^&*)', met: checks.hasSpecial },
  ];

  return (
    <div className="p-3 bg-gray-50/90 dark:bg-gray-800/80 rounded-xl border border-gray-200 dark:border-gray-750 text-xs space-y-1.5 transition-all">
      <div className="flex items-center justify-between mb-1">
        <span className="font-semibold text-gray-700 dark:text-gray-300 text-[11px]">
          Password Requirements:
        </span>
        <span className="text-[10px] font-medium text-gray-400 dark:text-gray-500">
          {rules.filter(r => r.met).length} of 5 met
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
        {rules.map((rule, idx) => (
          <div
            key={idx}
            className={`flex items-center space-x-1.5 transition-colors ${
              rule.met
                ? 'text-emerald-600 dark:text-emerald-400 font-medium'
                : 'text-gray-400 dark:text-gray-500'
            }`}
          >
            {rule.met ? (
              <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            ) : (
              <X className="w-3.5 h-3.5 text-gray-300 dark:text-gray-600 shrink-0" />
            )}
            <span className="text-[11px]">{rule.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

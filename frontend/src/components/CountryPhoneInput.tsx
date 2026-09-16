import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Search, Check, Sparkles, Phone, Mail } from 'lucide-react';
import { COUNTRIES, type CountryInfo, detectUserCountry } from '../utils/countryDetect';
import './CountryPhoneInput.css';

interface CountryPhoneInputProps {
  value: string;
  onChange: (value: string, country?: CountryInfo) => void;
  placeholder?: string;
  required?: boolean;
  autoFocus?: boolean;
  onCountryDetected?: (country: CountryInfo) => void;
}

export const CountryPhoneInput: React.FC<CountryPhoneInputProps> = ({
  value,
  onChange,
  placeholder,
  required = false,
  autoFocus = false,
  onCountryDetected
}) => {
  const [selectedCountry, setSelectedCountry] = useState<CountryInfo>(COUNTRIES[0]);
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAutoDetected, setIsAutoDetected] = useState(false);
  const [mode, setMode] = useState<'phone' | 'email'>('phone');

  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Автоопределение страны при монтировании компонента
  useEffect(() => {
    let isMounted = true;
    detectUserCountry().then((country) => {
      if (isMounted && country) {
        setSelectedCountry(country);
        setIsAutoDetected(true);
        if (onCountryDetected) {
          onCountryDetected(country);
        }
      }
    });
    return () => {
      isMounted = false;
    };
  }, [onCountryDetected]);

  // Закрытие дропдауна при клике вне элемента
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Автоматическое переключение страны, если пользователь вводит другой телефонный код (+375, +998, etc.)
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    onChange(val, selectedCountry);

    // Если ввод содержит @, это email
    if (val.includes('@')) {
      if (mode !== 'email') setMode('email');
      return;
    }

    // Проверяем, совпадает ли начало с кодом другой страны
    if (val.startsWith('+')) {
      const match = COUNTRIES.find(c => val.startsWith(c.dialCode) && c.code !== selectedCountry.code);
      if (match) {
        setSelectedCountry(match);
      }
    }
  };

  const handleSelectCountry = (country: CountryInfo) => {
    setSelectedCountry(country);
    setIsOpen(false);
    setSearchQuery('');
    setIsAutoDetected(false);

    if (onCountryDetected) {
      onCountryDetected(country);
    }

    // Если поле пустое или уже содержало телефонный код, обновляем префикс
    if (!value || value.startsWith('+')) {
      onChange(country.dialCode + ' ', country);
    } else {
      onChange(value, country);
    }

    inputRef.current?.focus();
  };

  const filteredCountries = COUNTRIES.filter(c => 
    c.nameRu.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.nameEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.dialCode.includes(searchQuery) ||
    c.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="country-phone-wrapper" ref={dropdownRef}>
      {/* Кнопка выбора страны с флагом и кодом */}
      <button
        type="button"
        className={`country-select-btn ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        title={`Страна: ${selectedCountry.nameRu} (${selectedCountry.dialCode})`}
      >
        <span className="country-flag-badge">{selectedCountry.flag}</span>
        <span className="country-dial-code">{selectedCountry.dialCode}</span>
        {isAutoDetected && (
          <span className="auto-detect-dot" title="Страна определена автоматически">
            <Sparkles size={10} />
          </span>
        )}
        <ChevronDown size={14} className={`country-chevron ${isOpen ? 'open' : ''}`} />
      </button>

      {/* Поле ввода телефона или почты */}
      <div className="country-input-box">
        {value.includes('@') ? (
          <Mail size={16} className="contact-type-icon mail" />
        ) : (
          <Phone size={16} className="contact-type-icon phone" />
        )}
        <input
          ref={inputRef}
          type="text"
          className="country-phone-input"
          placeholder={placeholder || `${selectedCountry.mask} или email`}
          value={value}
          onChange={handleInputChange}
          required={required}
          autoFocus={autoFocus}
        />
      </div>

      {/* Выпадающий список стран */}
      {isOpen && (
        <div className="country-dropdown-menu">
          <div className="country-search-box">
            <Search size={15} className="country-search-icon" />
            <input
              type="text"
              className="country-search-input"
              placeholder="Поиск страны или кода (+7, +375...)"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              autoFocus
            />
          </div>

          <div className="country-list-scroll">
            {filteredCountries.length === 0 ? (
              <div className="country-not-found">Страна не найдена</div>
            ) : (
              filteredCountries.map(c => {
                const isSelected = c.code === selectedCountry.code;
                return (
                  <div
                    key={c.code}
                    className={`country-item ${isSelected ? 'selected' : ''}`}
                    onClick={() => handleSelectCountry(c)}
                  >
                    <span className="country-item-flag">{c.flag}</span>
                    <span className="country-item-name">{c.nameRu}</span>
                    <span className="country-item-code">{c.dialCode}</span>
                    {isSelected && <Check size={14} className="country-item-check" />}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

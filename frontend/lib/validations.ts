export const validateEmail = (email: string): string | null => {
  if (!email) return 'Email is required';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return 'Please enter a valid email address';
  }
  return null;
};

export const validatePassword = (password: string): string | null => {
  if (!password) return 'Password is required';
  if (password.length < 6) return 'Password must be at least 6 characters';
  if (!/[A-Z]/.test(password)) return 'Password must contain at least one uppercase letter';
  if (![0-9].some((n) => password.includes(n.toString()))) {
    return 'Password must contain at least one number';
  }
  return null;
};

export const validateUsername = (username: string): string | null => {
  if (!username) return 'Username is required';
  if (username.length < 3) return 'Username must be at least 3 characters';
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return 'Username can only contain letters, numbers, and underscores';
  }
  return null;
};

export const validatePhone = (phone: string): string | null => {
  if (!phone) return 'Phone number is required';
  const phoneRegex = /^[0-9]{10}$/;
  if (!phoneRegex.test(phone)) return 'Please enter a valid 10-digit phone number';
  return null;
};

export const validatePincode = (pincode: string): string | null => {
  if (!pincode) return 'Pincode is required';
  const pincodeRegex = /^[1-9][0-9]{5}$/;
  if (!pincodeRegex.test(pincode)) return 'Please enter a valid 6-digit pincode';
  return null;
};

export const validateShopName = (shopName: string): string | null => {
  if (!shopName) return 'Shop name is required';
  if (shopName.length < 3) return 'Shop name must be at least 3 characters';
  return null;
};

interface AddressFields {
  street: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
}

export const validateAddress = (address: AddressFields): Record<string, string> => {
  const errors: Record<string, string> = {};
  
  if (!address.street) errors.street = 'Street address is required';
  if (!address.city) errors.city = 'City is required';
  if (!address.state) errors.state = 'State is required';
  
  const pincodeError = validatePincode(address.pincode);
  if (pincodeError) errors.pincode = pincodeError;
  
  return errors;
};

export const validateRegistrationForm = (
  formData: {
    username: string;
    email: string;
    password: string;
    confirmPassword: string;
    shopName?: string;
    phone?: string;
    address?: AddressFields;
  },
  isSeller: boolean
): Record<string, string> => {
  const errors: Record<string, string> = {};
  
  // Validate username
  const usernameError = validateUsername(formData.username);
  if (usernameError) errors.username = usernameError;
  
  // Validate email
  const emailError = validateEmail(formData.email);
  if (emailError) errors.email = emailError;
  
  // Validate password
  const passwordError = validatePassword(formData.password);
  if (passwordError) {
    errors.password = passwordError;
  } else if (formData.password !== formData.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match';
  }
  
  // Validate seller-specific fields
  if (isSeller) {
    const shopNameError = validateShopName(formData.shopName || '');
    if (shopNameError) errors.shopName = shopNameError;
    
    const phoneError = validatePhone(formData.phone || '');
    if (phoneError) errors.phone = phoneError;
    
    if (formData.address) {
      const addressErrors = validateAddress(formData.address);
      Object.entries(addressErrors).forEach(([key, error]) => {
        errors[`address.${key}`] = error;
      });
    }
  }
  
  return errors;
};

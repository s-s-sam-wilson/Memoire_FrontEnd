"use client";
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { Pacifico, Raleway } from "next/font/google";

const pacifico = Pacifico({ subsets: ["latin"], weight: "400" });
const raleway = Raleway({ subsets: ["latin"], weight: "400" });

export default function SignUp() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
    });
    const [errors, setErrors] = useState({});
    const [serverError, setServerError] = useState('');
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const checkAuthStatus = async () => {
            try {
                const response = await axios.get('https://memoire.pythonanywhere.com/user/', {
                    withCredentials: true,
                });
                if (response.status === 200 && response.data.userid) {
                    router.push('/');
                }
            } catch (error) {
                console.log('User not logged in:', error.response?.status);
            } finally {
                setLoading(false);
            }
        };
        checkAuthStatus();
    }, [router]);

    const validateField = (name, value) => {
        const newErrors = {};
        switch (name) {
            case 'name':
                if (!value) {
                    newErrors.name = 'Name is required';
                } else if (value.length < 2) {
                    newErrors.name = 'Name must be at least 2 characters';
                }
                break;
            case 'email':
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!value) {
                    newErrors.email = 'Email is required';
                } else if (!emailRegex.test(value)) {
                    newErrors.email = 'Please enter a valid email';
                }
                break;
            case 'password':
                const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
                if (!value) {
                    newErrors.password = 'Password is required';
                } else if (!passwordRegex.test(value)) {
                    newErrors.password =
                        'Password must be at least 8 characters, with 1 uppercase, 1 lowercase, 1 number, and 1 special character';
                }
                if (formData.confirmPassword && value !== formData.confirmPassword) {
                    newErrors.confirmPassword = 'Passwords do not match';
                }
                break;
            case 'confirmPassword':
                if (!value) {
                    newErrors.confirmPassword = 'Please confirm your password';
                } else if (value !== formData.password) {
                    newErrors.confirmPassword = 'Passwords do not match';
                }
                break;
            default:
                break;
        }
        return newErrors;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        const fieldErrors = validateField(name, value);
        setErrors((prev) => {
            const updatedErrors = { ...prev, ...fieldErrors };
            if (!fieldErrors[name]) delete updatedErrors[name];
            if (name === 'password' && !fieldErrors.password && value === formData.confirmPassword) {
                delete updatedErrors.confirmPassword;
            }
            if (name === 'confirmPassword' && value === formData.password) {
                delete updatedErrors.confirmPassword;
            }
            return updatedErrors;
        });
        setServerError('');
    };

    const validateForm = () => {
        const newErrors = {};
        ['name', 'email', 'password'].forEach((field) => {
            const fieldErrors = validateField(field, formData[field]);
            Object.assign(newErrors, fieldErrors);
        });
        if (formData.confirmPassword && formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
        }
        setErrors(newErrors);
        const criticalFields = ['name', 'email', 'password'];
        return criticalFields.every((field) => !newErrors[field]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) {
            console.log('Validation failed:', errors);
            return;
        }
        const signupData = {
            name: formData.name,
            email: formData.email,
            password: formData.password,
        };
        try {
            const response = await axios.post('https://memoire.pythonanywhere.com/signup/', signupData, {
                withCredentials: true,
            });
            console.log('Signup successful:', response.data);
            router.push('/login');
        } catch (error) {
            if (error.response) {
                const { status, data } = error.response;
                if (status === 400) {
                    setErrors((prev) => ({ ...prev, ...data }));
                    setServerError('Please check your input and try again.');
                } else {
                    setServerError('Something went wrong. Please try again.');
                }
            } else {
                setServerError('Network error. Please check your connection.');
            }
            console.error('Signup error:', error);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#FFD3A5] to-[#FD6585]">
                <p className={`text-2xl text-gray-900 font-semibold animate-pulse ${pacifico.className}`}>
                    Checking your status...
                </p>
            </div>
        );
    }

    return (
        <div className={`min-h-screen bg-gradient-to-br from-[#FFF3E6] to-[#FDE2E4] px-4 py-8 ${raleway.className}`}>
            <div className="max-w-5xl mx-auto">
                {/* App Title - Centered on Mobile, Top Left on Desktop */}
                <div className="text-center lg:text-left mb-6">
                    <h1 className={`text-4xl font-bold text-gray-800 ${pacifico.className}`}>Memoire</h1>
                    <p className="text-sm text-gray-600 lg:mb-8">Your Slambook Adventure Starts Here!</p>
                </div>

                <div className="flex flex-col lg:flex-row gap-8 max-w-5xl mx-auto">
                    {/* SignUp Form Section */}
                    <div className="w-full lg:w-1/2 bg-white p-6 rounded-xl shadow-md border border-gray-200 space-y-6">
                        <div className="text-center">
                            <h1 className={`text-3xl text-gray-800 font-semibold ${pacifico.className}`}>Sign Up</h1>
                            <h3 className="mt-2 text-gray-600 md:text-lg">Join the Fun with Friends!</h3>
                        </div>

                        {serverError && (
                            <div className="bg-red-100 text-red-700 p-4 rounded-xl shadow-sm md:text-lg text-center border border-red-300">
                                {serverError}
                            </div>
                        )}

                        <form className="space-y-5" onSubmit={handleSubmit}>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Your Cool Name
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-transparent shadow-sm placeholder-gray-400 text-gray-900"
                                    placeholder="Something funky!"
                                />
                                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Email (Shh, it’s safe!)
                                </label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-transparent shadow-sm placeholder-gray-400 text-gray-900"
                                    placeholder="you@awesome.com"
                                />
                                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Secret Password
                                </label>
                                <input
                                    type="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-transparent shadow-sm placeholder-gray-400 text-gray-900"
                                    placeholder="Make it fun!"
                                />
                                {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Confirm It!
                                </label>
                                <input
                                    type="password"
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-transparent shadow-sm placeholder-gray-400 text-gray-900"
                                    placeholder="Type it again!"
                                />
                                {errors.confirmPassword && (
                                    <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>
                                )}
                            </div>

                            <div>
                                <input
                                    type="submit"
                                    value="Join the Slambook!"
                                    className="w-full bg-pink-500 text-white py-2 px-4 rounded-full hover:bg-pink-600 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:ring-offset-2 transition duration-200 cursor-pointer font-medium shadow-md"
                                />
                            </div>
                        </form>

                        <div className="text-center mt-4">
                            <p className="text-sm text-gray-600">
                                Already in the gang?{' '}
                                <a
                                    href="/login"
                                    className="text-pink-600 hover:text-pink-700 font-medium transition duration-200 underline"
                                >
                                    Jump In!
                                </a>
                            </p>
                        </div>
                    </div>

                    {/* Desktop-only Extra Content */}
                    <div className="hidden lg:block w-1/2 p-6 text-gray-800">
                        <h2 className={`text-3xl font-semibold mb-4 ${pacifico.className}`}>Why Join Memoire?</h2>
                        <p className="text-gray-600 mb-4">
                            Memoire brings back the joy of slambooks in a digital world. Sign up to create, share, and cherish memories with your friends!
                        </p>
                        <ul className="space-y-3 text-gray-600">
                            <li className="flex items-start">
                                <span className="text-pink-500 mr-2">✨</span>
                                Craft your unique slambook story.
                            </li>
                            <li className="flex items-start">
                                <span className="text-pink-500 mr-2">📖</span>
                                Keep your memories safe and sound.
                            </li>
                            <li className="flex items-start">
                                <span className="text-pink-500 mr-2">💌</span>
                                Connect with friends in a fun way.
                            </li>
                        </ul>
                        <button
                            onClick={() => router.push('/login')}
                            className="mt-6 bg-pink-500 text-white px-6 py-2 rounded-full font-medium hover:bg-pink-600 transition duration-300 shadow-md"
                        >
                            Already Signed Up? Login!
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
'use client'

import Link from 'next/link'
import { useAuth } from '../contexts/AuthContext'
import { AuthButton } from './AuthButton'

export function Navigation() {
  const { isAuthenticated, user } = useAuth()

  return (
    <nav className="bg-[#0A050B] border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link href="/" className="flex items-center">
              <span className="text-white text-xl font-bold">Soltar</span>
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            {isAuthenticated && (
              <>
                <Link 
                  href="/dashboard" 
                  className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm"
                >
                  Dashboard
                </Link>
                <Link 
                  href="/profile" 
                  className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm"
                >
                  Profile
                </Link>
              </>
            )}
            <AuthButton />
          </div>
        </div>
      </div>
    </nav>
  )
} 
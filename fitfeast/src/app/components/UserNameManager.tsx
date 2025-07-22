'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

interface UserNameManagerProps {
  onNameSet: (name: string) => void;
}

export default function UserNameManager({ onNameSet }: UserNameManagerProps) {
  const { data: session } = useSession();
  const [userName, setUserName] = useState<string>('');

  useEffect(() => {
    const storedName = localStorage.getItem('userName');
    if (storedName) {
      setUserName(storedName);
      onNameSet(storedName);
    } else if (session?.user?.name) {
      setUserName(session.user.name);
      localStorage.setItem('userName', session.user.name);
      onNameSet(session.user.name);
    }
  }, [session?.user?.name, onNameSet]);

  const handleSetUserName = () => {
    const name = prompt('Please enter your name:');
    if (name) {
      localStorage.setItem('userName', name);
      setUserName(name);
      onNameSet(name);
    }
  };

  return (
    <div className="flex items-center gap-4">
      {userName ? (
        <>
          <span className="text-gray-200">Welcome, {userName}!</span>
          <button
            onClick={handleSetUserName}
            className="text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            Change Name
          </button>
        </>
      ) : (
        <button
          onClick={handleSetUserName}
          className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
        >
          Set Your Name
        </button>
      )}
    </div>
  );
}
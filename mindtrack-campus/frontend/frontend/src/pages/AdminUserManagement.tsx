import { useState } from 'react';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { Button } from '../components/Button';

// Mock user data
interface User {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'oss_admin';
  status: 'active' | 'suspended';
}

const MOCK_USERS: User[] = [
  { id: '1', name: 'Alex Reyes', email: 'alex.reyes@student.edu', role: 'student', status: 'active' },
  { id: '2', name: 'Maria Santos', email: 'msantos@student.edu', role: 'student', status: 'suspended' },
  { id: '3', name: 'Dr. John Admin', email: 'jadmin@staff.edu', role: 'oss_admin', status: 'active' },
];

export const AdminUserManagement = () => {
  const [users, setUsers] = useState<User[]>(MOCK_USERS);
  const [searchQuery, setSearchQuery] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Filter users based on the search query
  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleUserStatus = (id: string, currentStatus: 'active' | 'suspended') => {
    setProcessingId(id);
    
    // Simulate PATCH /admin/users API call
    setTimeout(() => {
      setUsers(users.map(user => 
        user.id === id 
          ? { ...user, status: currentStatus === 'active' ? 'suspended' : 'active' } 
          : user
      ));
      setProcessingId(null);
    }, 500);
  };

  return (
    <div className="flex flex-col gap-8">
      
      {/* Header & Search */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-500 mt-2">Manage student and administrator accounts.</p>
        </div>
        <div className="w-full md:w-72">
          <Input 
            label="" 
            placeholder="Search by name or email..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* User Table */}
      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-sm text-gray-600">
                <th className="px-6 py-4 font-semibold">Name</th>
                <th className="px-6 py-4 font-semibold">Email</th>
                <th className="px-6 py-4 font-semibold">Role</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500 italic">
                    No users found matching "{searchQuery}".
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">{user.name}</td>
                    <td className="px-6 py-4 text-gray-500">{user.email}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-bold rounded-full uppercase tracking-wider ${
                        user.role === 'oss_admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {user.role === 'oss_admin' ? 'Admin' : 'Student'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-bold rounded-full uppercase tracking-wider ${
                        user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button 
                        variant={user.status === 'active' ? 'danger' : 'primary'}
                        className="text-xs px-3 py-1.5"
                        isLoading={processingId === user.id}
                        onClick={() => toggleUserStatus(user.id, user.status)}
                        disabled={user.role === 'oss_admin'} // Prevent admins from suspending themselves
                      >
                        {user.status === 'active' ? 'Suspend' : 'Activate'}
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

    </div>
  );
};
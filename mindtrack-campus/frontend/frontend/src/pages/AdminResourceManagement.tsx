import { useState } from 'react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Select } from '../components/Select';
import { TextArea } from '../components/TextArea';

interface Resource {
  id: string;
  title: string;
  category: 'on-campus' | 'hotline' | 'external' | 'self-care';
  description: string;
  contact: string;
}

const MOCK_RESOURCES: Resource[] = [
  {
    id: '1',
    title: 'University Guidance Office',
    category: 'on-campus',
    description: 'Free counseling sessions for all enrolled students.',
    contact: 'Guidance Bldg, Room 101'
  },
  {
    id: '2',
    title: 'National Crisis Hotline',
    category: 'hotline',
    description: '24/7 mental health crisis support.',
    contact: '1553'
  }
];

export const AdminResourceManagement = () => {
  const [resources, setResources] = useState<Resource[]>(MOCK_RESOURCES);
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState<Partial<Resource>>({});

  const handleAddNew = () => {
    setFormData({ category: 'on-campus' });
    setIsEditing(true);
  };

  const handleEdit = (resource: Resource) => {
    setFormData(resource);
    setIsEditing(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this resource?')) {
      setResources(resources.filter(r => r.id !== id));
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    setTimeout(() => {
      if (formData.id) {
        // Update existing resource
        setResources(resources.map(r => r.id === formData.id ? { ...r, ...formData } as Resource : r));
      } else {
        // Create new resource
        const newResource = { ...formData, id: Date.now().toString() } as Resource;
        setResources([...resources, newResource]);
      }
      
      setIsSubmitting(false);
      setIsEditing(false);
    }, 600);
  };

  return (
    <div className="flex flex-col gap-8">
      
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Resource Directory</h1>
          <p className="text-gray-500 mt-2">Manage the support resources visible to students.</p>
        </div>
        {!isEditing && (
          <Button variant="primary" onClick={handleAddNew}>
            + Add New Resource
          </Button>
        )}
      </div>

      {isEditing ? (
        /* Create / Edit Form */
        <Card>
          <form onSubmit={handleSave} className="flex flex-col gap-4">
            <h2 className="text-xl font-bold mb-2">
              {formData.id ? 'Edit Resource' : 'Add New Resource'}
            </h2>
            
            <Input 
              label="Resource Title" 
              value={formData.title || ''} 
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              required 
            />
            
            <Select 
              label="Category" 
              value={formData.category || 'on-campus'}
              onChange={(e) => setFormData({...formData, category: e.target.value as Resource['category']})}
            >
              <option value="on-campus">On-Campus Support</option>
              <option value="hotline">Crisis Hotline</option>
              <option value="external">External Referral</option>
              <option value="self-care">Self-Care Guide</option>
            </Select>

            <TextArea 
              label="Description" 
              value={formData.description || ''}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              required
            />

            <Input 
              label="Contact Info / Location / Link" 
              value={formData.contact || ''} 
              onChange={(e) => setFormData({...formData, contact: e.target.value})}
              required 
            />

            <div className="flex justify-end gap-3 mt-4 pt-4 border-t">
              <Button type="button" variant="secondary" onClick={() => setIsEditing(false)}>Cancel</Button>
              <Button type="submit" variant="primary" isLoading={isSubmitting}>Save Resource</Button>
            </div>
          </form>
        </Card>
      ) : (
        /* Resource Table */
        <Card className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-sm text-gray-600">
                  <th className="px-6 py-4 font-semibold">Title</th>
                  <th className="px-6 py-4 font-semibold">Category</th>
                  <th className="px-6 py-4 font-semibold">Contact</th>
                  <th className="px-6 py-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {resources.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-gray-500 italic">
                      No resources available.
                    </td>
                  </tr>
                ) : (
                  resources.map((resource) => (
                    <tr key={resource.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-medium text-gray-900">{resource.title}</td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 text-xs font-bold rounded-full bg-blue-50 text-blue-700 uppercase tracking-wider">
                          {resource.category.replace('-', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-500 text-sm">{resource.contact}</td>
                      <td className="px-6 py-4 text-right flex justify-end gap-2">
                        <Button variant="secondary" className="text-xs px-3 py-1.5" onClick={() => handleEdit(resource)}>Edit</Button>
                        <Button variant="danger" className="text-xs px-3 py-1.5" onClick={() => handleDelete(resource.id)}>Delete</Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

    </div>
  );
};
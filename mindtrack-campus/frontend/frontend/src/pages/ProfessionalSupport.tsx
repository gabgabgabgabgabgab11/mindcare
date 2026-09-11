import { Card } from '../components/Card';

export const ProfessionalSupport = () => {
  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-8">
      
      <div className="text-center pb-6 border-b border-gray-200">
        <h1 className="text-3xl font-bold text-gray-900">Professional Support</h1>
        <p className="text-gray-500 mt-4 text-lg max-w-2xl mx-auto">
          MindCare is a monitoring and peer support tool, not a replacement for professional therapy. If you need clinical support, please reach out to the certified professionals below.
        </p>
      </div>

      <div className="flex flex-col gap-6">
        <Card className="border-l-4 border-l-indigo-500">
          <h2 className="text-xl font-bold text-gray-900 mb-2">University Counseling Center</h2>
          <p className="text-gray-600 mb-4">
            Available for all enrolled students. Sessions are strictly confidential and free of charge.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-bold text-gray-700">Location:</p>
              <p className="text-gray-600">Main Building, 2nd Floor, Room 204</p>
            </div>
            <div>
              <p className="font-bold text-gray-700">Office Hours:</p>
              <p className="text-gray-600">Monday - Friday: 8:00 AM - 5:00 PM</p>
            </div>
            <div>
              <p className="font-bold text-gray-700">Email:</p>
              <p className="text-indigo-600">counseling@university.edu</p>
            </div>
            <div>
              <p className="font-bold text-gray-700">Phone:</p>
              <p className="text-indigo-600">(02) 8123-4567 ext. 89</p>
            </div>
          </div>
        </Card>

        <Card className="bg-red-50 border-red-100">
          <h2 className="text-lg font-bold text-red-800 mb-2">Are you in crisis?</h2>
          <p className="text-red-700 text-sm mb-3">
            If you or someone you know is in immediate danger, please do not wait for an appointment.
          </p>
          <p className="font-bold text-red-900 text-xl">
            National Center for Mental Health Crisis Hotline: 1553
          </p>
        </Card>
      </div>

    </div>
  );
};
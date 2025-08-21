import { FC } from 'react';

interface ProfileProps {
  userId: string;
}

const Profile: FC<ProfileProps> = ({ userId }) => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Profile</h1>
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">User Profile</h2>
          <p className="text-gray-600">User ID: {userId}</p>
          {/* Add more profile information here */}
        </div>
      </div>
    </div>
  );
};

export default Profile;
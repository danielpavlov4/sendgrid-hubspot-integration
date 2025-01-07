import React, { useState, useEffect } from 'react';

const DetailedEngagementDashboard = () => {
  const [engagementData, setEngagementData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('clicks');

  useEffect(() => {
    fetchDetailedAnalytics();
  }, []);

  const fetchDetailedAnalytics = async () => {
    try {
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const endDate = new Date().toISOString();
      
      const response = await fetch(
        `/api/get-detailed-analytics?startDate=${startDate}&endDate=${endDate}`
      );
      const data = await response.json();
      setEngagementData(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading engagement data...</div>;
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-4">Detailed Email Engagement</h1>
        
        <div className="flex space-x-4 mb-4">
          <button
            onClick={() => setActiveTab('clicks')}
            className={`px-4 py-2 rounded ${
              activeTab === 'clicks' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200'
            }`}
          >
            Clicks ({engagementData?.clicks?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('opens')}
            className={`px-4 py-2 rounded ${
              activeTab === 'opens' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200'
            }`}
          >
            Opens ({engagementData?.opens?.length || 0})
          </button>
        </div>
      </div>

      {activeTab === 'clicks' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Clicked Link
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Time
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {engagementData?.clicks?.map((click, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {click.email}
                    </td>
                    <td className="px-6 py-4">
                      <a href={click.clickedUrl} target="_blank" rel="noopener noreferrer" 
                         className="text-blue-600 hover:underline">
                        {click.clickedUrl}
                      </a>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {new Date(click.timestamp).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'opens' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Time Opened
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {engagementData?.opens?.map((open, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {open.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {new Date(open.timestamp).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default DetailedEngagementDashboard;

import { useState } from 'react';

export default function ApiKeyModal({ onApiKeySubmit }) {
  const [apiKey, setApiKey] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (apiKey.startsWith('sk-')) {
      onApiKeySubmit(apiKey);
    } else {
      alert('Please enter a valid OpenAI API key.');
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center">
      <div className="p-8 border w-96 shadow-lg rounded-md bg-white">
        <div className="text-center">
          <h3 className="text-2xl font-bold text-gray-900">OpenAI API Key</h3>
          <div className="mt-2 px-7 py-3">
            <p className="text-sm text-gray-500">
              Please enter your OpenAI API key to continue. Your key will be stored locally and never sent to our servers.
            </p>
            <a href="https://platform.openai.com/api-keys" target="_blank" rel="noreferrer" className="text-blue-500 hover:underline">
              Get your key here.
            </a>
          </div>
          <form onSubmit={handleSubmit} className="mt-4">
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="px-3 py-2 text-gray-500 bg-transparent outline-none border focus:border-indigo-600 shadow-sm rounded-lg w-full"
              placeholder="sk-..."
            />
            <button type="submit" className="mt-4 w-full px-4 py-2 text-white font-medium bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 rounded-lg duration-150">
              Save
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

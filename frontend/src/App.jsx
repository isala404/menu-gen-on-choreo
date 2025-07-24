import { useState, useEffect } from 'react';
import axios from 'axios';
import ApiKeyModal from './components/ApiKeyModal';
import MenuUploader from './components/MenuUploader';
import ProcessingIndicator from './components/ProcessingIndicator';
import MenuResultsView from './components/MenuResultsView';

function App() {
  const [apiKey, setApiKey] = useState(localStorage.getItem('openai_api_key'));
  const [menu, setMenu] = useState(null);
  const [loadingStatus, setLoadingStatus] = useState('');
  const [error, setError] = useState(null);

  const handleApiKeySubmit = (key) => {
    localStorage.setItem('openai_api_key', key);
    setApiKey(key);
  };

  const handleImageUpload = async (file) => {
    const formData = new FormData();
    formData.append('image', file);

    try {
      setLoadingStatus('Uploading menu...');
      const res = await axios.post('/api/menus', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      const { menu_id } = res.data;

      setLoadingStatus('Processing menu...');
      await axios.post(`/api/menus/${menu_id}/process`, null, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      });

      // Start polling for results
      const interval = setInterval(async () => {
        try {
          const res = await axios.get(`/api/menus/${menu_id}`);
          if (res.data.status === 'COMPLETED') {
            setMenu(res.data);
            setLoadingStatus('');
            clearInterval(interval);
          } else if (res.data.status === 'FAILED') {
            setError('Menu processing failed. Please try again.');
            setLoadingStatus('');
            clearInterval(interval);
          }
        } catch (err) {
          setError('Failed to fetch menu status.');
          setLoadingStatus('');
          clearInterval(interval);
        }
      }, 5000);
    } catch (err) {
      setError('Failed to upload menu.');
      setLoadingStatus('');
    }
  };

  const handleRegenerate = async (itemId) => {
    try {
      const res = await axios.post(`/api/menu-items/${itemId}/regenerate`, null, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      });
      const updatedItem = res.data;
      setMenu((prevMenu) => ({
        ...prevMenu,
        items: prevMenu.items.map((item) =>
          item.id === updatedItem.id ? updatedItem : item
        ),
      }));
    } catch (err) {
      setError('Failed to regenerate item.');
    }
  };

  if (!apiKey) {
    return <ApiKeyModal onApiKeySubmit={handleApiKeySubmit} />;
  }

  if (loadingStatus) {
    return <ProcessingIndicator status={loadingStatus} />;
  }

  if (error) {
    return <div className="text-red-500 text-center mt-10">{error}</div>;
  }

  if (menu) {
    return <MenuResultsView menu={menu} onRegenerate={handleRegenerate} />;
  }

  return <MenuUploader onImageUpload={handleImageUpload} />;
}

export default App;

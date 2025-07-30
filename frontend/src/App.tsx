import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import UploadZone from './components/UploadZone';
import MenuDisplay from './components/MenuDisplay';
import NotFound from './components/NotFound';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<UploadZone />} />
          <Route path="/menus/:id" element={<MenuDisplay />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { Welcome } from './pages/Welcome';
import { Upload } from './pages/Upload';
import { Progress } from './pages/Progress';
import { Review } from './pages/Review';
import { Success } from './pages/Success';

function App() {
  return (
    <AppProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Welcome />} />
          <Route path="/upload" element={<Upload />} />
          <Route path="/progress" element={<Progress />} />
          <Route path="/review" element={<Review />} />
          <Route path="/success" element={<Success />} />
        </Routes>
      </Router>
    </AppProvider>
  );
}

export default App;

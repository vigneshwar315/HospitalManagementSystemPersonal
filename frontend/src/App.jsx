import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from './hospitallogo.png';
import backgroundVideo from './backgroundvideo.mp4';
import { FiUpload, FiSearch } from 'react-icons/fi';
import ReceptionistDashboard from './pages/ReceptionistDashboard';

function App() {
  return <HomePage />;
}

function HomePage() {
  const [activeNav, setActiveNav] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const leftNavItems = [
    { id: 'about', label: 'ABOUT' },
    { id: 'doctors', label: 'DOCTORS' },
    { id: 'patients', label: 'PATIENTS' }
  ];

  const rightNavItems = [
    { id: 'receptionists', label: 'RECEPTIONISTS' },
    { id: 'technicians', label: 'LAB TECHNICIANS' },
  ];

  const handleNavClick = (id) => {
    switch (id) {
      case 'doctors':
        navigate('/select-role');
        break;
      case 'patients':
        navigate('/patient/login');
        break;
      case 'receptionists':
        navigate('/auth/receptionist');
        break;
      case 'technicians':
        navigate('/technician/login');
        break;
      case 'about':
        navigate('/about-us');
        break;
      default:
        break;
    }
  };

  const handleSearch = (e) => {
    if (e.key === "Enter" && searchQuery.trim()) {
      navigate(`/search/${searchQuery.trim()}`);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current.click();
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
  
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("pdf", file);
  
      const response = await fetch("http://localhost:3001/api/upload", {
        method: "POST",
        body: formData,
      });
  
      const data = await response.json();
      
      if (!response.ok) throw new Error(data.error || 'Upload failed');
      
      if (data.medicines && data.medicines.length > 0) {
        navigate(`/search/${data.medicines[0].medicine}`, {
          state: { rawResults: data.medicines }
        });
      } else {
        alert("No medicine names found in the PDF.");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative w-full h-screen overflow-hidden flex flex-col font-['Arial,_sans-serif']">
    {/* Video Background */}
    <video 
      autoPlay 
      loop 
      muted 
      className="absolute top-0 left-0 w-full h-full object-cover z-0"
    >
      <source src={backgroundVideo} type="video/mp4" />
      Your browser does not support HTML5 video.
    </video>

    {/* Navigation */}
    <nav className="fixed top-0 w-full bg-transparent z-50 py-2">
      <div className="flex justify-center items-center gap-12 max-w-7xl mx-auto px-6">
        {leftNavItems.map(item => (
          <div
            key={item.id}
            className={`text-white text-lg font-medium px-4 py-2 cursor-pointer transition-all relative
              ${activeNav === item.id ? 'text-white/90' : 'text-white/70 hover:text-white/90'} font-sans`}
            onMouseEnter={() => setActiveNav(item.id)}
            onMouseLeave={() => setActiveNav(null)}
            onClick={() => handleNavClick(item.id)}
          >
            {item.label}
            <div className={`absolute bottom-0 left-0 h-0.5 bg-white transition-all duration-300 
              ${activeNav === item.id ? 'w-full' : 'w-0'}`} />
          </div>
        ))}

        <img 
          src={logo} 
          alt="Hospital Logo" 
          className="w-24 h-24 mx-12 transition-transform hover:scale-105" 
        />

        {rightNavItems.map(item => (
          <div
            key={item.id}
            className={`text-white text-lg font-medium px-4 py-2 cursor-pointer transition-all relative
              ${activeNav === item.id ? 'text-white/90' : 'text-white/70 hover:text-white/90'} font-sans`}
            onMouseEnter={() => setActiveNav(item.id)}
            onMouseLeave={() => setActiveNav(null)}
            onClick={() => handleNavClick(item.id)}
          >
            {item.label}
            <div className={`absolute bottom-0 left-0 h-0.5 bg-white transition-all duration-300 
              ${activeNav === item.id ? 'w-full' : 'w-0'}`} />
          </div>
        ))}
      </div>
    </nav>


      {/* Empty space to push search bar to bottom */}
      <div className="flex-grow"></div>

      {/* Search Bar - Now positioned at bottom */}
      <div className="relative z-10 w-full pb-16 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center bg-white/15 backdrop-blur-sm rounded-full border border-white/20 
            transition-all duration-300 hover:bg-white/25">
            <FiSearch className="text-white text-xl ml-6 mr-4" />
            <input
              type="text"
              placeholder="Search For Medicine Details / Upload The prescription..."
              className="flex-1 bg-transparent py-4 text-white placeholder-white/70 outline-none pr-4"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearch}
            />
            <button 
              className="p-3 mr-2 text-white rounded-full hover:bg-white/20 transition-colors"
              onClick={handleUploadClick}
            >
              <FiUpload className="text-xl" />
            </button>
            <input
              type="file"
              accept="application/pdf"
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>

          {/* Loading and error states */}
          {loading && (
            <p className="text-white text-center mt-4">Processing your prescription...</p>
          )}
          {error && (
            <p className="text-red-300 text-center mt-4">{error}</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom'; // Add this line
import { 
  FaHospital, 
  FaUserMd, 
  FaAward, 
  FaHeartbeat, 
  FaQuoteLeft,
  FaClinicMedical,
  FaProcedures,
  FaMicroscope
} from 'react-icons/fa';
import { IoIosArrowForward } from 'react-icons/io';
import { GiMedicines } from 'react-icons/gi';
import backgroundVideo from '../../backgroundvideo.mp4';
import logo from '../../hospitallogo.png';
import doctor1 from "../../assets/doctor1.png";
import doctor2 from "../../assets/doctor2.png"; 
import doctor3 from "../../assets/doctor3.png";
import hospitalBuilding from "../../assets/Yukimura_Hospital.png";

const AboutUs = () => {
  const navigate = useNavigate(); 
  const [activeTab, setActiveTab] = useState('about');

  const doctors = [
    {
      id: 1,
      name: "Dr. Rajesh Kumar",
      specialty: "Cardiologist",
      experience: "15 years",
      image: doctor1,
      bio: "Harvard-trained cardiologist specializing in minimally invasive procedures. Pioneer in transcatheter aortic valve replacements.",
      awards: ["Best Cardiologist Award 2022", "Top Doctor - Times Health"]
    },
    {
      id: 2,
      name: "Dr. Priya Sharma",
      specialty: "Neurologist",
      experience: "12 years",
      image: doctor2,
      bio: "Specializes in neurodegenerative disorders and stroke management. Developed new protocols for acute stroke care.",
      awards: ["Neurology Excellence Award", "40 Under 40 Healthcare Leaders"]
    },
    {
      id: 3,
      name: "Dr. Amit Patel",
      specialty: "Orthopedic Surgeon",
      experience: "18 years",
      image: doctor3,
      bio: "World-renowned joint replacement specialist. Performed over 5,000 successful joint replacements.",
      awards: ["Global Orthopedics Award", "Pioneer in Robotic Surgery"]
    }
  ];

  const testimonials = [
    {
      id: 1,
      quote: "The cardiac care I received at Deccan Care was exceptional. Dr. Kumar's team saved my life with their quick response and cutting-edge techniques.",
      author: "Rahul Mehta",
      role: "Heart Patient",
      rating: 5
    },
    {
      id: 2,
      quote: "After my complex spinal surgery, the rehabilitation team at Deccan Care helped me walk again. Their personalized approach made all the difference.",
      author: "Sunita Reddy",
      role: "Spine Surgery Patient",
      rating: 5
    },
    {
      id: 3,
      quote: "The maternity wing feels like a 5-star hotel but with world-class medical care. Delivering my baby here was a beautiful experience.",
      author: "Neha Kapoor",
      role: "New Mother",
      rating: 5
    }
  ];

  const facilities = [
    { icon: <FaClinicMedical />, title: "300+ Bed Facility", description: "Private suites with luxury amenities" },
    { icon: <FaProcedures />, title: "24/7 Emergency", description: "Fully equipped trauma center" },
    { icon: <GiMedicines />, title: "Pharmacy", description: "Round-the-clock medication availability" },
    { icon: <FaMicroscope />, title: "Advanced Labs", description: "Cutting-edge diagnostic technology" }
  ];

  return (
    <div className="relative w-full min-h-screen overflow-hidden">
      {/* Premium Video Background with Overlay */}
      <div className="fixed inset-0 z-0">
        <video autoPlay loop muted className="w-full h-full object-cover">
          <source src={backgroundVideo} type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/90 to-indigo-900/80"></div>
      </div>

      {/* Navigation Tabs */}
      <div className="relative z-10 pt-6">
  <div className="flex justify-center items-center space-x-2 mb-12">
    {/* Back button */}
    <button 
      onClick={() => navigate('/')}
      className="p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all mr-4"
      aria-label="Back to home"
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
      </svg>
    </button>

    {/* Existing tabs */}
    {['about', 'doctors', 'testimonials', 'facilities'].map((tab) => (
      <button
        key={tab}
        onClick={() => setActiveTab(tab)}
        className={`px-6 py-3 rounded-full text-sm font-medium transition-all duration-300 ${
          activeTab === tab
            ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
            : 'bg-white/10 text-white/80 hover:bg-white/20 backdrop-blur-sm'
        }`}
      >
        {tab.charAt(0).toUpperCase() + tab.slice(1)}
      </button>
    ))}
  </div>
</div>

      {/* Main Content */}
      <div className="relative z-10 container mx-auto px-6 pb-20">
        {/* About Section */}
        {activeTab === 'about' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-4xl mx-auto"
          >
            <div className="flex justify-center mb-8">
              <img src={logo} alt="Deccan Care Logo" className="h-24 w-24" />
            </div>
            <h1 className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-600 mb-6">
              Deccan Care Hospital
            </h1>
            <p className="text-xl text-white/90 mb-12">
              Where cutting-edge medicine meets compassionate care
            </p>

            <div className="grid md:grid-cols-3 gap-8 mb-16">
              <motion.div 
                whileHover={{ y: -10 }}
                className="bg-white/5 backdrop-blur-lg rounded-2xl p-8 border border-white/10 shadow-xl"
              >
                <div className="text-cyan-400 text-4xl mb-4">
                  <FaHospital />
                </div>
                <h3 className="text-2xl font-semibold text-white mb-3">Our Legacy</h3>
                <p className="text-white/80">
                  Founded in 2005, Deccan Care has grown from a 50-bed facility to a 300-bed multi-specialty hospital with centers of excellence in cardiology, neurology, and orthopedics.
                </p>
              </motion.div>

              <motion.div 
                whileHover={{ y: -10 }}
                className="bg-white/5 backdrop-blur-lg rounded-2xl p-8 border border-white/10 shadow-xl"
              >
                <div className="text-purple-400 text-4xl mb-4">
                  <FaHeartbeat />
                </div>
                <h3 className="text-2xl font-semibold text-white mb-3">Our Mission</h3>
                <p className="text-white/80">
                  To deliver world-class healthcare with a human touch, combining advanced technology with personalized attention to every patient's needs.
                </p>
              </motion.div>

              <motion.div 
                whileHover={{ y: -10 }}
                className="bg-white/5 backdrop-blur-lg rounded-2xl p-8 border border-white/10 shadow-xl"
              >
                <div className="text-blue-400 text-4xl mb-4">
                  <FaAward />
                </div>
                <h3 className="text-2xl font-semibold text-white mb-3">Our Accolades</h3>
                <ul className="text-white/80 space-y-2">
                  <li>• NABH Accredited</li>
                  <li>• Best Hospital Award 2023</li>
                  <li>• Center of Excellence</li>
                  <li>• 98% Patient Satisfaction</li>
                </ul>
              </motion.div>
            </div>

            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5 }}
              className="relative rounded-2xl overflow-hidden shadow-2xl"
            >
              <img src={hospitalBuilding} alt="Deccan Care Hospital" className="w-full h-96 object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-transparent to-transparent flex items-end p-8">
                <div>
                  <h3 className="text-3xl font-bold text-white mb-2">State-of-the-Art Facility</h3>
                  <p className="text-white/90 max-w-2xl">
                    Our 300,000 sq.ft. campus features the latest medical technology, luxury patient suites, and healing gardens designed to promote recovery.
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Doctors Section */}
        {activeTab === 'doctors' && (
  <div>
    <h2 className="text-4xl font-bold text-center mb-16 bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-600">
      Meet Our World-Class Specialists
    </h2>
    
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
      {doctors.map((doctor, index) => (
        <motion.div
          key={doctor.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: index * 0.1 }}
          whileHover={{ y: -10 }}
          className="bg-gradient-to-br from-slate-800/50 to-slate-900/80 rounded-2xl overflow-hidden shadow-xl border border-white/10 backdrop-blur-sm flex flex-col h-full"
        >
          {/* Image Container - Fixed aspect ratio */}
          <div className="relative pt-[75%] overflow-hidden">
            <img
              src={doctor.image}
              alt={doctor.name}
              className="absolute top-0 left-0 w-full h-full object-cover object-top"
              loading="lazy"
            />
            <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-black/50 to-transparent"></div>
          </div>

          {/* Content */}
          <div className="p-6 flex-1 flex flex-col">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-2xl font-bold text-white">{doctor.name}</h3>
                <p className="text-cyan-400 font-medium">{doctor.specialty}</p>
              </div>
              <span className="bg-blue-900/50 text-blue-300 px-3 py-1 rounded-full text-sm">
                {doctor.experience}
              </span>
            </div>
            
            <p className="text-white/80 mb-6 line-clamp-3 flex-1">{doctor.bio}</p>
            
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-white/70 mb-2">NOTABLE AWARDS:</h4>
              <div className="flex flex-wrap gap-2">
                {doctor.awards.map((award, i) => (
                  <span key={i} className="bg-indigo-900/50 text-indigo-200 px-3 py-1 rounded-full text-xs">
                    {award}
                  </span>
                ))}
              </div>
            </div>
            
            <button className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white py-3 px-6 rounded-lg font-medium transition-all">
              View Profile <IoIosArrowForward />
            </button>
          </div>
        </motion.div>
      ))}
    </div>
  </div>
)}

        {/* Testimonials Section */}
        {activeTab === 'testimonials' && (
          <div className="max-w-5xl mx-auto">
            <h2 className="text-4xl font-bold text-center mb-16 bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-600">
              Patient Experiences
            </h2>
            
            <div className="grid md:grid-cols-3 gap-8">
              {testimonials.map((testimonial) => (
                <motion.div
                  key={testimonial.id}
                  whileHover={{ y: -5 }}
                  className="bg-gradient-to-br from-slate-800/50 to-slate-900/80 rounded-2xl p-8 border border-white/10 shadow-xl backdrop-blur-sm"
                >
                  <div className="text-cyan-400 text-3xl mb-4">
                    <FaQuoteLeft />
                  </div>
                  <p className="text-white/90 italic mb-6">{testimonial.quote}</p>
                  <div className="border-t border-white/10 pt-4">
                    <h4 className="font-bold text-white">{testimonial.author}</h4>
                    <p className="text-sm text-white/70">{testimonial.role}</p>
                    <div className="flex mt-2">
                      {[...Array(5)].map((_, i) => (
                        <svg
                          key={i}
                          className={`w-5 h-5 ${i < testimonial.rating ? 'text-yellow-400' : 'text-gray-500'}`}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Facilities Section */}
        {activeTab === 'facilities' && (
          <div className="max-w-5xl mx-auto">
            <h2 className="text-4xl font-bold text-center mb-16 bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-600">
              World-Class Facilities
            </h2>
            
            <div className="grid md:grid-cols-2 gap-8 mb-16">
              <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/80 rounded-2xl p-8 border border-white/10 shadow-xl backdrop-blur-sm">
                <h3 className="text-2xl font-bold text-white mb-6">Our Technology</h3>
                <ul className="space-y-4">
                  <li className="flex items-start">
                    <div className="text-cyan-400 mr-4 mt-1">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-semibold text-white">3T MRI & 128-Slice CT Scan</h4>
                      <p className="text-white/70">High-resolution imaging for accurate diagnostics</p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <div className="text-cyan-400 mr-4 mt-1">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-semibold text-white">Robotic Surgery Systems</h4>
                      <p className="text-white/70">Precision surgery with minimal invasion</p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <div className="text-cyan-400 mr-4 mt-1">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-semibold text-white">AI-Assisted Diagnostics</h4>
                      <p className="text-white/70">Enhanced accuracy in disease detection</p>
                    </div>
                  </li>
                </ul>
              </div>
              
              <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/80 rounded-2xl p-8 border border-white/10 shadow-xl backdrop-blur-sm">
                <h3 className="text-2xl font-bold text-white mb-6">Patient Amenities</h3>
                <ul className="space-y-4">
                  <li className="flex items-start">
                    <div className="text-purple-400 mr-4 mt-1">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-semibold text-white">Luxury Patient Suites</h4>
                      <p className="text-white/70">Private rooms with hotel-like amenities</p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <div className="text-purple-400 mr-4 mt-1">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-semibold text-white">Gourmet Nutrition</h4>
                      <p className="text-white/70">Chef-prepared therapeutic meals</p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <div className="text-purple-400 mr-4 mt-1">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-semibold text-white">Healing Gardens</h4>
                      <p className="text-white/70">Therapeutic outdoor spaces for recovery</p>
                    </div>
                  </li>
                </ul>
              </div>
            </div>

            <div className="grid md:grid-cols-4 gap-6">
              {facilities.map((facility, index) => (
                <motion.div
                  key={index}
                  whileHover={{ y: -5, scale: 1.03 }}
                  className="bg-gradient-to-br from-slate-800/50 to-slate-900/80 rounded-xl p-6 text-center border border-white/10 shadow-lg backdrop-blur-sm"
                >
                  <div className="text-4xl mb-4 text-cyan-400">
                    {facility.icon}
                  </div>
                  <h4 className="font-bold text-white mb-2">{facility.title}</h4>
                  <p className="text-sm text-white/70">{facility.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AboutUs;
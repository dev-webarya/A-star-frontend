import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, ChevronDown, Search } from 'lucide-react';
import logoImage from '../assets/AStarClasses logo (31 March).png';
import { searchIndex } from '../data/searchIndex.ts';

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [mobileDropdown, setMobileDropdown] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const filteredResults = searchQuery.trim()
    ? searchIndex.filter((entry) => {
        const q = searchQuery.toLowerCase();
        return (
          entry.name.toLowerCase().includes(q) ||
          entry.description.toLowerCase().includes(q) ||
          entry.keywords.some((k) => k.toLowerCase().includes(q))
        );
      }).slice(0, 8)
    : [];

  const handleSearchSelect = useCallback((path: string) => {
    setSearchQuery('');
    setShowSearch(false);
    setIsOpen(false);
    navigate(path);
  }, [navigate]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSearch(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const subjects = [
    { name: 'Physics', slug: 'physics' },
    { name: 'Chemistry', slug: 'chemistry' },
    { name: 'Economics', slug: 'economics' },
    { name: 'Mathematics', slug: 'math' },
    { name: 'Further Math', slug: 'further-math' },
    { name: 'Languages', slug: 'languages' },
    { name: 'Biology', slug: 'biology' }
  ];

  const counsellingRegions = [
    { name: 'European Colleges', slug: 'europe' },
    { name: 'American Universities', slug: 'usa' },
    { name: 'Singapore Colleges', slug: 'singapore' },
    { name: 'Indian Schools', slug: 'india' }
  ];

  const satTests = [
    { name: 'SAT', slug: 'sat' },
    { name: 'TMUA', slug: 'tmua' },
    { name: 'AMC', slug: 'amc' },
    { name: 'Advanced Placements', slug: 'ap' },
    { name: 'ACT', slug: 'act' }
  ];

  return (
    <header className="bg-white shadow-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo (left) */}
          <Link to="/" className="flex items-center space-x-2 flex-shrink-0">
            <img src={logoImage} alt="A Star Classes Logo" className="h-14 w-14 object-contain" />
            <span className="text-lg font-bold italic text-gray-900 inline"><strong>A Star Classes</strong></span>
          </Link>

          {/* Navigation (right) */}
          <div className="flex-1 flex justify-end items-center">
            <nav className="hidden lg:flex items-center space-x-6">
              <Link to="/" className="text-sm text-gray-700 hover:text-blue-800 font-medium transition-colors">
                Home
              </Link>

              {/* IGCSE Dropdown */}
              <div
                className="relative"
                onMouseEnter={() => setActiveDropdown('igcse')}
                onMouseLeave={() => setActiveDropdown(null)}
              >
                <button className="flex items-center space-x-1 text-sm text-gray-700 hover:text-blue-800 font-medium transition-colors">
                  <span>IGCSE</span>
                  <ChevronDown className={`h-4 w-4 transition-transform ${activeDropdown === 'igcse' ? 'rotate-180' : ''}`} />
                </button>
                {activeDropdown === 'igcse' && (
                  <div className="absolute top-full left-0 mt-1 w-48 bg-white rounded-lg shadow-xl border border-gray-100 py-2 z-20">
                    {subjects.map((subject) => (
                      <Link
                        key={subject.slug}
                        to={`/igcse/${subject.slug}`}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-800 transition-colors"
                      >
                        {subject.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* AS/A Level Dropdown */}
              <div
                className="relative"
                onMouseEnter={() => setActiveDropdown('asalevel')}
                onMouseLeave={() => setActiveDropdown(null)}
              >
                <button className="flex items-center space-x-1 text-sm text-gray-700 hover:text-blue-800 font-medium transition-colors">
                  <span>AS/A Level</span>
                  <ChevronDown className={`h-4 w-4 transition-transform ${activeDropdown === 'asalevel' ? 'rotate-180' : ''}`} />
                </button>
                {activeDropdown === 'asalevel' && (
                  <div className="absolute top-full left-0 mt-1 w-48 bg-white rounded-lg shadow-xl border border-gray-100 py-2 z-20">
                    {subjects.map((subject) => (
                      <Link
                        key={subject.slug}
                        to={`/as-a-level/${subject.slug}`}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-800 transition-colors"
                      >
                        {subject.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              <Link to="/tutors" className="text-sm text-gray-700 hover:text-blue-800 font-medium transition-colors">
                Tutors
              </Link>

              <Link to="/blog" className="text-sm text-gray-700 hover:text-blue-800 font-medium transition-colors flex items-center gap-1">
                Blogs
              </Link>

              <Link to="/reviews" className="text-sm text-gray-700 hover:text-blue-800 font-medium transition-colors flex items-center gap-1">
                Reviews
              </Link>

              {/* Ask link */}
              <Link to="/ask" className="text-sm text-gray-700 hover:text-blue-800 font-medium transition-colors">
                Ask
              </Link>

              {/* Search Bar */}
              <div className="ml-6 flex items-center relative" ref={searchRef}>
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => { setSearchQuery(e.target.value); setShowSearch(true); }}
                    onFocus={() => setShowSearch(true)}
                    className="pl-8 pr-3 py-1.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm w-40 lg:w-48"
                  />
                </div>
                {showSearch && filteredResults.length > 0 && (
                  <div className="absolute top-full right-0 mt-2 w-72 lg:w-80 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-50 max-h-96 overflow-y-auto">
                    {filteredResults.map((item) => (
                      <button
                        key={item.path}
                        onClick={() => handleSearchSelect(item.path)}
                        className="w-full text-left px-4 py-2.5 hover:bg-blue-50 transition-colors"
                      >
                        <div className="text-sm font-semibold text-gray-900">{item.name}</div>
                        <div className="text-xs text-gray-500 truncate">{item.description}</div>
                      </button>
                    ))}
                    {searchQuery.trim() && filteredResults.length === 0 && (
                      <div className="px-4 py-3 text-sm text-gray-400">No results found</div>
                    )}
                  </div>
                )}
              </div>
            </nav>
          </div>

          {/* Mobile menu button */}
          <button
            className="lg:hidden p-2 rounded hover:bg-gray-100"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="lg:hidden py-3 border-t border-gray-100 bg-white">
            <nav className="space-y-1 px-4">
              <Link
                to="/"
                onClick={() => setIsOpen(false)}
                className="block text-gray-700 hover:text-blue-800 hover:bg-blue-50 font-medium px-2 py-2.5 rounded-lg text-sm transition-all"
              >
                Home
              </Link>

              {/* Mobile IGCSE Dropdown */}
              <div className="space-y-1">
                <button
                  onClick={() => setMobileDropdown(mobileDropdown === 'igcse' ? null : 'igcse')}
                  className="w-full flex items-center justify-between text-gray-700 hover:text-blue-800 hover:bg-blue-50 font-medium px-2 py-2.5 rounded-lg text-sm transition-all"
                >
                  <span>IGCSE</span>
                  <ChevronDown className={`h-4 w-4 transition-transform ${mobileDropdown === 'igcse' ? 'rotate-180' : ''}`} />
                </button>
                {mobileDropdown === 'igcse' && (
                  <div className="pl-4 space-y-1 bg-gray-50 rounded-lg py-1 mt-1">
                    {subjects.map((subject) => (
                      <Link
                        key={subject.slug}
                        to={`/igcse/${subject.slug}`}
                        onClick={() => setIsOpen(false)}
                        className="block px-4 py-2 text-sm text-gray-600 hover:text-blue-800 transition-colors"
                      >
                        {subject.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Mobile AS/A Level Dropdown */}
              <div className="space-y-1">
                <button
                  onClick={() => setMobileDropdown(mobileDropdown === 'asalevel' ? null : 'asalevel')}
                  className="w-full flex items-center justify-between text-gray-700 hover:text-blue-800 hover:bg-blue-50 font-medium px-2 py-2.5 rounded-lg text-sm transition-all"
                >
                  <span>AS/A Level</span>
                  <ChevronDown className={`h-4 w-4 transition-transform ${mobileDropdown === 'asalevel' ? 'rotate-180' : ''}`} />
                </button>
                {mobileDropdown === 'asalevel' && (
                  <div className="pl-4 space-y-1 bg-gray-50 rounded-lg py-1 mt-1">
                    {subjects.map((subject) => (
                      <Link
                        key={subject.slug}
                        to={`/as-a-level/${subject.slug}`}
                        onClick={() => setIsOpen(false)}
                        className="block px-4 py-2 text-sm text-gray-600 hover:text-blue-800 transition-colors"
                      >
                        {subject.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              <Link
                to="/tutors"
                onClick={() => setIsOpen(false)}
                className="block text-gray-700 hover:text-blue-800 hover:bg-blue-50 font-medium px-2 py-2.5 rounded-lg text-sm transition-all"
              >
                Tutors
              </Link>
              <Link
                to="/ask"
                onClick={() => setIsOpen(false)}
                className="block text-gray-700 hover:text-blue-800 hover:bg-blue-50 font-medium px-2 py-2.5 rounded-lg text-sm transition-all"
              >
                Ask
              </Link>
              <Link
                to="/reviews"
                onClick={() => setIsOpen(false)}
                className="block text-gray-700 hover:text-blue-800 hover:bg-blue-50 font-medium px-2 py-2.5 rounded-lg text-sm transition-all"
              >
                Reviews
              </Link>
              <Link
                to="/testimonials"
                onClick={() => setIsOpen(false)}
                className="block text-gray-700 hover:text-blue-800 hover:bg-blue-50 font-medium px-2 py-2.5 rounded-lg text-sm transition-all"
              >
                Testimonials
              </Link>
              <Link
                to="/contact"
                onClick={() => setIsOpen(false)}
                className="block text-gray-700 hover:text-blue-800 hover:bg-blue-50 font-medium px-2 py-2.5 rounded-lg text-sm transition-all"
              >
                Contact Us
              </Link>

              {/* Mobile Search Bar */}
              <div className="px-2 py-3 mt-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search pages..."
                    value={searchQuery}
                    onChange={(e) => { setSearchQuery(e.target.value); setShowSearch(true); }}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
                  />
                </div>
                {showSearch && searchQuery.trim() && (
                  <div className="mt-2 border border-gray-100 rounded-xl bg-white shadow-lg max-h-64 overflow-y-auto">
                    {filteredResults.length > 0 ? (
                      filteredResults.map((item) => (
                        <button
                          key={item.path}
                          onClick={() => handleSearchSelect(item.path)}
                          className="w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors border-b border-gray-50 last:border-0"
                        >
                          <div className="text-sm font-semibold text-gray-900">{item.name}</div>
                          <div className="text-xs text-gray-500 truncate">{item.description}</div>
                        </button>
                      ))
                    ) : (
                      <div className="px-4 py-3 text-sm text-gray-400">No results found</div>
                    )}
                  </div>
                )}
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
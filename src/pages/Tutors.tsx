import { useState, useEffect } from 'react';
import { BookOpen, Award, Target, Users, Search, ArrowRight, GraduationCap, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
// @ts-ignore: importing from JS module without declaration
import { getPublicTeachers } from '../api/api/teacherApi';

const TutorCard = ({ tutor }: { tutor: any }) => {
    const [showModal, setShowModal] = useState(false);
    const [expanded, setExpanded] = useState(false);

    const normalizeCategory = (category: string | undefined) => {
        if (!category) return 'IGCSE';
        return category === 'AS and A Level & IGCSE' ? 'IGCSE & AS/A Level' : category;
    };

    const getImageUrl = (image: string) => {
        const photoUrl = tutor.photoUrl || tutor.image || image;
        if (!photoUrl) return 'https://images.unsplash.com/photo-1544717305-27a734ef1904?auto=format&fit=crop&q=80&w=400';
        if (typeof photoUrl === 'string' && photoUrl.startsWith('http')) return photoUrl;
        const baseUrl = (import.meta.env.VITE_API_BASE_URL || 'https://api.astarclasses.com').replace(/\/$/, '');
        const imagePath = typeof photoUrl === 'string' ? (photoUrl.startsWith('/') ? photoUrl : `/${photoUrl}`) : '';
        return `${baseUrl}${imagePath}`;
    };

    const bioText = tutor.bio || tutor.description || '';
    const showReadMore = bioText.length > 140;
    const displayBio = expanded ? bioText : showReadMore ? `${bioText.slice(0, 140).trim()}...` : bioText;

    return (
        <>
            <div className="group bg-white rounded-2xl md:rounded-[2.5rem] overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-300 border border-gray-100 flex flex-col h-full">
                <div className="relative aspect-[3/4] overflow-hidden bg-gray-100">
                    <button
                        type="button"
                        onClick={() => setShowModal(true)}
                        className="absolute inset-0 z-20 cursor-zoom-in"
                        aria-label={`View full image of ${tutor.fullName || tutor.name}`}
                    />
                    <img
                        src={getImageUrl(tutor.photoUrl || tutor.image)}
                        alt={tutor.name}
                        className="w-full h-full object-contain bg-white transition duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex flex-col justify-end p-6">
                        <button
                            onClick={(e) => { e.stopPropagation(); setShowModal(true); }}
                            className="w-full py-3 bg-white text-blue-900 font-black text-xs rounded-xl transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500 uppercase tracking-widest shadow-xl"
                        >
                            View Full Profile
                        </button>
                    </div>
                </div>

                <div className="p-4 sm:p-6 md:p-8 flex-1 flex flex-col items-center text-center">
                    <div className="mb-4 w-full">
                        <div className="flex flex-col gap-3 mb-4 items-center">
                            <div className="flex flex-col gap-2 items-center">
                                <h3 className="text-2xl font-extrabold text-gray-900 group-hover:text-blue-900 transition-colors duration-300">
                                    {tutor.fullName || tutor.name}
                                </h3>
                                <div className="flex justify-center">
                                    <span className="px-3 py-1 bg-blue-50 text-blue-700 text-[10px] font-black rounded-lg border border-blue-100 uppercase tracking-widest whitespace-nowrap shadow-sm">
                                        {normalizeCategory(tutor.category)}
                                    </span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 justify-center">
                                <p className="text-blue-600 font-bold text-sm tracking-wide uppercase">
                                    {tutor.mainSubject || tutor.subject}
                                </p>
                            </div>
                        </div>
                    </div>

                    <p className="text-gray-500 text-sm font-semibold mb-4 flex items-center gap-2 justify-center italic">
                        <GraduationCap className="text-gray-400" size={18} />
                        {tutor.speciality || tutor.specialization || tutor.specialty}
                    </p>

                    <div className="text-gray-600 text-sm leading-relaxed mb-5 w-full">
                        <p className={expanded ? '' : 'line-clamp-3'}>{displayBio}</p>
                        {showReadMore && (
                            <button
                                type="button"
                                onClick={() => setExpanded(!expanded)}
                                className="mt-3 inline-flex text-sm font-semibold text-blue-600 hover:text-blue-800"
                            >
                                {expanded ? 'Show less' : 'Read more'}
                            </button>
                        )}
                    </div>

                    <div className="mt-auto pt-6 border-t border-gray-50 flex items-center justify-center w-full">
                        <Link
                            to="/contact?mode=direct&subject=demo-class#contact-form"
                            className="inline-flex items-center gap-2 text-blue-900 font-extrabold text-sm hover:gap-4 transition-all duration-300"
                        >
                            BOOK A FREE TRIAL <ArrowRight size={18} />
                        </Link>
                    </div>
                </div>
            </div>

            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
                    <div className="absolute inset-0" onClick={() => setShowModal(false)} />
                    <div className="relative max-w-5xl w-full max-h-full overflow-hidden rounded-3xl bg-white shadow-2xl">
                        <button
                            type="button"
                            onClick={() => setShowModal(false)}
                            className="absolute top-4 right-4 z-20 rounded-full bg-white/90 p-2 shadow hover:bg-white"
                            aria-label="Close full image"
                        >
                            ✕
                        </button>
                        <div className="flex items-center justify-center min-h-[60vh] bg-black">
                            <img
                                src={getImageUrl(tutor.photoUrl || tutor.image)}
                                alt={tutor.name}
                                className="max-h-[90vh] max-w-full object-contain"
                            />
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

const Tutors = () => {
    const [tutors, setTutors] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchTutors = async () => {
            try {
                const data = await getPublicTeachers();
                // Handle Spring Page or direct array
                setTutors(data?.content || (Array.isArray(data) ? data : []));
            } catch (error) {
                console.error('Error fetching tutors:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchTutors();
    }, []);

    const filteredTutors = tutors.filter(t => {
        const fullName = (t.fullName || t.name || '').toLowerCase();
        const mainSubject = (t.mainSubject || t.subject || '').toLowerCase();
        const speciality = (t.speciality || t.specialization || t.specialty || '').toLowerCase();
        const searchLower = searchTerm.toLowerCase();

        const matchesSearch = fullName.includes(searchLower) ||
            mainSubject.includes(searchLower) ||
            speciality.includes(searchLower);

        return matchesSearch;
    });

    const stats = [
        { label: 'Expert Tutors', value: '50+', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
        { label: 'Success Rate', value: '98%', icon: Target, color: 'text-green-600', bg: 'bg-green-50' },
        { label: 'Average Score', value: 'A/A*', icon: Award, color: 'text-purple-600', bg: 'bg-purple-50' },
        { label: 'Study Resources', value: '1000+', icon: BookOpen, color: 'text-orange-600', bg: 'bg-orange-50' },
    ];

    return (
        <div className="min-h-screen bg-[#F8FAFC] overflow-x-hidden">
            {/* Elegant Hero Section */}
            <section className="relative overflow-hidden bg-gradient-to-br from-blue-900 via-indigo-900 to-blue-800 py-12 md:py-24">
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute -top-24 -left-24 w-96 h-96 bg-white rounded-full blur-3xl animate-pulse"></div>
                    <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-blue-400 rounded-full blur-3xl"></div>
                </div>
                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-blue-200 text-sm font-semibold mb-6 backdrop-blur-md border border-white/10">
                        <Star className="h-4 w-4 fill-current text-yellow-400" />
                        World Class Faculty
                    </span>
                    <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-6 tracking-tight">
                        Meet Our <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-indigo-200">Expert Educators</span>
                    </h1>
                    <p className="text-xl text-blue-100/80 max-w-3xl mx-auto leading-relaxed mb-10">
                        Our team of dedicated educators are specialists in IGCSE and AS/A Level preparation,
                        committed to transforming your academic journey into a success story.
                    </p>

                    {/* Hero Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 max-w-4xl mx-auto">
                        {stats.map((stat, idx) => (
                            <div key={idx} className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 text-white group hover:bg-white/10 transition duration-300">
                                <stat.icon className={`h-8 w-8 mx-auto mb-3 ${stat.color} transition-transform group-hover:scale-110`} />
                                <div className="text-2xl font-bold mb-1">{stat.value}</div>
                                <div className="text-sm text-blue-200/70">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Search Bar - Floating UI */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 relative z-10">
                <div className="bg-white rounded-3xl shadow-xl p-4 md:p-8 flex flex-col md:flex-row gap-6 items-center border border-gray-100">
                    <div className="relative flex-1 w-full">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Search by name, subject, or specialty..."
                            className="w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500/20 text-gray-800 placeholder:text-gray-400"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Main Tutors Section */}
            <section className="py-12 md:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="w-16 h-16 border-4 border-blue-900 border-t-transparent rounded-full animate-spin"></div>
                        <p className="mt-6 text-gray-500 font-medium text-lg">Loading our expert faculty...</p>
                    </div>
                ) : filteredTutors.length === 0 ? (
                    <div className="text-center py-24 bg-white rounded-3xl shadow-sm border border-gray-100">
                        <div className="bg-gray-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Search className="text-gray-300" size={40} />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-800 mb-2">No Tutors Found</h3>
                        <p className="text-gray-500">We couldn't find any tutors matching your criteria. Try adjusting your filters.</p>
                        <button
                            onClick={() => setSearchTerm('')}
                            className="mt-6 text-blue-600 font-bold hover:underline"
                        >
                            Clear search
                        </button>
                    </div>
                ) : (
                    <div className="space-y-12">
                        {/* Search Results Header (Only if searching) */}
                        {searchTerm && (
                            <div className="mb-10 text-center">
                                <h2 className="text-2xl font-bold text-gray-800">
                                    Search Results for "{searchTerm}"
                                    <span className="ml-4 text-sm font-normal text-gray-500">
                                        Found {filteredTutors.length} tutors
                                    </span>
                                </h2>
                            </div>
                        )}

                        {/* Unified Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                            {filteredTutors.map((tutor, index) => (
                                <TutorCard key={tutor.id || tutor._id || index} tutor={tutor} />
                            ))}
                        </div>
                    </div>
                )}
            </section>

            {/* Elegant CTA Section
            <section className="py-24 bg-white px-4">
                <div className="max-w-5xl mx-auto rounded-[3rem] bg-gradient-to-r from-blue-600 to-indigo-700 p-8 md:p-16 text-center text-white relative overflow-hidden shadow-2xl">
                    <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.8),transparent)]"></div>
                    <div className="relative z-10">
                        <h2 className="text-3xl md:text-5xl font-extrabold mb-6">Start Your Journey To Excellence</h2>
                        <p className="text-xl text-blue-100/90 mb-10 max-w-2xl mx-auto leading-relaxed">
                            Connect with our world-class educators and get the personalized guidance you need to reach your full potential.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link to="/contact?mode=direct&subject=counselling#contact-form" className="px-10 py-5 bg-white text-blue-900 font-black rounded-2xl hover:bg-blue-50 transition transform hover:-translate-y-1 shadow-xl">
                                BOOK A FREE CONSULTATION
                            </Link>
                            <button className="px-10 py-5 bg-blue-500/20 backdrop-blur-md border border-white/30 text-white font-black rounded-2xl hover:bg-white/20 transition transform hover:-translate-y-1">
                                VIEW SUCCESS STORIES
                            </button>
                        </div>
                    </div>
                </div>
            </section>
            */}
        </div>
    );
};

export default Tutors;
import React, { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, Edit, Save, X, Search, UserPlus, Filter, CheckCircle, AlertCircle, Upload, Image as ImageIcon, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import {
    getAllTeachersAdmin,
    createTeacherAdmin,
    updateTeacherAdmin,
    deleteTeacherAdmin
} from '../../api/api/teacherApi';
import { uploadToCloudinary } from '../../utils/cloudinaryUpload';

export default function TutorManagement() {
    const [tutors, setTutors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('All');
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [modalTutor, setModalTutor] = useState(null);
    const [expandedTutorIds, setExpandedTutorIds] = useState([]);
    const [resizeModal, setResizeModal] = useState(null);
    const [resizeDimensions, setResizeDimensions] = useState({ width: 800, height: 800 });
    const [resizePreview, setResizePreview] = useState(null);
    const canvasRef = useRef(null);
    useEffect(() => {
        if (!resizePreview || !canvasRef.current) return;
        const img = new Image();
        img.src = resizePreview;
        img.onload = () => {
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            canvas.width = resizeDimensions.width;
            canvas.height = resizeDimensions.height;
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        };
    }, [resizePreview, resizeDimensions]);
    const [formData, setFormData] = useState({
        fullName: '',
        mainSubject: '',
        speciality: '',
        category: 'IGCSE',
        photoUrl: '',
        bio: '',
    });

    const categories = ['All', 'IGCSE', 'IGCSE & AS/A Level'];

    const normalizeCategory = (category) => {
        if (!category) return 'IGCSE';
        return category === 'AS and A Level & IGCSE' ? 'IGCSE & AS/A Level' : category;
    };

    useEffect(() => {
        fetchTutors();
    }, []);

    const fetchTutors = async () => {
        setLoading(true);
        try {
            const data = await getAllTeachersAdmin();
            // Handle both Page object { content: [] } and direct array []
            const tutorList = data?.content || (Array.isArray(data) ? data : []);
            setTutors(tutorList);
        } catch (error) {
            console.error('Error fetching tutors:', error);
            toast.error('Failed to load tutors');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const resizeImage = (file, targetWidth, targetHeight) => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target.result;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let width = targetWidth || img.width;
                    let height = targetHeight || img.height;

                    const MAX_SIZE = 800;
                    if (!targetWidth || !targetHeight) {
                        width = img.width;
                        height = img.height;
                        if (width > height) {
                            if (width > MAX_SIZE) {
                                height *= MAX_SIZE / width;
                                width = MAX_SIZE;
                            }
                        } else {
                            if (height > MAX_SIZE) {
                                width *= MAX_SIZE / height;
                                height = MAX_SIZE;
                            }
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.imageSmoothingEnabled = true;
                    ctx.imageSmoothingQuality = 'high';
                    ctx.drawImage(img, 0, 0, width, height);
                    
                    canvas.toBlob((blob) => {
                        const resizedFile = new File([blob], file.name, {
                            type: 'image/jpeg',
                            lastModified: Date.now(),
                        });
                        resolve(resizedFile);
                    }, 'image/jpeg', 0.92);
                };
            };
        });
    };

    const handleImageUpload = async (e) => {
        let file = e.target.files[0];
        if (!file) return;

        if (file.size > 10 * 1024 * 1024) {
            toast.error('Image size should be less than 10MB');
            return;
        }

        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                setResizeModal(file);
                setResizePreview(event.target.result);
                setResizeDimensions({ width: img.width, height: img.height });
            };
        };
    };

    const handleResizeConfirm = async () => {
        if (!resizeModal) return;
        setUploading(true);
        const uploadToast = toast.loading('Resizing and uploading image...');
        try {
            const resizedFile = await resizeImage(resizeModal, resizeDimensions.width, resizeDimensions.height);
            const imageUrl = await uploadToCloudinary(resizedFile);
            setFormData(prev => ({ ...prev, photoUrl: imageUrl }));
            setResizeModal(null);
            setResizePreview(null);
            toast.success('Image processed and uploaded', { id: uploadToast });
        } catch (error) {
            console.error('Upload error:', error);
            toast.error('Failed to upload image', { id: uploadToast });
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (uploading) {
            toast.error('Please wait for image upload to complete');
            return;
        }

        // Create a clean payload to ensure backend field compatibility
        const payload = {
            fullName: formData.fullName,
            mainSubject: formData.mainSubject,
            speciality: formData.speciality,
            category: formData.category,
            bio: formData.bio,
            photoUrl: formData.photoUrl
        };

        console.log('Sending payload to backend:', payload);

        try {
            if (editingId) {
                const response = await updateTeacherAdmin(editingId, payload);
                setTutors(prev => prev.map(t => (t.id === editingId || t._id === editingId) ? response : t));
                toast.success('✅ Tutor updated successfully');
            } else {
                const newTutor = await createTeacherAdmin(payload);
                setTutors(prev => [...prev, newTutor]);
                toast.success('✅ Tutor added successfully');
            }
            setIsAdding(false);
            setEditingId(null);
            resetForm();
        } catch (error) {
            console.error('Submit error:', error);
            const errorMsg = error.message || 'Failed to save tutor details';
            toast.error(`❌ ${errorMsg}`);
        }
    };

    const handleDeleteTutor = async (id) => {
        if (!window.confirm('Are you sure you want to delete this tutor?')) return;
        try {
            await deleteTeacherAdmin(id);
            setTutors(prev => prev.filter(t => (t.id !== id && t._id !== id)));
            toast.success('✅ Tutor deleted successfully');
        } catch (error) {
            console.error('Delete error:', error);
            const errorMsg = error.message || 'Failed to delete tutor';
            toast.error(`❌ ${errorMsg}`);
        }
    };

    const startEditing = (tutor) => {
        const id = tutor.id || tutor._id;
        setEditingId(id);
        setIsAdding(true);
        setFormData({
            fullName: tutor.fullName || tutor.name || '',
            mainSubject: tutor.mainSubject || tutor.subject || '',
            speciality: tutor.speciality || tutor.specialization || tutor.specialty || '',
            category: tutor.category || 'IGCSE',
            photoUrl: tutor.photoUrl || tutor.image || '',
            bio: tutor.bio || '',
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const resetForm = () => {
        setFormData({
            fullName: '',
            mainSubject: '',
            speciality: '',
            category: 'IGCSE',
            photoUrl: '',
            bio: '',
        });
    };

    const filteredTutors = tutors.filter(t => {
        const nameMatch = ((t.fullName || t.name) || '').toLowerCase().includes(searchTerm.toLowerCase());
        const subjectMatch = (t.subject || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchesSearch = nameMatch || subjectMatch;
        const matchesCategory = categoryFilter === 'All' || normalizeCategory(t.category) === categoryFilter;
        return matchesSearch && matchesCategory;
    });

    const getImageUrl = (image) => {
        if (!image) return 'https://images.unsplash.com/photo-1544717305-27a734ef1904?auto=format&fit=crop&q=80&w=400';
        if (typeof image === 'string' && image.startsWith('http')) return image;
        const baseUrl = (import.meta.env.VITE_API_BASE_URL || 'https://api.astarclasses.com').replace(/\/$/, '');
        const imagePath = typeof image === 'string' ? (image.startsWith('/') ? image : `/${image}`) : '';
        return `${baseUrl}${imagePath}`;
    };

    return (
        <div className="w-full">
            {/* Header */}
            <div className="bg-white border-b-2 border-blue-900 rounded-xl p-6 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-blue-900">Tutor Management</h1>
                    <p className="text-gray-500 text-sm mt-1">Add, edit and manage faculty members</p>
                </div>
                <button
                    onClick={() => { setIsAdding(true); setEditingId(null); resetForm(); }}
                    className="flex items-center gap-2 bg-blue-900 text-white px-4 py-2 rounded-lg hover:bg-blue-800 transition shadow-md"
                >
                    <UserPlus size={18} /> Add New Tutor
                </button>
            </div>

            {/* Filters & Search */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6 flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search by name or subject..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Filter size={18} className="text-gray-400" />
                    <select
                        className="border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm"
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                    >
                        {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                </div>
            </div>

            {/* Add/Edit Form */}
            {(isAdding || editingId) && (
                <div className="bg-white p-6 rounded-xl shadow-lg border border-blue-100 mb-8 animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-bold text-gray-800">{editingId ? 'Edit Tutor Profile' : 'Add New Tutor'}</h2>
                        <button onClick={() => { setIsAdding(false); setEditingId(null); resetForm(); }} className="text-gray-400 hover:text-gray-600">
                            <X size={20} />
                        </button>
                    </div>
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Full Name</label>
                                <input name="fullName" required value={formData.fullName} onChange={handleInputChange} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none" placeholder="e.g. John Doe" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Main Subject</label>
                                <input name="mainSubject" required value={formData.mainSubject} onChange={handleInputChange} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none" placeholder="e.g. Mathematics" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Speciality</label>
                                <input name="speciality" required value={formData.speciality} onChange={handleInputChange} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none" placeholder="e.g. IGCSE Specialist" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Category</label>
                                <select
                                    name="category"
                                    required
                                    value={formData.category}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none"
                                >
                                    <option value="IGCSE">IGCSE</option>
                                    <option value="IGCSE & AS/A Level">IGCSE & AS/A Level</option>
                                </select>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Image Upload (Auto-resized to 800px)</label>
                                <p className="text-[10px] text-gray-400 mb-2">Tip: Square photos work best. Uploading will auto-resize and optimize your photo.</p>
                                <div className="flex items-center gap-4">
                                    {formData.photoUrl ? (
                                        <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-gray-100">
                                            <img src={getImageUrl(formData.photoUrl)} alt="Preview" className="w-full h-full object-contain bg-white" />
                                            <button
                                                type="button"
                                                onClick={() => setFormData(prev => ({ ...prev, photoUrl: '' }))}
                                                className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600"
                                            >
                                                <X size={10} />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="w-12 h-12 rounded-lg bg-gray-50 border border-dashed border-gray-300 flex items-center justify-center text-gray-400">
                                            <ImageIcon size={20} />
                                        </div>
                                    )}
                                    <label className="flex-1 cursor-pointer">
                                        <div className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition">
                                            <Upload size={16} className="text-gray-500" />
                                            <span className="text-sm text-gray-600 font-medium">{uploading ? 'Uploading...' : 'Choose File'}</span>
                                        </div>
                                        <input
                                            type="file"
                                            className="hidden"
                                            accept="image/*"
                                            onChange={handleImageUpload}
                                            disabled={uploading}
                                        />
                                    </label>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Bio</label>
                                <textarea name="bio" rows="3" required value={formData.bio} onChange={handleInputChange} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none resize-none" placeholder="Brief professional background..."></textarea>
                            </div>
                        </div>
                        <div className="md:col-span-2 flex justify-end gap-3 pt-4 border-t border-gray-100">
                            <button type="button" onClick={() => { setIsAdding(false); setEditingId(null); resetForm(); }} className="px-6 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition font-medium">Cancel</button>
                            <button type="submit" className="px-8 py-2 bg-blue-900 text-white rounded-lg hover:bg-blue-800 transition shadow-md flex items-center gap-2">
                                <Save size={18} /> {editingId ? 'Save Changes' : 'Add Tutor'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Resize Modal */}
            {resizeModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setResizeModal(null)} />
                    <div className="relative z-10 bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden">
                        <div className="flex items-center justify-between p-6 border-b border-gray-100">
                            <h3 className="text-lg font-bold text-gray-800">Resize Photo</h3>
                            <button type="button" onClick={() => setResizeModal(null)} className="text-gray-400 hover:text-gray-600">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Preview After Resize</p>
                                    <div className="rounded-xl overflow-hidden bg-gray-50 border border-gray-200 flex items-center justify-center" style={{ height: '16rem' }}>
                                        <canvas ref={canvasRef} className="max-w-full max-h-full object-contain" />
                                    </div>
                                    <p className="text-[10px] text-gray-400 mt-1 text-center">{resizeDimensions.width} × {resizeDimensions.height} px</p>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Resize Options</p>
                                    <div className="space-y-3">
                                        <p className="text-xs text-gray-400">Select a preset or set custom dimensions:</p>
                                        <div className="grid grid-cols-2 gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setResizeDimensions({ width: 300, height: 300 })}
                                                className={`px-3 py-2 rounded-lg text-xs font-semibold border transition ${
                                                    resizeDimensions.width === 300 && resizeDimensions.height === 300
                                                        ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600 hover:border-blue-300'
                                                }`}
                                            >
                                                Small (300×300)
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setResizeDimensions({ width: 512, height: 512 })}
                                                className={`px-3 py-2 rounded-lg text-xs font-semibold border transition ${
                                                    resizeDimensions.width === 512 && resizeDimensions.height === 512
                                                        ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600 hover:border-blue-300'
                                                }`}
                                            >
                                                Square (512×512)
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setResizeDimensions({ width: 800, height: 800 })}
                                                className={`px-3 py-2 rounded-lg text-xs font-semibold border transition ${
                                                    resizeDimensions.width === 800 && resizeDimensions.height === 800
                                                        ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600 hover:border-blue-300'
                                                }`}
                                            >
                                                Square (800×800)
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setResizeDimensions({ width: 400, height: 500 })}
                                                className={`px-3 py-2 rounded-lg text-xs font-semibold border transition ${
                                                    resizeDimensions.width === 400 && resizeDimensions.height === 500
                                                        ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600 hover:border-blue-300'
                                                }`}
                                            >
                                                Passport (2×2.5)
                                            </button>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3 pt-2">
                                            <div>
                                                <label className="block text-xs font-medium text-gray-500 mb-1">Width (px)</label>
                                                <input
                                                    type="number"
                                                    min="50"
                                                    max="2000"
                                                    value={resizeDimensions.width}
                                                    onChange={(e) => setResizeDimensions(prev => ({ ...prev, width: Number(e.target.value) }))}
                                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 outline-none"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-500 mb-1">Height (px)</label>
                                                <input
                                                    type="number"
                                                    min="50"
                                                    max="2000"
                                                    value={resizeDimensions.height}
                                                    onChange={(e) => setResizeDimensions(prev => ({ ...prev, height: Number(e.target.value) }))}
                                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 outline-none"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                        </div>
                        <div className="flex justify-end gap-3 p-6 border-t border-gray-100 bg-gray-50">
                            <button type="button" onClick={() => setResizeModal(null)} className="px-6 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition font-medium text-sm">
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleResizeConfirm}
                                disabled={uploading}
                                className="px-8 py-2 bg-blue-900 text-white rounded-lg hover:bg-blue-800 transition shadow-md flex items-center gap-2 text-sm font-medium disabled:opacity-50"
                            >
                                <Upload size={16} /> {uploading ? 'Uploading...' : 'Resize & Upload'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Tutors Grid */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-20">
                    <div className="w-12 h-12 border-4 border-blue-900 border-t-transparent rounded-full animate-spin"></div>
                    <p className="mt-4 text-gray-600 font-medium">Fetching tutors...</p>
                </div>
            ) : filteredTutors.length === 0 ? (
                <div className="text-center py-20 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                    <AlertCircle className="mx-auto mb-4 text-gray-400" size={48} />
                    <p className="text-gray-600 text-lg font-medium">No tutors found</p>
                    <p className="text-gray-400 text-sm mt-1">Try adjusting your search or filters</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredTutors.map((tutor) => (
                        <div key={tutor._id || tutor.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition group">
                            <div className="relative h-80 md:h-96 bg-gray-100 overflow-hidden">
                                <button
                                    type="button"
                                    onClick={() => setModalTutor(tutor)}
                                    className="absolute inset-0 z-10"
                                    aria-label={`View full image of ${tutor.fullName || tutor.name}`}
                                />
                                <img src={getImageUrl(tutor.photoUrl || tutor.image)} alt={tutor.name} className="w-full h-full object-contain bg-white" />
                                <div className="absolute top-3 right-3 flex gap-2 z-20">
                                    <button onClick={() => startEditing(tutor)} className="p-2 bg-white/90 backdrop-blur-sm text-blue-600 rounded-full hover:bg-white shadow-sm transition">
                                        <Edit size={16} />
                                    </button>
                                    <button onClick={() => handleDeleteTutor(tutor._id || tutor.id)} className="p-2 bg-white/90 backdrop-blur-sm text-red-600 rounded-full hover:bg-white shadow-sm transition">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                                <div className="absolute bottom-3 left-3">
                                    <span className="px-3 py-1 bg-blue-900 text-white text-[10px] font-bold rounded-full uppercase tracking-wider">
                                        {tutor.category}
                                    </span>
                                </div>
                            </div>
                            <div className="p-5">
                                <h3 className="text-lg font-bold text-gray-800 mb-1">{tutor.fullName || tutor.name}</h3>
                                <p className="text-blue-600 text-sm font-semibold mb-2">{tutor.mainSubject || tutor.subject}</p>
                                <p className="text-gray-500 text-xs mb-3 font-medium italic">{tutor.speciality || tutor.specialization || tutor.specialty}</p>
                                {(() => {
                                    const tutorId = tutor._id || tutor.id;
                                    const bioText = tutor.bio || '';
                                    const showReadMore = bioText.length > 140;
                                    const isExpanded = expandedTutorIds.includes(tutorId);
                                    const displayBio = isExpanded ? bioText : showReadMore ? `${bioText.slice(0, 140).trim()}...` : bioText;
                                    return (
                                        <>
                                            <p className={`text-gray-600 text-sm leading-relaxed mb-4 ${isExpanded ? '' : 'line-clamp-3'}`}>{displayBio}</p>
                                            {showReadMore && (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setExpandedTutorIds(prev => prev.includes(tutorId) ? prev.filter(id => id !== tutorId) : [...prev, tutorId]);
                                                    }}
                                                    className="text-sm font-semibold text-blue-600 hover:text-blue-800"
                                                >
                                                    {isExpanded ? 'Show less' : 'Read more'}
                                                </button>
                                            )}
                                        </>
                                    );
                                })()}
                                <div className="flex items-center gap-2 text-green-600 text-xs font-bold pt-4 border-t border-gray-50">
                                    <CheckCircle size={14} /> {tutor.active !== false ? 'ACTIVE FACULTY' : 'INACTIVE'}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
            {modalTutor && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
                    <div className="absolute inset-0" onClick={() => setModalTutor(null)} />
                    <div className="relative max-w-4xl w-full max-h-[90vh] overflow-hidden rounded-3xl bg-white shadow-2xl flex flex-col md:flex-row">
                        <button
                            type="button"
                            onClick={() => setModalTutor(null)}
                            className="absolute top-4 right-4 z-20 rounded-full bg-white/90 p-2 shadow hover:bg-white"
                            aria-label="Close profile"
                        >
                            ✕
                        </button>
                        <div className="flex-1 flex items-center justify-center bg-black min-h-[300px] md:min-h-full">
                            <img
                                src={getImageUrl(modalTutor.photoUrl || modalTutor.image)}
                                alt={modalTutor.fullName || modalTutor.name}
                                className="max-h-[80vh] max-w-full object-contain"
                            />
                        </div>
                        <div className="flex-1 p-8 overflow-y-auto flex flex-col justify-start">
                            <h2 className="text-3xl font-bold text-gray-900 mb-2">{modalTutor.fullName || modalTutor.name}</h2>
                            <div className="mb-4">
                                <span className="px-3 py-1 bg-blue-900 text-white text-xs font-bold rounded-full uppercase tracking-wider">
                                    {normalizeCategory(modalTutor.category)}
                                </span>
                            </div>
                            <p className="text-blue-600 text-lg font-semibold mb-2">{modalTutor.mainSubject || modalTutor.subject}</p>
                            <p className="text-gray-500 text-sm font-medium italic mb-4">{modalTutor.speciality || modalTutor.specialization || modalTutor.specialty}</p>
                            <div className="border-t border-gray-200 pt-4 mt-4">
                                <h3 className="text-sm font-semibold text-gray-700 mb-2">ABOUT</h3>
                                <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">{modalTutor.bio || 'No bio available'}</p>
                            </div>
                            {modalTutor.active !== false && (
                                <div className="flex items-center gap-2 text-green-600 text-xs font-bold pt-4 mt-auto border-t border-gray-200">
                                    <CheckCircle size={14} /> ACTIVE FACULTY
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

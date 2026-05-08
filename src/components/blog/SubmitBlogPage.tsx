import { useState, useEffect, useCallback, useRef, type ChangeEvent, type DragEvent, type FormEvent, type SyntheticEvent } from 'react';
import { Link } from 'react-router-dom';
import { blogApi } from '../../api/blogApi.ts';
import { Card, Input, TextArea, Button } from '../ui/index.tsx';
import { ContentEditor } from '../editor/ContentEditor';
import { PenTool, Mail, CheckCircle, ArrowRight, Save, Upload, X, Image as ImageIcon, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

const DRAFT_KEY = 'blogpost_draft';

type SubmitFormData = {
    authorName: string;
    authorEmail: string;
    authorMobile: string;
    title: string;
    excerpt: string;
    content: string;
    tags: string;
    featuredImageUrl: string;
};

type SavedDraft = {
    formData: SubmitFormData;
    savedAt?: string;
};

const emptyForm: SubmitFormData = {
    authorName: '', authorEmail: '', authorMobile: '',
    title: '', excerpt: '', content: '', tags: '', featuredImageUrl: '',
};

const getApiErrorMessage = (error: unknown, fallback: string) => {
    if (typeof error === 'object' && error !== null && 'response' in error) {
        const response = (error as { response?: { data?: { message?: string } } }).response;
        if (response?.data?.message) {
            return response.data.message;
        }
    }

    if (error instanceof Error && error.message) {
        return error.message;
    }

    return fallback;
};

export const SubmitBlogPage = () => {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<SubmitFormData>(emptyForm);
    const [otp, setOtp] = useState('');
    const [draftSavedAt, setDraftSavedAt] = useState<Date | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [imageLoading, setImageLoading] = useState(false);
    const [isDragOver, setIsDragOver] = useState(false);
    const autoSaveTimer = useRef<ReturnType<typeof setInterval> | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);


    // Check for saved draft on mount
    useEffect(() => {
        try {
            const saved = localStorage.getItem(DRAFT_KEY);
            if (saved) {
                const draft = JSON.parse(saved) as SavedDraft;
                if (draft.formData && (draft.formData.title || draft.formData.content || draft.formData.excerpt)) {
                    setDraftSavedAt(draft.savedAt ? new Date(draft.savedAt) : null);
                }
            }
        } catch { /* ignore corrupt data */ }
    }, []);

    // Auto-save every 30 seconds when on step 1
    useEffect(() => {
        if (step !== 1) return;
        autoSaveTimer.current = setInterval(() => {
            const hasContent = formData.title || formData.content || formData.excerpt;
            if (hasContent) {
                saveDraft(true);
            }
        }, 30000);
        return () => {
            if (autoSaveTimer.current) {
                clearInterval(autoSaveTimer.current);
            }
        };
    }, [step, formData]);

    // Sync image preview with form data
    useEffect(() => {
        if (formData.featuredImageUrl) {
            setImagePreview(formData.featuredImageUrl);
        } else {
            setImagePreview(null);
        }
    }, [formData.featuredImageUrl]);

    const saveDraft = useCallback((silent = false) => {
        try {
            const draft: SavedDraft = { formData, savedAt: new Date().toISOString() };
            localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
            setDraftSavedAt(new Date());
            if (!silent) toast.success('Draft saved!');
        } catch {
            if (!silent) toast.error('Could not save draft');
        }
    }, [formData]);

    const clearDraft = () => {
        localStorage.removeItem(DRAFT_KEY);
        setDraftSavedAt(null);
    };

    const handleStep1 = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        // Validate phone number
        if (formData.authorMobile.length !== 10) {
            toast.error('Phone number must be exactly 10 digits');
            return;
        }
        setLoading(true);
        try {
            await blogApi.startSubmission({
                authorName: formData.authorName, authorEmail: formData.authorEmail, authorMobile: formData.authorMobile,
                title: formData.title, excerpt: formData.excerpt, contentHtml: formData.content,
                tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
                featuredImageUrl: formData.featuredImageUrl || null,
            });
            toast.success('OTP sent to your email! (Dev: 123456)');
            setStep(2);
        } catch (err) {
            toast.error(getApiErrorMessage(err, 'Submission failed'));
        }
        finally { setLoading(false); }
    };

    const handleStep2 = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault(); setLoading(true);
        try {
            await blogApi.verifySubmission({ email: formData.authorEmail, otp });
            toast.success('Email verified!'); setStep(3);
        }
        catch (err) { toast.error(getApiErrorMessage(err, 'Invalid OTP')); }
        finally { setLoading(false); }
    };

    const handleStep3 = async () => {
        setLoading(true);
        try {
            await blogApi.finishSubmission({
                ...formData,
                email: formData.authorEmail,
                contentHtml: formData.content, // Map content to contentHtml for backend
                tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean)
            });
            clearDraft(); // Clear draft on successful submission
            toast.success('Blog submitted!'); setStep(4);
        }
        catch (err) { toast.error(getApiErrorMessage(err, 'Failed to finalize')); }
        finally { setLoading(false); }
    };

    const update = (field: keyof SubmitFormData) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        let value = e.target.value;
        // Phone number validation - only allow 10 digits
        if (field === 'authorMobile') {
            // Remove all non-digit characters
            const digitsOnly = value.replace(/\D/g, '');
            // Limit to 10 digits
            value = digitsOnly.slice(0, 10);
        }
        setFormData({ ...formData, [field]: value });
    };

    const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        processImageFile(file);

        // Reset file input for re-upload
        e.target.value = '';
    };

    const processImageFile = (file: File) => {
        // Validate file type
        if (!file.type.startsWith('image/')) {
            toast.error('Please select a valid image file (JPG, PNG, GIF, WebP)');
            return;
        }

        // Validate file size (max 5MB)
        const fileSizeMB = file.size / (1024 * 1024);
        if (fileSizeMB > 5) {
            toast.error(`File size is ${fileSizeMB.toFixed(1)}MB. Max allowed is 5MB`);
            return;
        }

        setImageLoading(true);

        // Convert to base64/data URL
        const reader = new FileReader();
        reader.onload = (event) => {
            const dataUrl = event.target?.result;
            if (typeof dataUrl === 'string') {
                setFormData(prev => ({ ...prev, featuredImageUrl: dataUrl }));
                setImagePreview(dataUrl);
                toast.success(`Image uploaded! (${fileSizeMB.toFixed(1)}MB)`);
            }
            setImageLoading(false);
        };
        reader.onerror = () => {
            toast.error('Failed to read image file');
            setImageLoading(false);
        };
        reader.readAsDataURL(file);
    };

    const handleUrlChange = (url: string) => {
        setFormData(prev => ({ ...prev, featuredImageUrl: url }));
        if (url && url.trim()) {
            // Validate URL format
            try {
                new URL(url);
                setImagePreview(url);
            } catch {
                setImagePreview(null);
            }
        } else {
            setImagePreview(null);
        }
    };

    const clearImage = () => {
        setFormData(prev => ({ ...prev, featuredImageUrl: '' }));
        setImagePreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
        toast.success('Image removed');
    };

    const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(true);
    };

    const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);
    };

    const handleDrop = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);

        const files = e.dataTransfer?.files;
        if (files && files.length > 0) {
            const file = files[0];
            processImageFile(file);
        }
    };

    const formatTime = (date: Date | null) => {
        if (!date) return '';
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="max-w-5xl mx-auto px-6 pt-14 pb-10 md:pt-16">
            <Link to="/blog" className="inline-flex items-center gap-2 text-base font-medium text-[#4f6079] hover:text-text-primary transition-colors mb-6">
                <ArrowLeft className="w-4 h-4" /> Back to Blog
            </Link>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-[-0.03em] text-text-primary mb-2">Submit Your Blog</h1>
            <p className="text-lg text-text-secondary mb-14">Share your knowledge with our community</p>

            {/* Steps */}
            <div className="flex items-center justify-center gap-5 mb-12">
                {[1, 2, 3].map((s) => (
                    <div key={s} className="flex items-center gap-3">
                        <div className={`w-11 h-11 rounded-full flex items-center justify-center text-[17px] font-bold transition-all ${step >= s ? 'bg-[#19788f] text-white' : 'bg-[#d9dde3] text-[#667085]'
                            }`}>{step > s ? '✓' : s}</div>
                        <span className={`text-base font-semibold ${step >= s ? 'text-[#19788f]' : 'text-[#667085]'}`}>
                            {s === 1 ? 'Write' : s === 2 ? 'Verify' : 'Submit'}
                        </span>
                        {s < 3 && <div className={`w-16 h-[2px] ${step > s ? 'bg-[#19788f]' : 'bg-[#c9ced6]'}`} />}
                    </div>
                ))}
            </div>

            {step === 1 && (
                <Card className="rounded-2xl border border-[#d7dce3] shadow-sm">
                    <div className="flex items-center justify-between mb-5">
                        <div className="flex items-center gap-2">
                            <PenTool className="w-5 h-5 text-text-secondary" />
                            <h2 className="text-xl font-bold text-text-primary">Write Your Blog</h2>
                        </div>
                        <div className="flex items-center gap-2">
                            {draftSavedAt && (
                                <span className="text-xs text-text-tertiary hidden sm:inline">
                                    Saved {formatTime(draftSavedAt)}
                                </span>
                            )}
                            <button type="button" onClick={() => saveDraft(false)}
                                className="flex items-center gap-1.5 text-xs font-medium text-text-secondary hover:text-text-primary bg-bg-tertiary hover:bg-bg-hover px-3 py-1.5 rounded-lg transition-colors"
                                title="Save as draft (auto-saves every 30s)">
                                <Save size={14} /> Save Draft
                            </button>
                        </div>
                    </div>
                    <form onSubmit={handleStep1} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input label="Your Name *" placeholder="John Doe" value={formData.authorName} onChange={update('authorName')} required />
                            <Input label="Email *" type="email" placeholder="john@example.com" value={formData.authorEmail} onChange={update('authorEmail')} required />
                        </div>
                        <Input label="Mobile *" placeholder="9876543210" value={formData.authorMobile} onChange={update('authorMobile')} maxLength={10} required />
                        <div className="text-xs text-text-tertiary mt-1">Enter 10-digit phone number</div>
                        <Input label="Blog Title *" placeholder="An amazing title..." value={formData.title} onChange={update('title')} required />
                        <TextArea label="Excerpt *" placeholder="Brief summary (2-3 sentences)" rows={2} value={formData.excerpt} onChange={update('excerpt')} required />

                        <div className="space-y-1.5">
                            <label className="block text-sm font-medium text-text-secondary">Content *</label>
                            <ContentEditor
                                initialContent={formData.content}
                                onChange={(html: string) => setFormData(prev => ({ ...prev, content: html }))}
                            />
                        </div>

                        <Input label="Tags (comma separated)" placeholder="spring-boot, java, tutorial" value={formData.tags} onChange={update('tags')} />

                        {/* Featured Image Upload Section */}
                        <div className="space-y-3">
                            <label className="block text-sm font-medium text-text-secondary">Featured Image (optional)</label>

                            {/* Image Preview */}
                            {imagePreview && (
                                <div className="relative w-full rounded-lg overflow-hidden bg-bg-tertiary border-2 border-bg-hover">
                                    <img
                                        src={imagePreview}
                                        alt="Preview"
                                        className="w-full h-48 object-cover"
                                        onError={(e: SyntheticEvent<HTMLImageElement>) => {
                                            e.currentTarget.style.display = 'none';
                                            toast.error('Invalid image URL');
                                        }}
                                    />
                                    <button
                                        type="button"
                                        onClick={clearImage}
                                        className="absolute top-2 right-2 p-2 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors shadow-lg"
                                        title="Remove image"
                                    >
                                        <X size={18} />
                                    </button>
                                    <div className="absolute bottom-2 left-2 bg-black bg-opacity-60 text-white px-3 py-1 rounded text-xs">
                                        Image Ready
                                    </div>
                                </div>
                            )}

                            {/* Upload Area - Drag & Drop */}
                            <div
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                                className={`border-2 border-dashed rounded-lg p-6 text-center transition-all cursor-pointer ${isDragOver
                                    ? 'border-text-secondary bg-bg-secondary'
                                    : 'border-border-primary bg-bg-primary hover:border-text-secondary'
                                    }`}
                            >
                                <div className="flex flex-col items-center gap-2">
                                    <ImageIcon size={32} className="text-text-tertiary" />
                                    <div>
                                        <p className="text-sm font-medium text-text-primary">
                                            Drag & Drop Image Here
                                        </p>
                                        <p className="text-xs text-text-tertiary mt-1">
                                            or click below to choose
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Upload Options */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {/* File Upload Button */}
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={imageLoading}
                                    className="flex items-center justify-center gap-2 px-4 py-3 bg-text-secondary hover:bg-opacity-90 text-bg-primary border border-text-secondary rounded-lg transition-all font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {imageLoading ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-bg-primary border-t-transparent rounded-full animate-spin"></div>
                                            Processing...
                                        </>
                                    ) : (
                                        <>
                                            <Upload size={16} />
                                            Choose from Device
                                        </>
                                    )}
                                </button>

                                {/* Hidden File Input */}
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    className="hidden"
                                    aria-label="Upload featured image"
                                    disabled={imageLoading}
                                />

                                {/* Gallery Info */}
                                <div className="px-4 py-3 bg-bg-secondary border border-border-primary rounded-lg flex items-center justify-center text-text-tertiary font-medium text-sm">
                                    <ImageIcon size={16} className="mr-2" />
                                    Gallery Ready
                                </div>
                            </div>

                            {/* URL Input Option */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-text-secondary">Or paste image URL:</label>
                                <input
                                    type="url"
                                    placeholder="https://example.com/image.jpg"
                                    value={formData.featuredImageUrl.startsWith('data:') ? '' : formData.featuredImageUrl}
                                    onChange={(e) => handleUrlChange(e.target.value)}
                                    disabled={imageLoading}
                                    className="w-full px-4 py-2.5 text-sm border border-border-primary rounded-lg bg-bg-primary text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-text-secondary focus:border-transparent transition-all disabled:opacity-50"
                                />
                            </div>

                            <div className="bg-bg-secondary rounded-lg p-3 space-y-1">
                                <p className="text-xs font-medium text-text-primary">Supported Formats & Tips:</p>
                                <ul className="text-xs text-text-tertiary space-y-1 list-disc list-inside">
                                    <li>JPG, PNG, GIF, WebP</li>
                                    <li>Max size: 5MB</li>
                                    <li>Recommended: 1200x800px or larger</li>
                                    <li>Upload or paste URL - both work</li>
                                </ul>
                            </div>
                        </div>

                        <Button type="submit" disabled={loading} className="w-full">
                            {loading ? 'Sending OTP...' : 'Submit & Verify Email'} <ArrowRight className="w-4 h-4 inline ml-1" />
                        </Button>
                    </form>
                </Card>
            )}

            {step === 2 && (
                <Card className="text-center">
                    <Mail className="w-12 h-12 mx-auto text-text-tertiary mb-3" />
                    <h2 className="text-xl font-bold text-text-primary mb-1">Verify Your Email</h2>
                    <p className="text-text-secondary mb-2 text-sm">OTP sent to <strong>{formData.authorEmail}</strong></p>
                    {/* <p className="text-xs text-text-tertiary mb-6 bg-bg-secondary rounded p-2">📌 Dev OTP: <strong>123456</strong></p> */}
                    <form onSubmit={handleStep2} className="max-w-xs mx-auto space-y-4">
                        <Input placeholder="Enter 6-digit OTP" value={otp} onChange={(e: ChangeEvent<HTMLInputElement>) => setOtp(e.target.value)}
                            className="text-center text-xl tracking-widest" maxLength={6} required />
                        <Button type="submit" disabled={loading} className="w-full">{loading ? 'Verifying...' : 'Verify OTP'}</Button>
                        <button type="button" onClick={() => setStep(1)} className="w-full pt-2 text-sm text-text-tertiary hover:text-text-primary font-medium flex items-center justify-center gap-1 transition-colors">
                            <ArrowLeft className="w-4 h-4" /> Back to Writing
                        </button>
                    </form>
                </Card>
            )}

            {step === 3 && (
                <Card className="text-center">
                    <CheckCircle className="w-12 h-12 mx-auto text-emerald-500 mb-3" />
                    <h2 className="text-xl font-bold text-text-primary mb-1">Email Verified!</h2>
                    <p className="text-text-secondary mb-6 text-sm">Click below to submit for admin review</p>
                    <Button onClick={handleStep3} disabled={loading}>{loading ? 'Submitting...' : 'Finalize Submission'}</Button>
                </Card>
            )}

            {step === 4 && (
                <Card className="text-center">
                    <div className="text-5xl mb-3">Submitted</div>
                    <h2 className="text-2xl font-bold text-text-primary mb-1">Blog Submitted!</h2>
                    <p className="text-text-secondary text-sm mb-6">Pending admin review. You'll get an email once approved.</p>
                    <Button variant="secondary" onClick={() => { setStep(1); setFormData(emptyForm); }}>
                        Submit Another
                    </Button>
                </Card>
            )}
        </div>
    );
};

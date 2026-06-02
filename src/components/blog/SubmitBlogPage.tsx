import { useState, useEffect, useCallback, useRef, type ChangeEvent, type DragEvent, type FormEvent, type SyntheticEvent } from 'react';
import { Link } from 'react-router-dom';
import { blogApi, getIsLocalMode } from '../../api/blogApi.ts';
import { Card, Input, TextArea, Button } from '../ui/index.tsx';
import { ContentEditor } from '../editor/ContentEditor';
import { PenTool, Mail, CheckCircle, ArrowRight, Save, X, Image as ImageIcon, ArrowLeft } from 'lucide-react';
import { uploadToCloudinary } from '../../utils/cloudinaryUpload';
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
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    const [isDragOver, setIsDragOver] = useState(false);
    const autoSaveTimer = useRef<ReturnType<typeof setInterval> | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);


    const [resendTimer, setResendTimer] = useState(0);

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

    // Timer logic
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (resendTimer > 0) {
            interval = setInterval(() => {
                setResendTimer((prev) => prev - 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [resendTimer]);

    const formatResendTimer = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

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

    // Sync image previews with form data
    useEffect(() => {
        if (formData.featuredImageUrl) {
            // Split by comma if multiple, or just take one
            const urls = formData.featuredImageUrl.split(',').filter(Boolean);
            setImagePreviews(urls);
        } else {
            setImagePreviews([]);
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
        if (!formData.authorMobile || formData.authorMobile.length !== 10) {
            toast.error('Mobile number must be exactly 10 digits.');
            return;
        }
        if (!/^\d{10}$/.test(formData.authorMobile)) {
            toast.error('Please enter a valid 10-digit mobile number (digits only).');
            return;
        }

        setLoading(true);
        try {
            const response = await blogApi.startSubmission({
                authorName: formData.authorName, authorEmail: formData.authorEmail, authorMobile: formData.authorMobile,
                title: formData.title, excerpt: formData.excerpt, contentHtml: formData.content,
                tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
                featuredImageUrl: imagePreviews[0] || null, // Send primary as featured
                additionalImages: imagePreviews.slice(1), // Send others as additional if backend supports
            });

            const data = response?.data || {};
            if (!data.success) {
                throw new Error(data.message || 'Failed to send OTP');
            }

            const otpMessage = 'OTP sent to your email!';
            toast.success(otpMessage);
            setStep(2);
            setResendTimer(300); // 5 minutes
        } catch (err) {
            toast.error(getApiErrorMessage(err, 'Submission failed'));
        }
        finally { setLoading(false); }
    };

    const handleResendOtp = async () => {
        if (resendTimer > 0) return;
        setLoading(true);
        try {
            const response = await blogApi.startSubmission({
                authorName: formData.authorName, authorEmail: formData.authorEmail, authorMobile: formData.authorMobile,
                title: formData.title, excerpt: formData.excerpt, contentHtml: formData.content,
                tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
                featuredImageUrl: imagePreviews[0] || null,
                additionalImages: imagePreviews.slice(1),
            });
            const data = response?.data || {};
            if (!data.success) throw new Error(data.message || 'Failed to resend OTP');
            toast.success('OTP resent successfully!');
            setResendTimer(300); // 5 minutes
        } catch (err) {
            toast.error(getApiErrorMessage(err, 'Failed to resend OTP'));
        } finally {
            setLoading(false);
        }
    };

    const handleStep2 = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault(); setLoading(true);
        try {
            const response = await blogApi.verifySubmission({ email: formData.authorEmail, otp });
            const data = response?.data || {};
            if (!data.success) {
                throw new Error(data.message || 'Invalid OTP');
            }
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
                tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
                featuredImageUrl: imagePreviews[0] || null,
                additionalImages: imagePreviews.slice(1)
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
        const files = e.target.files;
        if (!files || files.length === 0) return;
        
        Array.from(files).forEach(file => {
            processImageFile(file);
        });

        // Reset file input for re-upload
        e.target.value = '';
    };

    const processImageFile = async (file: File) => {
        if (!file.type.startsWith('image/')) {
            toast.error(`"${file.name}" is not a valid image file`);
            return;
        }

        const fileSizeMB = file.size / (1024 * 1024);
        if (fileSizeMB > 5) {
            toast.error(`"${file.name}" is ${fileSizeMB.toFixed(1)}MB. Max allowed is 5MB`);
            return;
        }

        const toastId = `upload-${Date.now()}`;
        toast.loading(`Processing ${file.name}...`, { id: toastId });

        try {
            const url = await uploadToCloudinary(file);
            setImagePreviews(prev => {
                const next = [...prev, url];
                setFormData(f => ({ ...f, featuredImageUrl: next.join(',') }));
                return next;
            });
            toast.success(`Image uploaded!`, { id: toastId });
        } catch {
            // Cloudinary failed — fall back to base64
            try {
                const dataUrl = await readFileAsDataUrl(file);
                setImagePreviews(prev => {
                    const next = [...prev, dataUrl];
                    setFormData(f => ({ ...f, featuredImageUrl: next.join(',') }));
                    return next;
                });
                toast.success(`Image added (local)`, { id: toastId });
            } catch {
                toast.error(`Failed to process ${file.name}`, { id: toastId });
            }
        }
    };

    const readFileAsDataUrl = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                if (typeof reader.result === 'string') resolve(reader.result);
                else reject(new Error('Failed to read file'));
            };
            reader.onerror = () => reject(reader.error);
            reader.readAsDataURL(file);
        });
    };

    const handleUrlChange = (url: string) => {
        if (!url.trim()) return;
        try {
            new URL(url);
            setImagePreviews(prev => {
                const next = [...prev, url.trim()];
                setFormData(f => ({ ...f, featuredImageUrl: next.join(',') }));
                return next;
            });
            toast.success('URL added');
        } catch {
            toast.error('Invalid URL format');
        }
    };

    const removeImage = (index: number) => {
        setImagePreviews(prev => {
            const next = prev.filter((_, i) => i !== index);
            setFormData(f => ({ ...f, featuredImageUrl: next.join(',') }));
            return next;
        });
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

    const formatDraftTime = (date: Date | null) => {
        if (!date) return '';
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="max-w-5xl mx-auto px-6 pt-14 pb-10 md:pt-16">
            <Link to="/blog" className="inline-flex items-center gap-2 text-base font-medium text-[#4f6079] hover:text-text-primary transition-colors mb-6">
                <ArrowLeft className="w-4 h-4" /> Back to Blog
            </Link>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-[-0.03em] text-text-primary mb-2">
                Submit Your Blog
            </h1>
            <p className="text-lg text-text-secondary mb-6">Share your knowledge with our community</p>


            {/* Steps */}
            <div className="flex items-center justify-center gap-1.5 sm:gap-5 mb-12 overflow-hidden px-2">
                {[1, 2, 3].map((s) => (
                    <div key={s} className="flex items-center gap-1 sm:gap-3 shrink-0">
                        <div className={`w-7 h-7 sm:w-11 sm:h-11 rounded-full flex items-center justify-center text-xs sm:text-[17px] font-bold transition-all ${step >= s ? 'bg-[#19788f] text-white' : 'bg-[#d9dde3] text-[#667085]'
                            }`}>{step > s ? '✓' : s}</div>
                        <span className={`text-[10px] sm:text-base font-semibold ${step >= s ? 'text-[#19788f]' : 'text-[#667085]'}`}>
                            {s === 1 ? 'Write' : s === 2 ? 'Verify' : 'Submit'}
                        </span>
                        {s < 3 && <div className={`w-4 sm:w-16 h-[2px] ${step > s ? 'bg-[#19788f]' : 'bg-[#c9ced6]'}`} />}
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
                                    Saved {formatDraftTime(draftSavedAt)}
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

                        <div className="space-y-3">
                            <label className="block text-sm font-medium text-text-secondary">Blog Images (First image is featured)</label>

                            {/* Image Gallery */}
                            {imagePreviews.length > 0 && (
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                    {imagePreviews.map((url, index) => (
                                        <div key={index} className="relative aspect-video rounded-lg overflow-hidden bg-bg-tertiary border border-border-primary group">
                                            <img
                                                src={url}
                                                alt={`Preview ${index + 1}`}
                                                className="w-full h-full object-cover"
                                                onError={(e: SyntheticEvent<HTMLImageElement>) => {
                                                    e.currentTarget.src = 'https://via.placeholder.com/400x225?text=Invalid+Image';
                                                }}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => removeImage(index)}
                                                className="absolute top-1 right-1 p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full transition-all opacity-0 group-hover:opacity-100 shadow-sm"
                                                title="Remove image"
                                            >
                                                <X size={14} />
                                            </button>
                                            {index === 0 && (
                                                <div className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[10px] py-0.5 text-center font-bold">
                                                    FEATURED
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Upload Area - Drag & Drop */}
                            <div
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                                onClick={() => fileInputRef.current?.click()}
                                className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${isDragOver
                                    ? 'border-text-secondary bg-bg-secondary'
                                    : 'border-border-primary bg-bg-primary hover:border-text-secondary hover:bg-bg-tertiary'
                                    }`}
                            >
                                <div className="flex flex-col items-center gap-3">
                                    <div className="p-3 rounded-full bg-bg-secondary text-text-tertiary group-hover:text-text-primary transition-colors">
                                        <ImageIcon size={28} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-text-primary">
                                            Click to upload or drag and drop
                                        </p>
                                        <p className="text-xs text-text-tertiary mt-1">
                                            JPG, PNG, WebP up to 5MB (Multiple allowed)
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Hidden File Input */}
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={handleImageUpload}
                                className="hidden"
                            />

                            {/* URL Input Option */}
                            <div className="flex gap-2">
                                <input
                                    type="url"
                                    placeholder="Or paste image URL here..."
                                    className="input-clean flex-1 text-sm"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            handleUrlChange((e.target as HTMLInputElement).value);
                                            (e.target as HTMLInputElement).value = '';
                                        }
                                    }}
                                />
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        const input = (e.currentTarget.previousElementSibling as HTMLInputElement);
                                        handleUrlChange(input.value);
                                        input.value = '';
                                    }}
                                    className="px-4 py-2 bg-bg-tertiary hover:bg-bg-hover text-text-secondary text-xs font-bold rounded-lg transition-colors border border-border-primary"
                                >
                                    Add URL
                                </button>
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
                    {/* OTP verification message */}
                    <form onSubmit={handleStep2} className="max-w-xs mx-auto space-y-4">
                        <Input 
                            placeholder="Enter 6-digit OTP" 
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            value={otp} 
                            onChange={(e: ChangeEvent<HTMLInputElement>) => {
                                const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                                setOtp(val);
                            }}
                            className="text-center text-xl tracking-widest" 
                            maxLength={6} 
                            required 
                        />
                        <Button type="submit" disabled={loading} className="w-full">{loading ? 'Verifying...' : 'Verify OTP'}</Button>
                        <div className="text-center">
                            <button
                                type="button"
                                onClick={handleResendOtp}
                                disabled={loading || resendTimer > 0}
                                className={`text-sm font-semibold transition-colors ${resendTimer > 0 ? 'text-gray-400 cursor-not-allowed' : 'text-[#19788f] hover:text-[#166b7f] underline'}`}
                            >
                                {resendTimer > 0 ? `Resend OTP in ${formatResendTimer(resendTimer)}` : 'Resend OTP'}
                            </button>
                        </div>
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

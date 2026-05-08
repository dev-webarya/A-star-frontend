import { useState, type ChangeEvent, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { blogApi } from '../../api/blogApi.ts';
import { Card, Input, Button } from '../ui/index.tsx';
import { Mail, CheckCircle, XCircle, ArrowLeft, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

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

export const SubscribePage = () => {
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [step, setStep] = useState('subscribe');
    const [loading, setLoading] = useState(false);

    const handleSubscribe = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault(); setLoading(true);
        try { await blogApi.startSubscription({ email }); toast.success('OTP sent to your email! (Dev: 123456)'); setStep('verify'); }
        catch (err) { toast.error(getApiErrorMessage(err, 'Failed')); }
        finally { setLoading(false); }
    };

    const handleVerify = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault(); setLoading(true);
        try { await blogApi.verifySubscription({ email, otp }); toast.success('Subscribed!'); setStep('done'); }
        catch (err) { toast.error(getApiErrorMessage(err, 'Invalid OTP')); }
        finally { setLoading(false); }
    };

    const handleUnsubscribe = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault(); setLoading(true);
        try { await blogApi.unsubscribe({ email }); toast.success('Unsubscribed'); setEmail(''); setStep('subscribe'); }
        catch (err) { toast.error(getApiErrorMessage(err, 'Failed')); }
        finally { setLoading(false); }
    };

    return (
        <div className="max-w-6xl mx-auto px-6 py-10 md:py-12">
            <Link to="/blog" className="inline-flex items-center gap-2 text-base text-text-secondary hover:text-text-primary transition-colors mb-8">
                <ArrowLeft className="w-5 h-5" />
                Back to Blog
            </Link>

            <div className="text-center mb-9">
                <h1 className="text-2xl md:text-3xl font-extrabold tracking-[-0.02em] text-text-primary mb-2">Subscribe to Our Blog</h1>
                <p className="text-base text-text-secondary">Get the latest articles delivered to your inbox</p>
            </div>

            {step === 'subscribe' && (
                <div className="max-w-5xl mx-auto rounded-2xl border border-border-primary bg-bg-card p-5 md:p-6 shadow-sm">
                    <div className="flex items-start gap-3 border-b border-border-secondary pb-4 mb-4">
                        <div className="mt-1 rounded-xl bg-[#e8f3f6] p-2.5">
                            <Mail className="w-8 h-8 text-[#19788f]" />
                        </div>
                        <div>
                            <h2 className="text-xl md:text-2xl font-bold text-text-primary">Stay Updated</h2>
                            <p className="text-sm md:text-base text-text-secondary mt-1">Subscribe to receive notifications about new blog posts and updates</p>
                        </div>
                    </div>

                    <form onSubmit={handleSubscribe} className="space-y-6">
                        <Input label="Email Address" type="email" placeholder="your.email@example.com" value={email} onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)} required className="h-11 text-base" />

                        <div className="rounded-xl border border-border-primary bg-bg-secondary p-6">
                            <p className="text-xl font-bold text-text-primary mb-2">What you'll get:</p>
                            <ul className="list-disc pl-6 space-y-1 text-sm md:text-base text-text-secondary">
                                <li>Notifications about new blog posts</li>
                                <li>Weekly digest of popular articles</li>
                                <li>Exclusive educational content and tips</li>
                            </ul>
                        </div>

                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={loading}
                                className="inline-flex items-center gap-2 rounded-xl bg-[#19788f] px-5 py-2.5 text-lg font-bold text-white hover:bg-[#166b7f] transition-colors disabled:opacity-60"
                            >
                                {loading ? 'Sending OTP...' : 'Subscribe'}
                                {!loading && <ArrowRight className="w-5 h-5" />}
                            </button>
                        </div>
                    </form>

                    <div className="mt-8 pt-5 text-center border-t border-border-secondary">
                        <button onClick={() => setStep('unsubscribe')} className="text-base text-text-secondary hover:text-text-primary transition-colors">Want to unsubscribe instead?</button>
                    </div>
                </div>
            )}

            {step === 'verify' && (
                <Card className="text-center max-w-2xl mx-auto rounded-2xl border border-border-primary">
                    <Mail className="w-10 h-10 mx-auto text-text-tertiary mb-3" />
                    <h2 className="text-lg font-bold text-text-primary mb-1">Verify Your Email</h2>
                    <p className="text-text-secondary text-sm mb-2">Enter OTP sent to <strong>{email}</strong></p>
                    {/* <p className="text-xs text-text-tertiary mb-5 bg-bg-secondary rounded p-2">📌 Dev OTP: <strong>123456</strong></p> */}
                    <form onSubmit={handleVerify} className="max-w-xs mx-auto space-y-4">
                        <Input placeholder="Enter OTP" value={otp} onChange={(e: ChangeEvent<HTMLInputElement>) => setOtp(e.target.value)} className="text-center text-xl tracking-widest" maxLength={6} required />
                        <Button type="submit" disabled={loading} className="w-full">{loading ? 'Verifying...' : 'Verify & Activate'}</Button>
                        <button type="button" onClick={() => setStep('subscribe')} className="w-full pt-2 text-sm text-text-tertiary hover:text-text-primary font-medium flex items-center justify-center gap-1 transition-colors">
                            <ArrowLeft className="w-4 h-4" /> Back to Subscribe
                        </button>
                    </form>
                </Card>
            )}

            {step === 'done' && (
                <Card className="text-center max-w-2xl mx-auto rounded-2xl border border-border-primary">
                    <CheckCircle className="w-12 h-12 mx-auto text-emerald-500 mb-3" />
                    <h2 className="text-xl font-bold text-text-primary mb-1">Subscribed!</h2>
                    <p className="text-text-secondary text-sm">You'll receive emails when new blogs are published.</p>
                </Card>
            )}

            {step === 'unsubscribe' && (
                <Card className="max-w-2xl mx-auto rounded-2xl border border-border-primary">
                    <div className="text-center mb-4">
                        <XCircle className="w-10 h-10 mx-auto text-red-400 mb-2" />
                        <h2 className="text-lg font-bold text-text-primary">Unsubscribe</h2>
                    </div>
                    <form onSubmit={handleUnsubscribe} className="space-y-4">
                        <Input label="Email" type="email" placeholder="you@example.com" value={email} onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)} required />
                        <Button type="submit" variant="danger" disabled={loading} className="w-full">{loading ? 'Processing...' : 'Unsubscribe'}</Button>
                    </form>
                    <div className="mt-4 text-center">
                        <button onClick={() => setStep('subscribe')} className="text-sm text-text-tertiary hover:text-text-secondary">← Back to Subscribe</button>
                    </div>
                </Card>
            )}
        </div>
    );
};

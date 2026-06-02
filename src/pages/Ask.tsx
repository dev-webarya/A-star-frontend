
import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { askApi } from '../api/askApi';
import RichDescriptionEditor from '../components/RichDescriptionEditor';
import { getCategories } from '../api/api/categoryApi';
import { submitAnswerPublic, getApprovedAnswersByQuestion } from '../api/api/answerApi';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

type Question = {
    id: string;
    title: string;
    descriptionHtml: string;
    createdAt: string;
    category?: {
        id: string;
        name: string;
    };
};

type Answer = {
    id: string;
    contentHtml: string;
    authorName: string;
    createdAt: string;
    status: string;
};

import katex from 'katex';
import 'katex/dist/katex.min.css';

const Ask: React.FC = () => {
    const [categories, setCategories] = useState<any[]>([]);
    const [categoryId, setCategoryId] = useState('');
    const [title, setTitle] = useState('');
    const [descriptionHtml, setDescriptionHtml] = useState('');
    const [questions, setQuestions] = useState<Question[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [answersMap, setAnswersMap] = useState<Record<string, Answer[]>>({});
    const [answerText, setAnswerText] = useState('');
    const [answerLoading, setAnswerLoading] = useState(false);
    const { isAuthenticated } = useAuth();

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [cats, qs] = await Promise.all([
                getCategories(),
                askApi.getAll({ page: 0, size: 50, sort: 'createdAt', direction: 'desc' })
            ]);
            setCategories(Array.isArray(cats) ? cats : []);
            if (Array.isArray(cats) && cats.length > 0) setCategoryId(cats[0].id);
            setQuestions(qs.data?.content || []);
        } catch (error) {
            console.error('Error fetching data:', error);
            toast.error('Failed to load questions or categories');
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setTitle('');
        setDescriptionHtml('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const titleVal = (title || '').trim();
        const descHtmlVal = (descriptionHtml || '').trim();
        const descVal = descHtmlVal.replace(/<[^>]*>/g, '').trim();
        if (!titleVal || !descVal) {
            toast.error('Please fill in both title and description');
            return;
        }

        const payload = {
            title: titleVal,
            descriptionHtml: descHtmlVal,
            categoryId
        };

        try {
            const res = await askApi.create(payload);
            if (res.data) {
                setQuestions((prev) => [res.data, ...prev]);
                resetForm();
                toast.success('Question submitted successfully!');
            }
        } catch (error: any) {
            console.error('Submit error:', error);
            const isAuthError = error.response?.status === 403 || error.message?.includes('403');
            const errorMsg = isAuthError
                ? 'Please log in as admin to submit a question'
                : (error.response?.data?.message || error.message || 'Failed to submit question');
            toast.error(errorMsg);
        }
    };

    const fetchAnswers = useCallback(async (questionId: string) => {
        try {
            const data = await getApprovedAnswersByQuestion(questionId);
            setAnswersMap(prev => ({ ...prev, [questionId]: Array.isArray(data) ? data : [] }));
        } catch (error) {
            console.error('Error fetching answers:', error);
            setAnswersMap(prev => ({ ...prev, [questionId]: [] }));
        }
    }, []);

    const handleToggleExpand = (qId: string) => {
        if (expandedId === qId) {
            setExpandedId(null);
            return;
        }
        setExpandedId(qId);
        setAnswerText('');
        if (!answersMap[qId]) {
            fetchAnswers(qId);
        }
    };

    const handleSubmitAnswer = async (qId: string) => {
        if (!answerText.trim()) {
            toast.error('Please write your answer');
            return;
        }
        setAnswerLoading(true);
        try {
            await submitAnswerPublic({ questionId: qId, contentHtml: answerText.trim() });
            toast.success('Answer submitted for review!');
            setAnswerText('');
            fetchAnswers(qId);
        } catch (error: any) {
            toast.error(error.response?.data?.message || error.message || 'Failed to submit answer');
        } finally {
            setAnswerLoading(false);
        }
    };

    // Function to render LaTeX equations in HTML (Mirroring editor logic for display)
    const renderMathInHTML = (html: string): string => {
        if (!html) return '';
        let result = html;
        // Replace display math ($$...$$)
        result = result.replace(/\$\$([^$]+)\$\$/g, (match, formula) => {
             try {
                 return `<div class="math-block py-4 overflow-x-auto">${katex.renderToString(formula.trim(), { throwOnError: false, displayMode: true })}</div>`;
             } catch (e) { return match; }
         });
         // Replace inline math ($...$)
         result = result.replace(/(?<!\$)\$([^$]+)\$(?!\$)/g, (match, formula) => {
             try {
                 return `<span class="math-inline px-1">${katex.renderToString(formula.trim(), { throwOnError: false, displayMode: false })}</span>`;
             } catch (e) { return match; }
         });
        return result;
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-12 overflow-x-hidden">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-12">
                    <h1 className="text-2xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">Ask a Question</h1>
                    <p className="mt-3 text-lg text-gray-700 max-w-2xl mx-auto">
                        Select a category, choose the course/topic, then describe your question or upload a screenshot. Our team will answer and close it when resolved.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-10">
                    <section className="bg-white rounded-2xl shadow-lg border border-purple-200 p-8 hover:shadow-xl transition-shadow relative">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-semibold text-purple-800">Ask a Question</h2>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-purple-700">Category</label>
                                <select
                                    value={categoryId}
                                    onChange={(e) => setCategoryId(e.target.value)}
                                    className="mt-1 block w-full rounded-lg border-purple-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 bg-purple-50"
                                >
                                    {categories.map((cat) => (
                                        <option key={cat.id} value={cat.id}>
                                            {cat.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-purple-700">Topic/Title</label>
                                <input
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="E.g. Newton's laws question"
                                    className="mt-1 block w-full rounded-lg border-purple-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 bg-purple-50"
                                />
                            </div>

                            <RichDescriptionEditor
                                value={descriptionHtml}
                                onChange={setDescriptionHtml}
                            />

                            <button
                                type="submit"
                                className="w-full inline-flex justify-center items-center rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-3 text-white font-semibold hover:from-purple-700 hover:to-blue-700 transition-all transform hover:scale-105"
                            >
                                Submit Question
                            </button>
                        </form>

                    </section>


                    <section className="bg-white rounded-2xl shadow-lg border border-blue-200 p-8 hover:shadow-xl transition-shadow">
                        <h2 className="text-xl font-semibold text-blue-800 mb-4">Questions & Answers</h2>
                        {loading ? (
                             <div className="flex justify-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-800"></div>
                             </div>
                        ) : questions.length === 0 ? (
                            <p className="text-blue-600">No questions yet. Submit one to get started.</p>
                        ) : (
                            <div className="space-y-6">
                                {questions.map((q) => (
                                    <div key={q.id} className="border border-blue-200 rounded-xl overflow-hidden">
                                        <div
                                            className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 hover:from-blue-100 hover:to-purple-100 transition-colors cursor-pointer"
                                            onClick={() => handleToggleExpand(q.id)}
                                        >
                                            <div className="flex flex-wrap items-start justify-between gap-2">
                                                <div className="flex-1">
                                                    <div className="text-sm font-semibold text-blue-800">{q.title || 'Untitled question'}</div>
                                                    <div className="text-xs text-blue-600">
                                                        {q.category?.name} • {new Date(q.createdAt).toLocaleString()}
                                                    </div>
                                                </div>
                                                <span className="text-xs text-blue-500 font-medium shrink-0">
                                                    {expandedId === q.id ? '▲ Collapse' : '▼ Answer'}
                                                </span>
                                            </div>
                                            <div
                                                className="mt-3 text-sm text-blue-900 prose prose-sm max-w-none"
                                            >
                                                <div dangerouslySetInnerHTML={{ __html: renderMathInHTML(q.descriptionHtml) }} />
                                            </div>
                                        </div>

                                        {expandedId === q.id && (
                                            <div className="border-t border-blue-100 bg-white">
                                                {/* Existing Answers */}
                                                {answersMap[q.id] && answersMap[q.id].length > 0 && (
                                                    <div className="p-4 space-y-3 bg-blue-50/50">
                                                        <h4 className="text-xs font-bold text-blue-700 uppercase tracking-wider">Answers ({answersMap[q.id].length})</h4>
                                                        {answersMap[q.id].map((a) => (
                                                            <div key={a.id} className="bg-white rounded-lg p-3 border border-blue-100 shadow-sm">
                                                                <div className="text-xs text-gray-500 mb-1">
                                                                    {a.authorName || 'Student'} • {new Date(a.createdAt).toLocaleString()}
                                                                </div>
                                                                <div className="prose prose-xs max-w-none text-sm text-gray-800"
                                                                    dangerouslySetInnerHTML={{ __html: renderMathInHTML(a.contentHtml) }}
                                                                />
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}

                                                {/* Answer Form */}
                                                <div className="p-4 border-t border-blue-100">
                                                    <h4 className="text-xs font-bold text-purple-700 uppercase tracking-wider mb-2">Submit Your Answer</h4>
                                                    {isAuthenticated ? (
                                                        <>
                                                            <RichDescriptionEditor
                                                                value={answerText}
                                                                onChange={setAnswerText}
                                                            />
                                                            <button
                                                                onClick={() => handleSubmitAnswer(q.id)}
                                                                disabled={answerLoading}
                                                                className="mt-2 inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700 transition-all disabled:opacity-50"
                                                            >
                                                                {answerLoading ? 'Submitting...' : 'Submit Answer'}
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <div className="bg-blue-50 rounded-lg p-4 text-center">
                                                            <p className="text-sm text-blue-700 mb-2">Please log in to submit an answer</p>
                                                            <Link
                                                                to="/login"
                                                                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-all"
                                                            >
                                                                Login
                                                            </Link>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                </div>
            </div>
        </div>
    );
};

export default Ask;

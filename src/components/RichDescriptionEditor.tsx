import React, { useState, useEffect, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { X, Maximize2, Minimize2, Eye, Edit2, Plus, Link as LinkIcon, AlignLeft, AlignCenter, AlignRight, List, ListOrdered, Quote, Code, Highlighter, CheckSquare } from 'lucide-react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

interface RichDescriptionEditorProps {
    value: string;
    onChange: (content: string) => void;
}

const RichDescriptionEditor: React.FC<RichDescriptionEditorProps> = ({ value, onChange }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isPreviewMode, setIsPreviewMode] = useState(false);
    const [modalContent, setModalContent] = useState(value);

    const [isHtmlMode, setIsHtmlMode] = useState(false);
    const modalEditorRef = useRef<HTMLDivElement>(null);

    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: {
                    levels: [1, 2, 3],
                },
                bulletList: {
                    keepMarks: true,
                    keepAttributes: false,
                },
                orderedList: {
                    keepMarks: true,
                    keepAttributes: false,
                },
            }),
        ],
        content: value,
        onUpdate: ({ editor }) => {
            const html = editor.getHTML();
            if (html !== value) {
                onChange(html);
            }
        },
    });

    // Sync modal content when opening
    useEffect(() => {
        if (isModalOpen) {
            setModalContent(editor?.getHTML() || value);
            // Focus the editor after a delay to ensure DOM and animations are ready
            const focusTimer = setTimeout(() => {
                editor?.commands.focus();
            }, 350);
            return () => clearTimeout(focusTimer);
        }
    }, [isModalOpen, editor, value]);

    // Main editor sync
    useEffect(() => {
        if (editor && value !== editor.getHTML() && !isModalOpen) {
            // Only update if the content actually changed outside of the editor
            // To prevent focus issues, we don't update if the editor is already focused
            if (!editor.isFocused) {
                editor.commands.setContent(value, false);
            }
        }
    }, [value, editor, isModalOpen]);

    if (!editor) {
        return <div>Loading editor...</div>;
    }

    const handleModalDone = () => {
        const finalContent = isHtmlMode ? modalContent : editor.getHTML();
        onChange(finalContent);
        if (isHtmlMode) {
            editor.commands.setContent(finalContent);
        }
        setIsModalOpen(false);
    };

    // Function to render LaTeX equations in HTML
    const renderMathInHTML = (html: string): string => {
        if (!html) return '';
        let result = html;

        // Replace display math ($$...$$)
        result = result.replace(/\$\$([^$]+)\$\$/g, (match, formula) => {
            try {
                const rendered = katex.renderToString(formula.trim(), {
                    throwOnError: false,
                    displayMode: true,
                });
                return `<div class="math-block py-4 overflow-x-auto">${rendered}</div>`;
            } catch (e) {
                return match;
            }
        });

        // Replace inline math ($...$) but not $$...$$
        result = result.replace(/(?<!\$)\$([^$]+)\$(?!\$)/g, (match, formula) => {
            try {
                const rendered = katex.renderToString(formula.trim(), {
                    throwOnError: false,
                    displayMode: false,
                });
                return `<span class="math-inline px-1">${rendered}</span>`;
            } catch (e) {
                return match;
            }
        });

        return result;
    };


    // Insert symbol at cursor (plain text or LaTeX)
    const insertSymbol = (symbol: string, isLatex: boolean = true, display: boolean = false) => {
        if (!editor) return;
        let content = symbol;
        if (isLatex) {
            content = display ? ` $$${symbol}$$ ` : `$${symbol}$`;
        }
        editor.chain().focus().insertContent(content).run();
    };

    // Dropdown for advanced math/scientific symbols
    const mathBasic = [
        { label: 'Integral', latex: '\\int', tip: 'Integral' },
        { label: 'Double Integral', latex: '\\int\\int', tip: 'Double Integral' },
        { label: 'Sum', latex: '\\sum', tip: 'Summation' },
        { label: 'Double Sum', latex: '\\sum\\sum', tip: 'Double Sum' },
        { label: 'Root', latex: '\\sqrt{x}', tip: 'Square Root' },
        { label: 'Pi', latex: '\\pi', tip: 'Pi' },
        { label: 'Infinity', latex: '\\infty', tip: 'Infinity' },
        { label: 'Fraction', latex: '\\frac{a}{b}', tip: 'Fraction' },
        { label: 'Limit', latex: '\\lim_{x \\to \\infty}', tip: 'Limit' },
        { label: 'Log', latex: '\\log', tip: 'Logarithm' },
        { label: 'Exp', latex: '\\exp', tip: 'Exponential' },
    ];

    const mathGreek = [
        { label: 'Alpha', latex: '\\alpha', tip: 'Alpha' },
        { label: 'Beta', latex: '\\beta', tip: 'Beta' },
        { label: 'Gamma', latex: '\\gamma', tip: 'Gamma' },
        { label: 'Theta', latex: '\\theta', tip: 'Theta' },
        { label: 'Delta', latex: '\\Delta', tip: 'Delta' },
    ];

    const mathOperators = [
        { label: 'Arrow →', latex: '\\rightarrow', tip: 'Right Arrow' },
        { label: 'Arrow ←', latex: '\\leftarrow', tip: 'Left Arrow' },
        { label: 'Iff', latex: '\\Leftrightarrow', tip: 'If and only if' },
        { label: 'Not Equal', latex: '\\neq', tip: 'Not Equal' },
        { label: 'Less/Equal', latex: '\\leq', tip: 'Less than or equal' },
        { label: 'Greater/Equal', latex: '\\geq', tip: 'Greater than or equal' },
        { label: 'Approx', latex: '\\approx', tip: 'Approximately' },
        { label: 'Congruent', latex: '\\cong', tip: 'Congruent' },
        { label: 'Proportional', latex: '\\propto', tip: 'Proportional' },
        { label: 'In', latex: '\\in', tip: 'Element of' },
        { label: 'Not In', latex: '\\notin', tip: 'Not element of' },
        { label: 'Empty Set', latex: '\\emptyset', tip: 'Empty Set' },
        { label: 'Reals', latex: '\\mathbb{R}', tip: 'Real Numbers' },
        { label: 'Integers', latex: '\\mathbb{Z}', tip: 'Integers' },
        { label: 'Naturals', latex: '\\mathbb{N}', tip: 'Natural Numbers' },
        { label: 'Exists', latex: '\\exists', tip: 'Exists' },
        { label: 'For All', latex: '\\forall', tip: 'For All' },
        { label: 'Partial', latex: '\\partial', tip: 'Partial Derivative' },
        { label: 'Nabla', latex: '\\nabla', tip: 'Nabla' },
        { label: 'Union', latex: '\\cup', tip: 'Union' },
        { label: 'Intersection', latex: '\\cap', tip: 'Intersection' },
        { label: 'Subset', latex: '\\subset', tip: 'Subset' },
        { label: 'SubsetEq', latex: '\\subseteq', tip: 'Subset or equal' },
        { label: 'Superset', latex: '\\supset', tip: 'Superset' },
        { label: 'SupersetEq', latex: '\\supseteq', tip: 'Superset or equal' },
        { label: 'Angle', latex: '\\angle', tip: 'Angle' },
        { label: 'Degree', latex: '^{\\circ}', tip: 'Degree' },
    ];

    const mathAdvanced = [
        { label: 'Matrix', latex: '\\begin{matrix} a & b \\\\ c & d \\end{matrix}', tip: 'Matrix' },
        { label: 'Binomial', latex: '\\binom{n}{k}', tip: 'Binomial' },
        { label: 'Vector', latex: '\\vec{v}', tip: 'Vector' },
        { label: 'Unit (Hat)', latex: '\\hat{u}', tip: 'Unit Vector' },
        { label: 'Mean (Bar)', latex: '\\bar{x}', tip: 'Mean' },
        { label: 'Underline', latex: '\\underline{x}', tip: 'Underline' },
        { label: 'Overline', latex: '\\overline{x}', tip: 'Overline' },
        { label: 'Dot', latex: '\\cdot', tip: 'Dot Product' },
        { label: 'Times', latex: '\\times', tip: 'Cross Product' },
        { label: 'Divide', latex: '\\div', tip: 'Division' },
        { label: 'PlusMinus', latex: '\\pm', tip: 'Plus or Minus' },
        { label: 'MinusPlus', latex: '\\mp', tip: 'Minus or Plus' },
        { label: 'Ellipsis (ldots)', latex: '\\ldots', tip: 'Ellipsis' },
        { label: 'Dots (dotsc)', latex: '\\dotsc', tip: 'Dots' },
        { label: 'Prime', latex: "x'", tip: 'Prime' },
    ];

    const writingSymbols = [
        { label: 'Em Dash', char: '—', tip: 'Em Dash' },
        { label: 'En Dash', char: '–', tip: 'En Dash' },
        { label: 'Bullet', char: '•', tip: 'Bullet' },
        { label: 'Copyright', char: '©', tip: 'Copyright' },
        { label: 'Registered', char: '®', tip: 'Registered' },
        { label: 'Trademark', char: '™', tip: 'Trademark' },
        { label: 'Section', char: '§', tip: 'Section' },
        { label: 'Paragraph', char: '¶', tip: 'Paragraph' },
        { label: 'Dagger', char: '†', tip: 'Dagger' },
        { label: 'Double Dagger', char: '‡', tip: 'Double Dagger' },
        { label: 'Ellipsis', char: '…', tip: 'Ellipsis' },
    ];

    // Dropdown component for symbol palettes
    const SymbolDropdown = ({ symbols, label, isLatex = true }: { symbols: any[]; label: string; isLatex?: boolean }) => {
        const [open, setOpen] = useState(false);
        return (
            <div className="relative inline-block">
                <button
                    type="button"
                    className="p-2 rounded text-sm bg-white text-purple-700 hover:bg-purple-50 border border-purple-300 font-medium flex items-center gap-1"
                    onClick={(e) => {
                        e.stopPropagation();
                        setOpen((v) => !v);
                    }}
                    title={label}
                >
                    {label} <span className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>▼</span>
                </button>
                {open && (
                    <>
                        <div 
                            className="fixed inset-0 z-[5]" 
                            onClick={() => setOpen(false)}
                        ></div>
                        <div className="absolute z-10 mt-2 w-56 bg-white border border-purple-200 rounded-xl shadow-xl max-h-72 overflow-y-auto animate-in fade-in zoom-in-95 duration-200 origin-top-left">
                            {symbols.map((sym, i) => (
                                <button
                                    key={i}
                                    type="button"
                                    className="block w-full text-left px-4 py-2.5 hover:bg-purple-50 text-sm font-medium text-gray-700 transition-colors border-b border-gray-50 last:border-0"
                                    title={sym.tip}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (isLatex) {
                                            insertSymbol(sym.latex, true, sym.latex.includes('\\begin') || sym.latex.includes('\\int\\int') || sym.latex.includes('\\sum\\sum'));
                                        } else {
                                            insertSymbol(sym.char, false);
                                        }
                                        setOpen(false);
                                    }}
                                >
                                    {sym.label}
                                </button>
                            ))}
                        </div>
                    </>
                )}
            </div>
        );
    };

    const EditorToolbar = ({ hideExpand = false }: { hideExpand?: boolean }) => {
        const setLink = () => {
            const previousUrl = editor.getAttributes('link').href;
            const url = window.prompt('URL', previousUrl);
            if (url === null) return;
            if (url === '') {
                editor.chain().focus().extendMarkRange('link').unsetLink().run();
                return;
            }
            editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
        };

        return (
            <div className="flex flex-wrap gap-1 bg-gradient-to-r from-gray-50 to-gray-100 p-2 rounded-t-lg border-b border-gray-300 items-center">
                {/* Text Styling */}
                <div className="flex items-center gap-0.5 bg-white rounded-md border border-gray-200 p-0.5 shadow-sm">
                    <button type="button"
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); editor.chain().focus().toggleBold().run(); }}
                        className={`p-1.5 rounded hover:bg-gray-100 transition-colors ${editor.isActive('bold') ? 'bg-purple-100 text-purple-700' : 'text-gray-600'}`}
                        title="Bold (Ctrl+B)"
                    >
                        <strong>B</strong>
                    </button>
                    <button type="button"
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); editor.chain().focus().toggleItalic().run(); }}
                        className={`p-1.5 rounded hover:bg-gray-100 transition-colors ${editor.isActive('italic') ? 'bg-purple-100 text-purple-700' : 'text-gray-600'}`}
                        title="Italic (Ctrl+I)"
                    >
                        <em>I</em>
                    </button>
                    <button type="button"
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); editor.chain().focus().toggleStrike().run(); }}
                        className={`p-1.5 rounded hover:bg-gray-100 transition-colors ${editor.isActive('strike') ? 'bg-purple-100 text-purple-700' : 'text-gray-600'}`}
                        title="Strikethrough"
                    >
                        <s>S</s>
                    </button>
                </div>

                <div className="w-px h-6 bg-gray-300 mx-1"></div>

                {/* Headings */}
                <div className="flex items-center gap-0.5 bg-white rounded-md border border-gray-200 p-0.5 shadow-sm">
                    <button type="button"
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); editor.chain().focus().toggleHeading({ level: 1 }).run(); }}
                        className={`px-2 py-1 rounded text-xs font-bold transition-colors ${editor.isActive('heading', { level: 1 }) ? 'bg-purple-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                        title="H1"
                    >
                        H1
                    </button>
                    <button type="button"
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); editor.chain().focus().toggleHeading({ level: 2 }).run(); }}
                        className={`px-2 py-1 rounded text-xs font-bold transition-colors ${editor.isActive('heading', { level: 2 }) ? 'bg-purple-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                        title="H2"
                    >
                        H2
                    </button>
                    <button type="button"
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); editor.chain().focus().toggleHeading({ level: 3 }).run(); }}
                        className={`px-2 py-1 rounded text-xs font-bold transition-colors ${editor.isActive('heading', { level: 3 }) ? 'bg-purple-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                        title="H3"
                    >
                        H3
                    </button>
                </div>

                <div className="w-px h-6 bg-gray-300 mx-1"></div>

                {/* Lists & Blocks */}
                <div className="flex items-center gap-0.5 bg-white rounded-md border border-gray-200 p-0.5 shadow-sm">
                    <button type="button"
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); editor.chain().focus().toggleBulletList().run(); }}
                        className={`p-1.5 rounded hover:bg-gray-100 transition-colors ${editor.isActive('bulletList') ? 'bg-purple-100 text-purple-700' : 'text-gray-600'}`}
                        title="Bullet List"
                    >
                        <List className="h-4 w-4" />
                    </button>
                    <button type="button"
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); editor.chain().focus().toggleOrderedList().run(); }}
                        className={`p-1.5 rounded hover:bg-gray-100 transition-colors ${editor.isActive('orderedList') ? 'bg-purple-100 text-purple-700' : 'text-gray-600'}`}
                        title="Ordered List"
                    >
                        <ListOrdered className="h-4 w-4" />
                    </button>
                    <button type="button"
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); editor.chain().focus().toggleBlockquote().run(); }}
                        className={`p-1.5 rounded hover:bg-gray-100 transition-colors ${editor.isActive('blockquote') ? 'bg-purple-100 text-purple-700' : 'text-gray-600'}`}
                        title="Blockquote"
                    >
                        <Quote className="h-4 w-4" />
                    </button>
                    <button type="button"
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); editor.chain().focus().toggleCodeBlock().run(); }}
                        className={`p-1.5 rounded hover:bg-gray-100 transition-colors ${editor.isActive('codeBlock') ? 'bg-purple-100 text-purple-700' : 'text-gray-600'}`}
                        title="Code Block"
                    >
                        <Code className="h-4 w-4" />
                    </button>
                </div>

                <div className="w-px h-6 bg-gray-300 mx-1"></div>

                {/* Math & Symbols */}
                <div className="flex items-center gap-1">
                    <button type="button"
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); insertSymbol('\\frac{a}{b}', true, true); }}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs bg-white text-purple-700 hover:bg-purple-50 transition-colors border border-purple-200 font-bold shadow-sm"
                        title="Insert Fraction"
                    >
                        <Plus className="h-3 w-3" />
                        ∑
                    </button>
                    
                    <SymbolDropdown symbols={mathBasic} label="Math" />
                    <SymbolDropdown symbols={mathGreek} label="Greek" />
                    <SymbolDropdown symbols={mathOperators} label="Ops" />
                    <SymbolDropdown symbols={mathAdvanced} label="Adv" />
                    <SymbolDropdown symbols={writingSymbols} label="Text" isLatex={false} />
                </div>

                <div className="flex-1"></div>

                {/* Clear & Expand */}
                <div className="flex items-center gap-1">
                    <button type="button"
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); editor.chain().focus().clearNodes().unsetAllMarks().run(); }}
                        className="p-1.5 rounded text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors"
                        title="Clear Formatting"
                    >
                        ✕
                    </button>

                    {!hideExpand && (
                        <button type="button"
                            onClick={(e) => { e.preventDefault(); setIsModalOpen(true); }}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700 transition-all shadow-md active:scale-95"
                            title="Open in full-screen"
                        >
                            <Maximize2 className="h-3.5 w-3.5" />
                            Expand
                        </button>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-3">
            {/* Inline Editor */}
            <div className="relative">
                <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-purple-700 flex items-center gap-2">
                        <span>📝 Description</span>
                        {isPreviewMode && <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full animate-pulse">Preview Mode</span>}
                    </label>
                </div>

                {!isPreviewMode ? (
                    !isModalOpen ? (
                        <div className="flex flex-col border-2 border-purple-300 rounded-lg shadow-sm overflow-hidden bg-white">
                            <EditorToolbar />
                            <EditorContent
                                editor={editor}
                                className="prose prose-sm max-w-none focus:outline-none p-4 min-h-[150px] bg-white pointer-events-auto"
                            />
                        </div>
                    ) : (
                        <div className="border-2 border-dashed border-purple-200 rounded-lg p-10 text-center bg-purple-50/50 backdrop-blur-sm">
                            <div className="flex flex-col items-center gap-3">
                                <div className="p-3 bg-purple-100 rounded-full">
                                    <Maximize2 className="h-6 w-6 text-purple-600" />
                                </div>
                                <p className="text-purple-700 font-semibold text-lg">Editor is active in full-screen</p>
                                <p className="text-purple-500 text-sm">Please complete your editing in the modal window</p>
                                <button type="button"
                                    onClick={(e) => { e.preventDefault(); setIsModalOpen(true); }}
                                    className="mt-2 px-6 py-2 bg-purple-600 text-white rounded-full text-sm font-bold hover:bg-purple-700 transition-all shadow-lg active:scale-95"
                                >
                                    Go back to full-screen
                                </button>
                            </div>
                        </div>
                    )
                ) : (
                    <div
                        className="border-2 border-purple-300 rounded-lg bg-white prose prose-sm max-w-none p-4 min-h-[150px] overflow-y-auto shadow-inner"
                        dangerouslySetInnerHTML={{ __html: renderMathInHTML(value || '<p class="text-gray-400">No content yet...</p>') }}
                    />
                )}

                <div className="flex items-center gap-2 mt-3">
                    <button type="button"
                        onClick={(e) => { e.preventDefault(); setIsPreviewMode(!isPreviewMode); }}
                        className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-xl transition-all shadow-md active:scale-95 ${
                            isPreviewMode 
                            ? 'bg-gray-800 text-white hover:bg-gray-900' 
                            : 'bg-white text-gray-700 border-2 border-gray-200 hover:bg-gray-50'
                        }`}
                    >
                        {isPreviewMode ? (
                            <>
                                <Edit2 className="h-4 w-4" />
                                Back to Edit
                            </>
                        ) : (
                            <>
                                <Eye className="h-4 w-4" />
                                Preview Content
                            </>
                        )}
                    </button>
                    
                    {!isModalOpen && (
                        <button type="button"
                            onClick={(e) => { e.preventDefault(); setIsModalOpen(true); }}
                            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-xl bg-purple-100 text-purple-700 hover:bg-purple-200 transition-all active:scale-95"
                        >
                            <Maximize2 className="h-4 w-4" />
                            Full Screen
                        </button>
                    )}
                </div>
            </div>

            {/* Full-Screen Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in duration-300">
                    <div className="w-full max-w-6xl h-[90vh] bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-white/20 animate-in zoom-in-95 duration-300">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between bg-gradient-to-r from-purple-700 via-indigo-700 to-purple-800 p-6 shadow-lg">
                            <div className="flex items-center gap-4">
                                <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                                    <Edit2 className="h-6 w-6 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black text-white tracking-tight">Professional Editor</h2>
                                    <p className="text-purple-100 text-xs font-medium opacity-80 uppercase tracking-widest">Mathematical & Rich Text Support</p>
                                </div>
                            </div>
                            <button type="button"
                                onClick={() => setIsModalOpen(false)}
                                className="rounded-full p-2 text-white/80 hover:bg-white/20 hover:text-white transition-all focus:outline-none active:scale-90"
                            >
                                <X className="h-8 w-8" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="flex-1 overflow-y-auto bg-gray-50/50">
                            <div className="p-6 h-full flex flex-col gap-4">
                                {/* Mode Toggle */}
                                <div className="flex items-center justify-between bg-white p-3 rounded-2xl border border-gray-200 shadow-sm">
                                    <div className="flex items-center gap-2 p-1 bg-gray-100 rounded-xl">
                                        <button type="button"
                                            onClick={() => setIsPreviewMode(false)}
                                            className={`inline-flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-bold transition-all ${!isPreviewMode
                                                ? 'bg-white text-purple-700 shadow-sm'
                                                : 'text-gray-500 hover:text-gray-700'
                                                }`}
                                        >
                                            <Edit2 className="h-4 w-4" />
                                            Edit
                                        </button>
                                        <button type="button"
                                            onClick={() => setIsPreviewMode(true)}
                                            className={`inline-flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-bold transition-all ${isPreviewMode
                                                ? 'bg-white text-purple-700 shadow-sm'
                                                : 'text-gray-500 hover:text-gray-700'
                                                }`}
                                        >
                                            <Eye className="h-4 w-4" />
                                            Preview
                                        </button>
                                    </div>

                                    {!isPreviewMode && (
                                        <div className="flex items-center gap-3">
                                            <span className="text-xs font-black text-gray-400 uppercase tracking-tighter">Advanced Mode:</span>
                                            <button type="button"
                                                onClick={() => {
                                                    if (isHtmlMode) {
                                                        editor.commands.setContent(modalContent);
                                                    } else {
                                                        setModalContent(editor.getHTML());
                                                    }
                                                    setIsHtmlMode(!isHtmlMode);
                                                }}
                                                className={`px-4 py-2 rounded-xl text-xs font-black transition-all uppercase tracking-widest border-2 ${isHtmlMode 
                                                    ? 'bg-orange-50 border-orange-200 text-orange-600 shadow-inner' 
                                                    : 'bg-blue-50 border-blue-200 text-blue-600 shadow-sm hover:shadow-md'}`}
                                            >
                                                {isHtmlMode ? '💻 HTML Editor' : '✨ Visual Editor'}
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <div className="flex-1 flex flex-col min-h-0">
                                    {!isPreviewMode ? (
                                        isHtmlMode ? (
                                            <textarea
                                                className="w-full h-full p-8 text-gray-800 bg-white rounded-3xl border-2 border-purple-100 focus:border-purple-400 focus:ring-4 focus:ring-purple-100 outline-none font-mono text-sm leading-relaxed shadow-inner transition-all resize-none"
                                                value={modalContent}
                                                onChange={(e) => setModalContent(e.target.value)}
                                                placeholder="Write your raw HTML here..."
                                            />
                                        ) : (
                                            <div className="flex-1 flex flex-col bg-white border-2 border-purple-100 rounded-3xl overflow-hidden shadow-xl">
                                                <EditorToolbar hideExpand={true} />
                                                <div
                                                    ref={modalEditorRef}
                                                    className="flex-1 overflow-y-auto p-4 custom-scrollbar cursor-text"
                                                    onClick={() => editor?.commands.focus()}
                                                >
                                                    <EditorContent
                                                        editor={editor}
                                                        className="prose prose-sm md:prose-base max-w-none focus:outline-none min-h-full pb-20 pointer-events-auto"
                                                    />
                                                </div>
                                            </div>
                                        )
                                    ) : (
                                        <div className="flex-1 w-full p-10 bg-white rounded-3xl border-2 border-purple-100 overflow-y-auto prose prose-indigo max-w-none shadow-2xl custom-scrollbar">
                                            <div dangerouslySetInnerHTML={{ __html: renderMathInHTML(isHtmlMode ? modalContent : editor.getHTML()) }} />
                                        </div>
                                    )}
                                </div>

                                {/* Formatting Guide - Clean Version */}
                                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-100 p-8 rounded-3xl shadow-sm">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="p-2 bg-indigo-600 rounded-lg">
                                            <Highlighter className="h-5 w-5 text-white" />
                                        </div>
                                        <h3 className="font-black text-indigo-900 text-xl tracking-tight">Master Formatting Guide</h3>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                                        <div className="space-y-3">
                                            <h4 className="font-bold text-indigo-800 text-sm uppercase tracking-wider flex items-center gap-2">
                                                <Edit2 className="h-4 w-4" /> Text
                                            </h4>
                                            <ul className="text-sm text-indigo-700/80 space-y-2 font-medium">
                                                <li className="flex items-center gap-2"><span><b>B</b></span> Bold (Ctrl+B)</li>
                                                <li className="flex items-center gap-2"><span><i>I</i></span> Italic (Ctrl+I)</li>
                                                <li className="flex items-center gap-2"><span><s>S</s></span> Strikethrough</li>
                                            </ul>
                                        </div>

                                        <div className="space-y-3">
                                            <h4 className="font-bold text-indigo-800 text-sm uppercase tracking-wider flex items-center gap-2">
                                                <List className="h-4 w-4" /> Structure
                                            </h4>
                                            <ul className="text-sm text-indigo-700/80 space-y-2 font-medium">
                                                <li>• H1, H2, H3 Headings</li>
                                                <li>• Bullet & Numbered Lists</li>
                                                <li>• Quotes & Code Blocks</li>
                                            </ul>
                                        </div>

                                        <div className="space-y-3 lg:col-span-2">
                                            <h4 className="font-bold text-indigo-800 text-sm uppercase tracking-wider flex items-center gap-2">
                                                <Plus className="h-4 w-4" /> Mathematics
                                            </h4>
                                            <div className="grid grid-cols-2 gap-4">
                                                <ul className="text-sm text-indigo-700/80 space-y-2 font-medium">
                                                    <li>Inline: <code>$x^2$</code></li>
                                                    <li>Block: <code>$$ \int f(x) $$</code></li>
                                                </ul>
                                                <div className="bg-white/50 p-3 rounded-xl border border-indigo-100">
                                                    <p className="text-[10px] text-indigo-500 font-black uppercase mb-1">Live Example</p>
                                                    <div className="text-sm" dangerouslySetInnerHTML={{ __html: katex.renderToString("\\sum_{n=1}^\\infty \\frac{1}{n^2} = \\frac{\\pi^2}{6}", { throwOnError: false }) }} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="bg-white border-t border-gray-100 p-6 flex items-center justify-between shadow-[0_-10px_30px_-15px_rgba(0,0,0,0.1)]">
                            <div className="flex items-center gap-3 text-green-600 bg-green-50 px-4 py-2 rounded-full border border-green-100">
                                <div className="h-2 w-2 bg-green-500 rounded-full animate-ping" />
                                <span className="text-xs font-bold uppercase tracking-wider">Live Editing Active</span>
                            </div>
                            <div className="flex items-center gap-4">
                                <button type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-6 py-3 text-sm font-bold text-gray-500 hover:text-gray-700 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button type="button"
                                    onClick={handleModalDone}
                                    className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 px-10 py-4 text-white font-black text-sm uppercase tracking-widest hover:from-purple-700 hover:to-indigo-700 transition-all shadow-xl hover:shadow-purple-200 active:scale-95"
                                >
                                    <Minimize2 className="h-5 w-5" />
                                    Save Changes
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* KaTeX and Editor styles */}
            <style>{`
                .math-block {
                    display: block;
                    text-align: center;
                    margin: 1.5em 0;
                    overflow-x: auto;
                    padding: 1rem;
                    background: #f8f9fa;
                    border-radius: 8px;
                }
                .math-inline {
                    display: inline;
                    padding: 0 4px;
                    color: #4338ca;
                    font-weight: 500;
                }
                .katex {
                    font-size: 1.1em;
                }
                
                /* Tiptap Editor Styling */
                .ProseMirror {
                    outline: none !important;
                }
                .ProseMirror p.is-editor-empty:first-child::before {
                    content: attr(data-placeholder);
                    float: left;
                    color: #adb5bd;
                    pointer-events: none;
                    height: 0;
                }
                
                /* Lists */
                .ProseMirror ul {
                    list-style-type: disc;
                    padding-left: 1.5rem;
                    margin: 1rem 0;
                }
                .ProseMirror ol {
                    list-style-type: decimal;
                    padding-left: 1.5rem;
                    margin: 1rem 0;
                }
                .ProseMirror li {
                    margin-bottom: 0.5rem;
                }
                
                /* Blockquotes */
                .ProseMirror blockquote {
                    border-left: 4px solid #6366f1;
                    padding-left: 1rem;
                    margin: 1.5rem 0;
                    font-style: italic;
                    color: #4b5563;
                    background: #f3f4f6;
                    padding-top: 0.5rem;
                    padding-bottom: 0.5rem;
                }
                
                /* Code Blocks */
                .ProseMirror pre {
                    background: #1f2937;
                    color: #f3f4f6;
                    padding: 1rem;
                    border-radius: 8px;
                    font-family: 'Fira Code', monospace;
                    margin: 1.5rem 0;
                    overflow-x: auto;
                }
                .ProseMirror code {
                    background: #f3f4f6;
                    color: #ef4444;
                    padding: 0.2rem 0.4rem;
                    border-radius: 4px;
                    font-size: 0.9em;
                }
                
                /* Tasks */
                .ProseMirror ul[data-type="taskList"] {
                    list-style: none;
                    padding: 0;
                }
                .ProseMirror ul[data-type="taskList"] li {
                    display: flex;
                    align-items: flex-start;
                    gap: 0.5rem;
                }
                .ProseMirror ul[data-type="taskList"] input[type="checkbox"] {
                    margin-top: 0.3rem;
                    cursor: pointer;
                }

                /* Links */
                .ProseMirror a {
                    color: #6366f1;
                    text-decoration: underline;
                    cursor: pointer;
                }

                /* Highlight */
                .ProseMirror mark {
                    background-color: #fef08a;
                    padding: 0.1rem 0.2rem;
                    border-radius: 2px;
                }
                
                .custom-scrollbar::-webkit-scrollbar {
                    width: 8px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: #f1f1f1;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #c7d2fe;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #818cf8;
                }
            `}</style>
        </div>
    );
};

export default RichDescriptionEditor;

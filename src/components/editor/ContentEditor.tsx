import { useState, useRef, useCallback, useEffect, type ClipboardEvent, type KeyboardEvent, type MouseEvent, type ReactNode, type SyntheticEvent } from 'react';
import {
    Bold, Italic, Underline, Strikethrough, Heading1, Heading2, Heading3,
    List, ListOrdered, Code, Quote, Link as LinkIcon, Image as ImageIcon,
    Minus, Eye, Edit3, AlignLeft, AlignCenter, AlignRight, ImageOff, Undo, Redo,
    Type, Loader2
} from 'lucide-react';
import { uploadToCloudinary } from '../../utils/cloudinaryUpload';
import toast from 'react-hot-toast';

type ToolbarAction = {
    key: string;
    separator?: false;
    icon: (props: { size?: number | string; className?: string }) => ReactNode;
    label: string;
    command?: string;
    value?: string;
    special?: 'code' | 'image' | 'link';
};

type ToolbarSeparator = {
    key: string;
    separator: true;
};

type ToolbarItem = ToolbarAction | ToolbarSeparator;

type ContentEditorProps = {
    initialContent?: string;
    onChange: (html: string) => void;
};

/* ─── Toolbar config ─── */
const TOOLBAR: ToolbarItem[] = [
    { key: 'undo', icon: Undo, label: 'Undo', command: 'undo' },
    { key: 'redo', icon: Redo, label: 'Redo', command: 'redo' },
    { key: 'sep0', separator: true },
    { key: 'bold', icon: Bold, label: 'Bold (Ctrl+B)', command: 'bold' },
    { key: 'italic', icon: Italic, label: 'Italic (Ctrl+I)', command: 'italic' },
    { key: 'underline', icon: Underline, label: 'Underline (Ctrl+U)', command: 'underline' },
    { key: 'strikethrough', icon: Strikethrough, label: 'Strikethrough', command: 'strikeThrough' },
    { key: 'sep1', separator: true },
    { key: 'h1', icon: Heading1, label: 'Heading 1', command: 'formatBlock', value: '<h1>' },
    { key: 'h2', icon: Heading2, label: 'Heading 2', command: 'formatBlock', value: '<h2>' },
    { key: 'h3', icon: Heading3, label: 'Heading 3', command: 'formatBlock', value: '<h3>' },
    { key: 'paragraph', icon: Type, label: 'Normal Text', command: 'formatBlock', value: '<p>' },
    { key: 'sep2', separator: true },
    { key: 'ul', icon: List, label: 'Bullet List', command: 'insertUnorderedList' },
    { key: 'ol', icon: ListOrdered, label: 'Numbered List', command: 'insertOrderedList' },
    { key: 'blockquote', icon: Quote, label: 'Blockquote', command: 'formatBlock', value: '<blockquote>' },
    { key: 'sep3', separator: true },
    { key: 'code', icon: Code, label: 'Code Block', special: 'code' },
    { key: 'hr', icon: Minus, label: 'Horizontal Rule', command: 'insertHorizontalRule' },
    { key: 'sep4', separator: true },
    { key: 'alignLeft', icon: AlignLeft, label: 'Align Left', command: 'justifyLeft' },
    { key: 'alignCenter', icon: AlignCenter, label: 'Align Center', command: 'justifyCenter' },
    { key: 'alignRight', icon: AlignRight, label: 'Align Right', command: 'justifyRight' },
    { key: 'sep5', separator: true },
    { key: 'link', icon: LinkIcon, label: 'Insert Link', special: 'link' },
    { key: 'image', icon: ImageIcon, label: 'Insert Image', special: 'image' },
];

export const ContentEditor = ({ initialContent, onChange }: ContentEditorProps) => {
    const editorRef = useRef<HTMLDivElement | null>(null);
    const [mode, setMode] = useState<'edit' | 'preview'>('edit');
    const [htmlContent, setHtmlContent] = useState(initialContent || '');
    const [showImageDialog, setShowImageDialog] = useState(false);
    const [showLinkDialog, setShowLinkDialog] = useState(false);
    const [imageUrl, setImageUrl] = useState('');
    const [imageAlt, setImageAlt] = useState('');
    const [linkUrl, setLinkUrl] = useState('');
    const [linkText, setLinkText] = useState('');
    const [savedSelection, setSavedSelection] = useState<Range | null>(null);
    const [wordCount, setWordCount] = useState(0);
    const [uploadingImage, setUploadingImage] = useState(false);

    // Restore content into editor when switching back to edit mode
    useEffect(() => {
        if (mode === 'edit' && editorRef.current) {
            // Ensure content always has at least one paragraph to avoid global formatting issues
            const content = htmlContent || '<p><br></p>';
            editorRef.current.innerHTML = content;
            if (!htmlContent) setHtmlContent(content);
            updateWordCount();
        }
    }, [mode]);

    // Set initial content on first mount
    useEffect(() => {
        if (editorRef.current && !editorRef.current.innerHTML) {
            const content = initialContent || '<p><br></p>';
            editorRef.current.innerHTML = content;
            setHtmlContent(content);
            updateWordCount();
        }
    }, [initialContent]);

    const saveSelection = () => {
        const sel = window.getSelection();
        if (sel && sel.rangeCount > 0) {
            const range = sel.getRangeAt(0);
            // Ensure selection is inside the editor
            if (editorRef.current?.contains(range.commonAncestorContainer)) {
                setSavedSelection(range.cloneRange());
            }
        }
    };

    const restoreSelection = () => {
        if (savedSelection && editorRef.current) {
            const sel = window.getSelection();
            if (!sel) return;
            sel.removeAllRanges();
            sel.addRange(savedSelection.cloneRange());
        }
    };

    const focusEditorWithSelection = () => {
        const editor = editorRef.current;
        if (!editor) return;

        editor.focus();
        const sel = window.getSelection();
        if (!sel) return;

        if (savedSelection) {
            try {
                sel.removeAllRanges();
                sel.addRange(savedSelection.cloneRange());
            } catch (e) {
                console.error('Failed to restore selection:', e);
            }
        }
    };

    const updateWordCount = () => {
        if (editorRef.current) {
            const text = editorRef.current.innerText.trim();
            setWordCount(text ? text.split(/\s+/).length : 0);
        }
    };

    const handleInput = useCallback(() => {
        if (editorRef.current) {
            let html = editorRef.current.innerHTML;
            // Basic cleanup: if editor is empty or just <br>, reset to a paragraph
            if (!html || html === '<br>' || html === '<div><br></div>') {
                html = '<p><br></p>';
                editorRef.current.innerHTML = html;
            }
            setHtmlContent(html);
            onChange(html);
            updateWordCount();
        }
    }, [onChange]);

    const switchMode = (newMode: 'edit' | 'preview') => {
        if (mode === 'edit' && editorRef.current) {
            const html = editorRef.current.innerHTML;
            setHtmlContent(html);
        }
        setMode(newMode);
    };

    const restoreSelectionRange = (range?: Range | null) => {
        const editor = editorRef.current;
        if (!editor) return;
        const sel = window.getSelection();
        if (!sel) return;
        const finalRange = range || savedSelection;
        if (!finalRange) return;

        sel.removeAllRanges();
        sel.addRange(finalRange.cloneRange());
    };

    const execCommand = (command: string, value: string | null = null) => {
        const editor = editorRef.current;
        if (!editor) return;

        editor.focus();
        restoreSelectionRange();

        try {
            if (command === 'formatBlock' && value && (value.startsWith('<h') || value === '<blockquote>')) {
                // To avoid "everything becomes heading", we ensure we are working with blocks
                document.execCommand('formatBlock', false, value);
            } else if (value) {
                document.execCommand(command, false, value);
            } else {
                document.execCommand(command, false);
            }
        } catch (e) {
            console.error(`Command '${command}' failed:`, e);
        }

        saveSelection();
        handleInput();
    };

    const handleToolbar = useCallback((item: ToolbarAction) => {
        const editor = editorRef.current;
        if (!editor) return;

        const sel = window.getSelection();
        if (!sel) return;

        // Ensure editor is focused and selection is restored
        editor.focus();
        if (savedSelection) {
            restoreSelectionRange(savedSelection);
        }

        if (item.special === 'image') {
            saveSelection();
            setShowImageDialog(true);
            return;
        }
        if (item.special === 'link') {
            saveSelection();
            const linkTextContent = sel.toString();
            setLinkText(linkTextContent);
            setShowLinkDialog(true);
            return;
        }
        if (item.special === 'code') {
            const range = sel.rangeCount > 0 ? sel.getRangeAt(0) : null;
            if (!range) return;

            // Check if we are already inside a code block to remove it
            let parent = range.commonAncestorContainer as Node | null;
            while (parent && parent !== editor) {
                if (parent.nodeName === 'PRE') {
                    // Convert back to paragraph
                    const p = document.createElement('p');
                    p.innerHTML = (parent as HTMLElement).innerHTML;
                    parent.parentNode?.replaceChild(p, parent);
                    handleInput();
                    return;
                }
                parent = parent.parentNode;
            }

            // Otherwise, insert code block
            const selectedText = sel.toString();
            const pre = document.createElement('pre');
            const code = document.createElement('code');
            code.textContent = selectedText || 'Code here...';
            pre.appendChild(code);

            range.deleteContents();
            range.insertNode(pre);
            
            // Insert a paragraph after the code block so user can continue typing
            const p = document.createElement('p');
            p.innerHTML = '<br>';
            pre.after(p);
            
            range.setStart(p, 0);
            range.collapse(true);
            sel.removeAllRanges();
            sel.addRange(range);

            saveSelection();
            handleInput();
            return;
        }

        if (item.command) {
            execCommand(item.command, item.value || null);
        }
    }, [handleInput, savedSelection]);

    const handleInsertImage = () => {
        if (!imageUrl.trim()) { setShowImageDialog(false); return; }
        editorRef.current?.focus();
        restoreSelection();

        const figure = document.createElement('figure');
        figure.className = 'blog-figure';

        const img = document.createElement('img');
        img.src = imageUrl.trim();
        img.alt = imageAlt.trim() || 'image';
        img.className = 'blog-img';
        
        figure.appendChild(img);

        if (imageAlt.trim()) {
            const caption = document.createElement('figcaption');
            caption.textContent = imageAlt.trim();
            figure.appendChild(caption);
        }

        // Add a paragraph after the image for easier editing
        const p = document.createElement('p');
        p.innerHTML = '<br>';

        const sel = window.getSelection();
        if (sel && sel.rangeCount > 0) {
            const range = sel.getRangeAt(0);
            range.deleteContents();
            range.insertNode(p);
            range.insertNode(figure);
            range.setStart(p, 0);
            range.collapse(true);
            sel.removeAllRanges();
            sel.addRange(range);
        } else {
            editorRef.current?.appendChild(figure);
            editorRef.current?.appendChild(p);
        }

        handleInput();
        setShowImageDialog(false);
        setImageUrl('');
        setImageAlt('');
    };

    const handleImageFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingImage(true);
        const toastId = 'editor-upload';
        toast.loading('Processing image...', { id: toastId });

        try {
            const cloudinaryUrl = await uploadToCloudinary(file);
            setImageUrl(cloudinaryUrl);
            toast.success('Image uploaded!', { id: toastId });
        } catch {
            // Cloudinary failed — fall back to base64
            try {
                const dataUrl = await readFileAsDataUrl(file);
                setImageUrl(dataUrl);
                toast.success('Image added (local)', { id: toastId });
            } catch {
                toast.error('Failed to load image', { id: toastId });
            }
        }
        setUploadingImage(false);
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

    const handleInsertLink = () => {
        if (!linkUrl.trim()) { setShowLinkDialog(false); return; }
        editorRef.current?.focus();
        restoreSelection();

        const text = linkText.trim() || linkUrl.trim();
        const a = document.createElement('a');
        a.href = linkUrl.trim();
        a.textContent = text;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';

        const sel = window.getSelection();
        if (sel && sel.rangeCount > 0) {
            const range = sel.getRangeAt(0);
            range.deleteContents();
            range.insertNode(a);
            range.setStartAfter(a);
            range.collapse(true);
            sel.removeAllRanges();
            sel.addRange(range);
        }

        handleInput();
        setShowLinkDialog(false);
        setLinkUrl('');
        setLinkText('');
    };

    const handlePaste = (e: ClipboardEvent<HTMLDivElement>) => {
        e.preventDefault();
        const html = e.clipboardData.getData('text/html');
        const text = e.clipboardData.getData('text/plain');

        if (html) {
            const temp = document.createElement('div');
            temp.innerHTML = html;
            temp.querySelectorAll('script, style').forEach(el => el.remove());
            temp.querySelectorAll('*').forEach(el => {
                for (const attr of [...el.attributes]) {
                    if (attr.name.startsWith('on')) el.removeAttribute(attr.name);
                }
            });
            document.execCommand('insertHTML', false, temp.innerHTML);
        } else {
            document.execCommand('insertText', false, text);
        }
        handleInput();
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
        if ((e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey) {
            switch (e.key.toLowerCase()) {
                case 'b':
                    e.preventDefault();
                    execCommand('bold');
                    return;
                case 'i':
                    e.preventDefault();
                    execCommand('italic');
                    return;
                case 'u':
                    e.preventDefault();
                    execCommand('underline');
                    return;
            }
        }
        if (e.key === 'Tab') {
            e.preventDefault();
            document.execCommand('insertText', false, '    ');
        }
        // If Enter is pressed and we are empty, ensure we stay in a paragraph
        if (e.key === 'Enter') {
            setTimeout(handleInput, 0);
        }
    };

    return (
        <div className="border border-border-primary rounded-xl overflow-hidden bg-bg-card">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-0.5 px-3 py-2 bg-bg-secondary border-b border-border-primary">
                {TOOLBAR.map((item) =>
                    item.separator ? (
                        <div key={item.key} className="w-px h-6 bg-border-primary mx-0.5" />
                    ) : (
                        <button
                            key={item.key}
                            type="button"
                            className="p-1.5 rounded-md text-text-secondary hover:text-text-primary hover:bg-bg-hover transition-colors"
                            title={item.label}
                            onMouseDown={(e) => {
                                e.preventDefault();
                                saveSelection();
                            }}
                            onClick={() => handleToolbar(item)}
                        >
                            <item.icon size={16} />
                        </button>
                    )
                )}

                <div className="flex-1" />

                <div className="flex items-center bg-bg-tertiary rounded-lg p-0.5">
                    <button type="button" onClick={() => switchMode('edit')}
                        className={`px-3 py-1 text-xs font-medium rounded-md transition-colors flex items-center gap-1 ${mode === 'edit' ? 'bg-bg-card text-text-primary shadow-sm' : 'text-text-tertiary hover:text-text-secondary'}`}>
                        <Edit3 size={13} /> Edit
                    </button>
                    <button type="button" onClick={() => switchMode('preview')}
                        className={`px-3 py-1 text-xs font-medium rounded-md transition-colors flex items-center gap-1 ${mode === 'preview' ? 'bg-bg-card text-text-primary shadow-sm' : 'text-text-tertiary hover:text-text-secondary'}`}>
                        <Eye size={13} /> Preview
                    </button>
                </div>
            </div>

            {/* Editor Area */}
            {mode === 'edit' ? (
                <div className="flex flex-col">
                    <div
                        ref={editorRef}
                        contentEditable
                        suppressContentEditableWarning
                        onInput={handleInput}
                        onPaste={handlePaste}
                        onKeyDown={handleKeyDown}
                        onBlur={saveSelection}
                        className="blog-content p-5 min-h-[400px] max-h-[600px] overflow-y-auto outline-none focus:outline-none"
                        style={{ minHeight: '400px' }}
                    />
                    <div className="flex items-center justify-between px-4 py-2 border-t border-border-secondary text-text-tertiary text-xs">
                        <span>{wordCount} words</span>
                        <span>Select text → click toolbar to format</span>
                    </div>
                </div>
            ) : (
                <div className="blog-content p-6 min-h-[400px] max-h-[600px] overflow-y-auto"
                    dangerouslySetInnerHTML={{ __html: htmlContent || '<p style="color: var(--text-tertiary)">Switch to Edit mode to start writing...</p>' }}
                />
            )}

            {/* Image Dialog */}
            {showImageDialog && (
                <div className="fixed inset-0 bg-bg-overlay z-[100] flex items-center justify-center p-4" onClick={() => setShowImageDialog(false)}>
                    <div className="bg-bg-card border border-border-primary rounded-xl p-6 w-full max-w-md shadow-lg animate-scale-in" onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
                            <ImageIcon size={20} /> Insert Image
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-text-secondary mb-1.5">Upload Image</label>
                                <div className="flex items-center gap-3">
                                    <input type="file" accept="image/*" onChange={handleImageFileSelect} disabled={uploadingImage}
                                        className="w-full text-xs text-text-tertiary file:mr-3 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-bg-tertiary file:text-text-secondary hover:file:bg-bg-hover cursor-pointer disabled:opacity-50" />
                                    {uploadingImage && <Loader2 className="w-5 h-5 animate-spin text-text-tertiary shrink-0" />}
                                </div>
                            </div>
                            
                            <div className="relative py-2 flex items-center">
                                <div className="flex-grow border-t border-border-secondary"></div>
                                <span className="flex-shrink mx-4 text-xs text-text-tertiary font-medium">OR</span>
                                <div className="flex-grow border-t border-border-secondary"></div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-text-secondary mb-1">Image URL</label>
                                <input type="url" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)}
                                    placeholder="https://example.com/photo.jpg" className="input-clean w-full" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-text-secondary mb-1">Caption / Alt Text</label>
                                <input type="text" value={imageAlt} onChange={(e) => setImageAlt(e.target.value)}
                                    placeholder="Describe the image" className="input-clean w-full" />
                            </div>
                            
                            {imageUrl && (
                                <div className="border border-border-secondary rounded-lg p-3 bg-bg-secondary max-h-40 overflow-hidden">
                                    <img src={imageUrl} alt="preview" className="max-h-32 rounded-md object-contain mx-auto" />
                                </div>
                            )}
                        </div>
                        <div className="flex justify-end gap-2 mt-6">
                            <button type="button" onClick={() => setShowImageDialog(false)} disabled={uploadingImage} className="btn-secondary text-sm py-2 px-4 min-h-0 min-w-0">Cancel</button>
                            <button type="button" onClick={handleInsertImage} disabled={!imageUrl.trim() || uploadingImage} className="btn-primary text-sm py-2 px-6 min-h-0 min-w-0 disabled:opacity-40">
                                {uploadingImage ? 'Uploading...' : 'Insert'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Link Dialog */}
            {showLinkDialog && (
                <div className="fixed inset-0 bg-bg-overlay z-[100] flex items-center justify-center p-4" onClick={() => setShowLinkDialog(false)}>
                    <div className="bg-bg-card border border-border-primary rounded-xl p-6 w-full max-w-md shadow-lg animate-scale-in" onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
                            <LinkIcon size={20} /> Insert Link
                        </h3>
                        <div className="space-y-3">
                            <div>
                                <label className="block text-sm font-medium text-text-secondary mb-1">URL *</label>
                                <input type="url" value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)}
                                    placeholder="https://example.com" className="input-clean w-full outline-none focus:ring-2 focus:ring-blue-500/20" autoFocus />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-text-secondary mb-1">Link Text</label>
                                <input type="text" value={linkText} onChange={(e) => setLinkText(e.target.value)}
                                    placeholder="Click here" className="input-clean w-full outline-none focus:ring-2 focus:ring-blue-500/20" />
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 mt-5">
                            <button type="button" onClick={() => setShowLinkDialog(false)} className="btn-secondary text-sm py-2 px-4 min-h-0 min-w-0">Cancel</button>
                            <button type="button" onClick={handleInsertLink} disabled={!linkUrl.trim()} className="btn-primary text-sm py-2 px-6 min-h-0 min-w-0 disabled:opacity-40">Insert</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

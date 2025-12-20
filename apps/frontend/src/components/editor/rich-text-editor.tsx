'use client';

import { useMemo, useCallback, useRef, useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import 'react-quill/dist/quill.snow.css';

// Dynamically import ReactQuill to avoid SSR issues
const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });

interface RichTextEditorProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
}

export function RichTextEditor({ value, onChange, placeholder, className }: RichTextEditorProps) {
    const quillRef = useRef<any>(null);
    const [quillInstance, setQuillInstance] = useState<any>(null);

    const imageHandler = useCallback(async () => {
        const input = document.createElement('input');
        input.setAttribute('type', 'file');
        input.setAttribute('accept', 'image/*');
        input.click();

        input.onchange = async () => {
            const file = input.files?.[0];
            if (!file) return;

            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                alert('Kích thước ảnh không được vượt quá 5MB');
                return;
            }

            // Validate file type
            if (!file.type.startsWith('image/')) {
                alert('Vui lòng chọn file ảnh');
                return;
            }

            try {
                // Create FormData
                const formData = new FormData();
                formData.append('file', file);
                formData.append('folder', 'pages');

                // Upload to backend
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/pages/upload-image`, {
                    method: 'POST',
                    credentials: 'include',
                    body: formData,
                });

                if (!response.ok) {
                    throw new Error('Upload failed');
                }

                const data = await response.json();
                const imageUrl = data.data?.url || data.url;

                if (!imageUrl) {
                    throw new Error('No image URL returned');
                }

                // Use stored quill instance or find from DOM
                let quill = quillInstance;
                
                if (!quill) {
                    // Try to find from DOM
                    const quillContainer = document.querySelector('.quill');
                    if (quillContainer) {
                        quill = (quillContainer as any).__quill || (window as any).Quill?.find(quillContainer);
                    }
                }
                
                if (quill) {
                    try {
                        const range = quill.getSelection(true);
                        const index = range ? range.index : quill.getLength() - 1;
                        quill.insertEmbed(index, 'image', imageUrl);
                        quill.setSelection(index + 1);
                    } catch (err) {
                        console.error('Error inserting image:', err);
                        // Fallback: manually insert HTML
                        const currentContent = value || '';
                        const imgTag = `<img src="${imageUrl}" style="max-width: 100%;" />`;
                        onChange(currentContent + imgTag);
                    }
                } else {
                    console.error('Quill instance not found, inserting as HTML');
                    // Fallback: insert as HTML directly
                    const currentContent = value || '';
                    const imgTag = `<img src="${imageUrl}" style="max-width: 100%;" />`;
                    onChange(currentContent + imgTag);
                }
            } catch (error: any) {
                console.error('Error uploading image:', error);
                alert('Có lỗi xảy ra khi upload ảnh. Vui lòng thử lại.');
            }
        };
    }, []);

    const modules = useMemo(
        () => ({
            toolbar: {
                container: [
                    [{ header: [1, 2, 3, 4, 5, 6, false] }],
                    [{ font: [] }],
                    [{ size: [] }],
                    ['bold', 'italic', 'underline', 'strike', 'blockquote'],
                    [{ list: 'ordered' }, { list: 'bullet' }, { indent: '-1' }, { indent: '+1' }],
                    [{ color: [] }, { background: [] }],
                    [{ align: [] }],
                    ['link', 'image', 'video'],
                    ['clean'],
                ],
                handlers: {
                    image: imageHandler,
                },
            },
            clipboard: {
                matchVisual: false,
            },
        }),
        [imageHandler]
    );

    const formats = [
        'header',
        'font',
        'size',
        'bold',
        'italic',
        'underline',
        'strike',
        'blockquote',
        'list',
        'bullet',
        'indent',
        'color',
        'background',
        'align',
        'link',
        'image',
        'video',
    ];

    // Get quill instance after component mounts
    useEffect(() => {
        const timer = setTimeout(() => {
            const quillContainer = document.querySelector('.quill');
            if (quillContainer && !quillInstance) {
                const quill = (quillContainer as any).__quill || (window as any).Quill?.find(quillContainer);
                if (quill) {
                    setQuillInstance(quill);
                }
            }
        }, 100);
        return () => clearTimeout(timer);
    }, [quillInstance, value]);

    return (
        <div className={className}>
            <ReactQuill
                theme="snow"
                value={value}
                onChange={onChange}
                modules={modules}
                formats={formats}
                placeholder={placeholder || 'Nhập nội dung...'}
                className="bg-white dark:bg-gray-700"
            />
            <style jsx global>{`
                .quill {
                    background: white;
                }
                .dark .quill {
                    background: #1f2937;
                }
                .quill .ql-container {
                    min-height: 300px;
                    font-size: 16px;
                }
                .quill .ql-editor {
                    min-height: 300px;
                    color: #111827;
                }
                .dark .quill .ql-editor {
                    color: #f3f4f6;
                }
                .quill .ql-toolbar {
                    border-top-left-radius: 0.5rem;
                    border-top-right-radius: 0.5rem;
                    border-bottom: 1px solid #e5e7eb;
                }
                .dark .quill .ql-toolbar {
                    border-bottom-color: #374151;
                    background: #374151;
                }
                .quill .ql-container {
                    border-bottom-left-radius: 0.5rem;
                    border-bottom-right-radius: 0.5rem;
                    border: 1px solid #e5e7eb;
                }
                .dark .quill .ql-container {
                    border-color: #374151;
                }
                .quill .ql-stroke {
                    stroke: #6b7280;
                }
                .dark .quill .ql-stroke {
                    stroke: #9ca3af;
                }
                .quill .ql-fill {
                    fill: #6b7280;
                }
                .dark .quill .ql-fill {
                    fill: #9ca3af;
                }
                .quill .ql-picker-label {
                    color: #6b7280;
                }
                .dark .quill .ql-picker-label {
                    color: #9ca3af;
                }
            `}</style>
        </div>
    );
}


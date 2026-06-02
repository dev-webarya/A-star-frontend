import React, { useMemo } from 'react';
import MathEditor from './MathEditor';
import SolutionList from './SolutionList';
import { Question } from './QuestionList';
import katex from 'katex';
import 'katex/dist/katex.min.css';

interface QuestionModalProps {
  question: Question;
  fullQuestion?: any;
  onClose: () => void;
  onSubmitSolution: (latex: string) => void;
  solutions: { user: string; latex: string }[];
}

const renderMathInHTML = (html: string): string => {
  if (!html) return '';
  let result = html;
  result = result.replace(/\$\$([^$]+)\$\$/g, (match, formula) => {
    try {
      return `<div class="math-block py-4 overflow-x-auto">${katex.renderToString(formula.trim(), { throwOnError: false, displayMode: true })}</div>`;
    } catch { return match; }
  });
  result = result.replace(/(?<!\$)\$([^$]+)\$(?!\$)/g, (match, formula) => {
    try {
      return `<span class="math-inline px-1">${katex.renderToString(formula.trim(), { throwOnError: false, displayMode: false })}</span>`;
    } catch { return match; }
  });
  return result;
};

const QuestionModal: React.FC<QuestionModalProps> = ({ question, fullQuestion, onClose, onSubmitSolution, solutions }) => {
  const renderedHtml = useMemo(() => renderMathInHTML(fullQuestion?.descriptionHtml || ''), [fullQuestion]);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6 relative my-8">
        <button className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-2xl" onClick={onClose}>&times;</button>
        <h2 className="text-2xl font-bold text-indigo-700 mb-2">{question.title}</h2>
        
        {renderedHtml && (
          <div 
            className="mb-4 text-gray-700 prose prose-indigo max-w-none"
            dangerouslySetInnerHTML={{ __html: renderedHtml }}
          />
        )}
        
        {!renderedHtml && (
          <div className="mb-4 text-gray-700">{question.description}</div>
        )}

        <div className="border-t pt-4 mt-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Submit your solution</h3>
          <MathEditor onSubmit={onSubmitSolution} />
        </div>

        <div className="border-t pt-4 mt-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Approved Solutions</h3>
          <SolutionList solutions={solutions} />
        </div>
        
        <div className="mt-4 text-xs text-gray-500">Total Approved Solutions: {solutions.length}</div>
      </div>
    </div>
  );
};

export default QuestionModal;
